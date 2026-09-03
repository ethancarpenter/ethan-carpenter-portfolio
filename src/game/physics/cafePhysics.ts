/**
 * The bean toy's engine controller. Owns exactly one Matter.js `Engine` and
 * `Runner` for the lifetime of one <PhysicsLayer> mount, and nothing about
 * React beyond the callbacks it is handed.
 *
 * Responsibilities:
 *  - build static geometry from the shared scene config (walls, funnel, sensor)
 *  - spawn beans and keep one grabbable "ready" bean at the bowl
 *  - a spring-tether grab: the pointer is an anchor, the bean swings around it
 *  - hopper sensor detection -> telemetry -> pure classification -> callback
 *  - stay aligned with the visible scene on resize / breakpoint change
 *  - tear everything down cleanly (React Strict Mode double-mounts this)
 */

import Matter from 'matter-js'

import {
  createBeanBody,
  createSegmentBody,
  createSensorBody,
  isBean,
  isEnvironment,
  isSensor,
} from './beanFactory.ts'
import { PHYSICS, withReducedMotion } from './physicsConfig.ts'
import type { PhysicsConfig } from './physicsConfig.ts'
import { resolveSceneGeometry } from './sceneGeometry.ts'
import type { SceneGeometry, Size } from './sceneGeometry.ts'
import { clampAnchorToBounds, clampSpeed, separationCorrection } from './tether.ts'
import { ThrowTracker } from './throwTracker.ts'
import type { BeanState, PhysicsDebugState, ThrowResult, ThrowTelemetry, Vec } from './types.ts'
import type { SceneLayout } from '../sceneConfig.ts'
import { toThrowResult } from '../scoring/throwScoring.ts'

const { Body, Composite, Constraint, Engine, Events, Query, Runner, Sleeping } = Matter

/** Matter integrates in ~1/60 s steps; velocities are px per step, not per second. */
const STEP_HZ = 60

/** matter-js 0.20 honours `body.gravityScale` at runtime; `@types/matter-js` omits it. */
function setGravityScale(body: Matter.Body, scale: number): void {
  ;(body as Matter.Body & { gravityScale: number }).gravityScale = scale
}

export interface CafePhysicsOptions {
  /** The physics layer element; its box is the world. */
  container: HTMLElement
  canvas: HTMLCanvasElement
  layout: SceneLayout
  reducedMotion: boolean
  /** Fired once, on the first successful bean grab (wire to autoCollapse). */
  onFirstInteraction: () => void
  /** Every accepted throw, already classified. The Milestone 3 seam. */
  onThrowResolved?: (result: ThrowResult) => void
  /** Dev-only debug snapshots. Never called per frame. */
  onDebugState?: (state: PhysicsDebugState) => void
}

interface BeanEntry {
  body: Matter.Body
  state: BeanState
  /** `performance.now()` when the bean last entered play; drives cull order. */
  spawnedAt: number
}


export class CafePhysics {
  private readonly opts: CafePhysicsOptions
  private readonly cfg: PhysicsConfig
  private readonly container: HTMLElement
  private readonly canvas: HTMLCanvasElement
  private readonly ctx: CanvasRenderingContext2D
  private readonly engine: Matter.Engine
  private readonly world: Matter.World
  private readonly runner: Matter.Runner
  private readonly abort = new AbortController()
  private readonly resizeObserver: ResizeObserver

  private layout: SceneLayout
  private geometry: SceneGeometry
  private dpr = 1

  private readonly beans = new Map<number, BeanEntry>()
  private readonly trackers = new Map<number, ThrowTracker>()
  private staticBodies: Matter.Body[] = []
  private removeQueue: Matter.Body[] = []

  private readyId: number | null = null
  private heldId: number | null = null
  private activePointerId: number | null = null
  /** Raw pointer position in scene px; the spring anchor is this, clamped. */
  private pointerWorld: Vec = { x: 0, y: 0 }
  /** The active grab spring, or null when nothing is held. */
  private grabConstraint: Matter.Constraint | null = null

  private replaceTimer: number | null = null
  private debugTimer: number | null = null
  private debugFrame = 0
  private firstInteractionDone = false
  private debugDraw = false
  private destroyed = false

  private lastThrow: ThrowResult | null = null

  constructor(opts: CafePhysicsOptions) {
    this.opts = opts
    this.cfg = withReducedMotion(PHYSICS, opts.reducedMotion)
    this.container = opts.container
    this.canvas = opts.canvas
    this.layout = opts.layout

    const ctx = this.canvas.getContext('2d')
    if (!ctx) throw new Error('CafePhysics: 2D canvas context unavailable')
    this.ctx = ctx

    this.engine = Engine.create()
    this.engine.gravity.y = this.cfg.gravity.y
    this.engine.gravity.scale = this.cfg.gravity.scale
    this.engine.enableSleeping = true
    this.world = this.engine.world
    this.runner = Runner.create()

    const size = this.measure()
    this.geometry = resolveSceneGeometry(this.layout, size, this.cfg)
    this.rebuildStatics()
    this.resizeCanvas(size)

    Events.on(this.engine, 'beforeUpdate', this.onBeforeUpdate)
    Events.on(this.engine, 'afterUpdate', this.onAfterUpdate)
    Events.on(this.engine, 'collisionStart', this.onCollisionStart)

    const { signal } = this.abort
    const c = this.canvas
    c.addEventListener('pointerdown', this.onPointerDown, { signal })
    c.addEventListener('pointermove', this.onPointerMove, { signal })
    c.addEventListener('pointerup', this.onPointerEnd, { signal })
    c.addEventListener('pointercancel', this.onPointerCancel, { signal })
    c.addEventListener('lostpointercapture', this.onPointerCancel, { signal })
    window.addEventListener('blur', this.onWindowBlur, { signal })

    this.resizeObserver = new ResizeObserver(this.onResize)
    this.resizeObserver.observe(this.container)

    this.spawnReadyBean()
    Runner.run(this.runner, this.engine)

    if (this.opts.onDebugState) {
      this.debugTimer = window.setInterval(this.emitDebug, 400)
    }
    this.emitDebug()
  }

  /** React calls this when the responsive layout switches. */
  setLayout(layout: SceneLayout): void {
    if (this.destroyed) return
    this.applyGeometry(layout, this.measure())
  }

  /** Dev debug-panel checkbox: draw colliders + velocity vectors on the canvas. */
  setDebug(on: boolean): void {
    this.debugDraw = on
  }

  destroy(): void {
    if (this.destroyed) return
    this.destroyed = true
    if (this.replaceTimer != null) window.clearTimeout(this.replaceTimer)
    if (this.debugTimer != null) window.clearInterval(this.debugTimer)
    this.abort.abort()
    this.resizeObserver.disconnect()
    this.detachGrab()
    Runner.stop(this.runner)
    Events.off(this.engine, 'beforeUpdate', this.onBeforeUpdate)
    Events.off(this.engine, 'afterUpdate', this.onAfterUpdate)
    Events.off(this.engine, 'collisionStart', this.onCollisionStart)
    Composite.clear(this.world, false, true)
    Engine.clear(this.engine)
    this.beans.clear()
    this.trackers.clear()
    this.removeQueue = []
    this.ctx.setTransform(1, 0, 0, 1, 0, 0)
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height)
  }

  // ---------------------------------------------------------------- geometry

  private measure(): Size {
    const rect = this.container.getBoundingClientRect()
    return { width: Math.max(1, rect.width), height: Math.max(1, rect.height) }
  }

  private applyGeometry(layout: SceneLayout, size: Size): void {
    const prev = this.geometry
    this.layout = layout
    this.geometry = resolveSceneGeometry(layout, size, this.cfg)

    if (prev.size.width !== size.width || prev.size.height !== size.height) {
      const kx = size.width / prev.size.width
      const ky = size.height / prev.size.height
      for (const entry of this.beans.values()) {
        // The held bean is rescaled too so it stays with the anchor; the
        // spring reconciles the small mismatch on the next step, and the
        // maxSeparation clamp in onBeforeUpdate is the hard backstop.
        Body.setPosition(entry.body, {
          x: entry.body.position.x * kx,
          y: entry.body.position.y * ky,
        })
        if (entry.state === 'held') {
          this.pointerWorld = { x: this.pointerWorld.x * kx, y: this.pointerWorld.y * ky }
          Body.setVelocity(entry.body, { x: 0, y: 0 })
        }
      }
    }

    this.rebuildStatics()
    this.resizeCanvas(size)
  }

  private rebuildStatics(): void {
    if (this.staticBodies.length) Composite.remove(this.world, this.staticBodies)
    this.staticBodies = [
      ...this.geometry.segments.map(createSegmentBody),
      createSensorBody(this.geometry.sensor),
    ]
    Composite.add(this.world, this.staticBodies)
  }

  private resizeCanvas(size: Size): void {
    const dpr = Math.min(window.devicePixelRatio || 1, 2)
    this.dpr = dpr
    this.canvas.width = Math.max(1, Math.round(size.width * dpr))
    this.canvas.height = Math.max(1, Math.round(size.height * dpr))
  }

  private onResize = (): void => {
    if (this.destroyed) return
    const rect = this.container.getBoundingClientRect()
    if (rect.width < 1 || rect.height < 1) return
    this.applyGeometry(this.layout, { width: rect.width, height: rect.height })
  }

  // ------------------------------------------------------------------ spawn

  private spawnReadyBean = (): void => {
    if (this.destroyed) return
    if (this.readyId != null && this.beans.has(this.readyId)) return
    const { spawn } = this.geometry
    const body = createBeanBody(spawn.x, spawn.y, this.cfg)
    Composite.add(this.world, body)
    this.beans.set(body.id, { body, state: 'ready', spawnedAt: performance.now() })
    this.readyId = body.id
  }

  private ensureReadyBeanSoon(): void {
    if (this.destroyed || this.replaceTimer != null) return
    if (this.readyId != null && this.beans.has(this.readyId)) return
    this.replaceTimer = window.setTimeout(() => {
      this.replaceTimer = null
      this.spawnReadyBean()
    }, this.cfg.beans.replaceDelayMs)
  }

  private enforceCap(): void {
    const loose: BeanEntry[] = []
    for (const entry of this.beans.values()) {
      if (entry.state === 'loose') loose.push(entry)
    }
    let over = loose.length - this.cfg.beans.maxLoose
    if (over <= 0) return
    loose.sort((a, b) => a.spawnedAt - b.spawnedAt)
    for (const entry of loose) {
      if (over <= 0) break
      this.beans.delete(entry.body.id)
      this.trackers.delete(entry.body.id)
      this.removeQueue.push(entry.body)
      over -= 1
    }
  }

  // ---------------------------------------------------------------- pointer

  private toWorld(e: PointerEvent): { x: number; y: number } {
    const rect = this.canvas.getBoundingClientRect()
    return { x: e.clientX - rect.left, y: e.clientY - rect.top }
  }

  /**
   * The grab is a single Matter spring constraint from a moving world point
   * (the pointer anchor) to the bean's centre. Low stiffness + damping makes
   * it a short, swingy tether rather than a rigid rope: the bean lags, orbits,
   * and builds tangential momentum the player can fling.
   */
  private attachGrab(entry: BeanEntry, anchor: Vec): void {
    const { tether } = this.cfg
    const constraint = Constraint.create({
      pointA: { x: anchor.x, y: anchor.y },
      bodyB: entry.body,
      pointB: { x: 0, y: 0 },
      length: tether.length,
      stiffness: tether.stiffness,
      damping: tether.damping,
    })
    this.grabConstraint = constraint
    Composite.add(this.world, constraint)
    setGravityScale(entry.body, tether.heldGravityScale)
  }

  /** Always paired with ending a grab — never leave a dangling constraint. */
  private detachGrab(): void {
    if (!this.grabConstraint) return
    Composite.remove(this.world, this.grabConstraint)
    this.grabConstraint = null
  }

  /**
   * The bean under a press. Prefers a direct hit (topmost wins); a bean is
   * only ~15x10 px, so if nothing is hit directly we fall back to the nearest
   * grabbable bean within a forgiving radius — this is what makes a fingertip
   * tap land on a bean.
   */
  private grabbableAt(point: { x: number; y: number }): BeanEntry | null {
    let direct: BeanEntry | null = null
    let nearest: BeanEntry | null = null
    let nearestDist = this.cfg.bean.width * 1.8

    for (const entry of this.beans.values()) {
      if (entry.state !== 'ready' && entry.state !== 'loose') continue
      if (Query.point([entry.body], point).length > 0) {
        direct = entry // last hit = topmost
        continue
      }
      const d = Math.hypot(entry.body.position.x - point.x, entry.body.position.y - point.y)
      if (d < nearestDist) {
        nearestDist = d
        nearest = entry
      }
    }
    return direct ?? nearest
  }

  private onPointerDown = (e: PointerEvent): void => {
    if (this.destroyed || this.heldId != null) return
    const world = this.toWorld(e)
    const entry = this.grabbableAt(world)
    if (!entry) return

    e.preventDefault()
    try {
      this.canvas.setPointerCapture(e.pointerId)
    } catch {
      /* capture is best-effort */
    }

    const now = performance.now()
    this.activePointerId = e.pointerId
    this.pointerWorld = world
    this.heldId = entry.body.id

    const wasReady = entry.body.id === this.readyId
    entry.state = 'held'
    Sleeping.set(entry.body, false)
    if (wasReady) {
      this.readyId = null
      this.ensureReadyBeanSoon()
    }

    this.attachGrab(entry, world)
    this.trackers.set(entry.body.id, new ThrowTracker(entry.body.id, world, now, this.cfg))
    this.canvas.dataset.dragging = 'true'

    if (!this.firstInteractionDone) {
      this.firstInteractionDone = true
      this.opts.onFirstInteraction()
    }
    this.emitDebug()
  }

  private onPointerMove = (e: PointerEvent): void => {
    if (this.destroyed || this.heldId == null || e.pointerId !== this.activePointerId) return
    const world = this.toWorld(e)
    this.pointerWorld = world
    this.trackers.get(this.heldId)?.addPointerSample(world, performance.now())
  }

  private onPointerEnd = (e: PointerEvent): void => {
    if (e.pointerId !== this.activePointerId) return
    this.endDrag('release')
  }

  private onPointerCancel = (e: PointerEvent): void => {
    if (e.pointerId !== this.activePointerId) return
    this.endDrag('cancel')
  }

  private onWindowBlur = (): void => {
    if (this.heldId != null) this.endDrag('cancel')
  }

  private endDrag(kind: 'release' | 'cancel'): void {
    const id = this.heldId
    const pointerId = this.activePointerId
    this.heldId = null
    this.activePointerId = null
    this.detachGrab()
    delete this.canvas.dataset.dragging
    if (pointerId != null) {
      try {
        this.canvas.releasePointerCapture(pointerId)
      } catch {
        /* already released */
      }
    }

    if (id == null) return this.emitDebug()
    const entry = this.beans.get(id)
    if (!entry || entry.state !== 'held') return this.emitDebug()

    entry.state = 'loose'
    entry.spawnedAt = performance.now() // a fresh throw shouldn't be first to be culled
    setGravityScale(entry.body, 1)
    const tracker = this.trackers.get(id)
    const center = { x: entry.body.position.x, y: entry.body.position.y }
    const now = performance.now()

    if (kind === 'release') {
      // Cut the tether and KEEP the bean's own momentum — the swing is the
      // throw. Only clamp genuinely extreme speeds and runaway spin.
      const launch = clampSpeed(
        { x: entry.body.velocity.x * STEP_HZ, y: entry.body.velocity.y * STEP_HZ },
        this.cfg.throw.maxSpeed,
      )
      Body.setVelocity(entry.body, { x: launch.x / STEP_HZ, y: launch.y / STEP_HZ })
      const spin = entry.body.angularVelocity
      if (Math.abs(spin) > this.cfg.throw.maxSpin) {
        Body.setAngularVelocity(entry.body, Math.sign(spin) * this.cfg.throw.maxSpin)
      }
      tracker?.release(center, launch, now)
    } else {
      // pointercancel / lost capture / blur: interrupted gesture, drop in place.
      Body.setVelocity(entry.body, { x: 0, y: 0 })
      Body.setAngularVelocity(entry.body, 0)
      tracker?.release(center, { x: 0, y: 0 }, now)
    }
    this.emitDebug()
  }

  // --------------------------------------------------------------- stepping

  private onBeforeUpdate = (): void => {
    if (this.destroyed || this.heldId == null || !this.grabConstraint) return
    const entry = this.beans.get(this.heldId)
    if (!entry) {
      this.detachGrab()
      this.heldId = null
      return
    }

    // Move the spring anchor to the (bounds-clamped) pointer. No Body.setPosition
    // pin — Matter simulates the bean swinging toward the anchor.
    const anchor = clampAnchorToBounds(
      this.pointerWorld,
      this.geometry.size,
      this.cfg.walls.cleanupMargin,
    )
    this.grabConstraint.pointA = anchor
    Sleeping.set(entry.body, false)

    // Hard safety: the bean may never run away from the anchor.
    const corrected = separationCorrection(
      entry.body.position,
      anchor,
      this.cfg.tether.maxSeparation,
    )
    if (corrected) {
      Body.setPosition(entry.body, corrected)
      Body.setVelocity(entry.body, {
        x: entry.body.velocity.x * 0.5,
        y: entry.body.velocity.y * 0.5,
      })
    }
  }

  private onAfterUpdate = (): void => {
    if (this.destroyed) return
    const now = performance.now()

    if (this.removeQueue.length) {
      Composite.remove(this.world, this.removeQueue)
      this.removeQueue = []
    }

    const cull = this.geometry.cleanup
    for (const entry of this.beans.values()) {
      if (entry.state === 'consumed') continue
      const pos = entry.body.position

      if (pos.x < cull.minX || pos.x > cull.maxX || pos.y > cull.maxY) {
        this.beans.delete(entry.body.id)
        this.trackers.delete(entry.body.id)
        this.removeQueue.push(entry.body)
        if (this.readyId === entry.body.id) this.readyId = null
        continue
      }

      if (entry.state === 'loose') {
        const tracker = this.trackers.get(entry.body.id)
        if (tracker) {
          tracker.onFrame({ x: pos.x, y: pos.y }, entry.body.speed * STEP_HZ, now)
          if (tracker.hasSettled(now)) this.trackers.delete(entry.body.id)
        }
      }
    }

    if (this.readyId == null) this.ensureReadyBeanSoon()
    this.enforceCap()
    this.draw()

    // Live debug readouts while dragging — ~10 Hz, dev-only, not per frame.
    this.debugFrame += 1
    if (this.heldId != null && this.debugFrame % 6 === 0) this.emitDebug()
  }

  private onCollisionStart = (event: Matter.IEventCollision<Matter.Engine>): void => {
    if (this.destroyed) return
    const now = performance.now()
    for (const pair of event.pairs) {
      const beanBody = isBean(pair.bodyA) ? pair.bodyA : isBean(pair.bodyB) ? pair.bodyB : null
      if (!beanBody) continue
      const entry = this.beans.get(beanBody.id)
      if (!entry) continue
      const other = beanBody === pair.bodyA ? pair.bodyB : pair.bodyA

      if (isSensor(other)) {
        this.handleHopperEntry(entry, now)
      } else if (isEnvironment(other)) {
        this.trackers.get(beanBody.id)?.registerBounce(beanBody.speed * STEP_HZ, now)
      }
    }
  }

  // ---------------------------------------------------------------- scoring

  private handleHopperEntry(entry: BeanEntry, now: number): void {
    if (entry.state === 'consumed') return
    const wasHeld = entry.state === 'held'
    const id = entry.body.id

    entry.state = 'consumed'
    this.beans.delete(id) // stop drawing / tracking immediately (guards multi-tick events)
    this.removeQueue.push(entry.body)
    if (this.readyId === id) this.readyId = null

    const center = { x: entry.body.position.x, y: entry.body.position.y }
    const tracker = this.trackers.get(id)

    if (wasHeld) {
      // A tethered bean brought into the opening — still a direct drop (1x).
      tracker?.markEnteredWhileHeld(center, now)
      this.detachGrab()
      setGravityScale(entry.body, 1)
      const pointerId = this.activePointerId
      this.heldId = null
      this.activePointerId = null
      delete this.canvas.dataset.dragging
      if (pointerId != null) {
        try {
          this.canvas.releasePointerCapture(pointerId)
        } catch {
          /* noop */
        }
      }
    }

    const entrySpeed = entry.body.speed * STEP_HZ
    let telemetry: ThrowTelemetry
    if (tracker) {
      telemetry = tracker.finalize(now, entrySpeed, true)
      this.trackers.delete(id)
    } else {
      telemetry = this.fallbackTelemetry(id, center, now, entrySpeed)
    }

    const result = toThrowResult(telemetry, this.cfg.scoring)
    this.lastThrow = result
    this.opts.onThrowResolved?.(result)
    if (import.meta.env.DEV) {
      console.info(
        `%c[bean] ${result.label} — ${result.multiplier}x`,
        'color:#c96f4a;font-weight:bold',
        telemetry,
      )
    }
    this.emitDebug()
    this.spawnReadyBean()
  }

  private fallbackTelemetry(
    beanId: number,
    center: { x: number; y: number },
    now: number,
    entrySpeed: number,
  ): ThrowTelemetry {
    return {
      beanId,
      dragStart: { ...center },
      releasePos: { ...center },
      releaseTime: now,
      releaseVelocity: { x: 0, y: 0 },
      releaseSpeed: entrySpeed,
      pointerReleaseVelocity: { x: 0, y: 0 },
      pointerReleaseSpeed: 0,
      releasedBeforeGrinder: true,
      postReleaseTravel: 0,
      airtimeMs: 0,
      bounceCount: 0,
      entrySpeed,
      success: true,
    }
  }

  // ----------------------------------------------------------------- render

  private draw(): void {
    const { ctx } = this
    const { width, height } = this.geometry.size
    ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0)
    ctx.clearRect(0, 0, width, height)
    if (this.debugDraw) this.drawDebug(ctx)
    for (const entry of this.beans.values()) this.drawBean(ctx, entry)
  }

  private drawBean(ctx: CanvasRenderingContext2D, entry: BeanEntry): void {
    const { width: bw, height: bh } = this.cfg.bean
    const { x, y } = entry.body.position

    if (entry.state === 'ready') {
      ctx.beginPath()
      ctx.ellipse(x, y, bw / 2 + 3, bh / 2 + 3, 0, 0, Math.PI * 2)
      ctx.strokeStyle = 'rgba(246, 200, 116, 0.9)'
      ctx.lineWidth = 2
      ctx.stroke()
    }

    ctx.save()
    ctx.translate(x, y)
    ctx.rotate(entry.body.angle)
    ctx.beginPath()
    ctx.ellipse(0, 0, bw / 2, bh / 2, 0, 0, Math.PI * 2)
    ctx.fillStyle = '#2b1d14'
    ctx.fill()
    ctx.beginPath()
    ctx.moveTo(-bw / 2 + 2, 0)
    ctx.quadraticCurveTo(0, bh * 0.3, bw / 2 - 2, 0)
    ctx.strokeStyle = '#8b5e3c'
    ctx.lineWidth = 1.5
    ctx.stroke()
    ctx.restore()
  }

  private drawDebug(ctx: CanvasRenderingContext2D): void {
    for (const seg of this.geometry.segments) {
      ctx.save()
      ctx.translate(seg.cx, seg.cy)
      ctx.rotate(seg.angle)
      ctx.strokeStyle = 'rgba(120, 160, 255, 0.7)'
      ctx.lineWidth = 1
      ctx.strokeRect(-seg.width / 2, -seg.height / 2, seg.width, seg.height)
      ctx.restore()
    }
    const s = this.geometry.sensor
    ctx.strokeStyle = 'rgba(90, 220, 120, 0.9)'
    ctx.lineWidth = 2
    ctx.strokeRect(s.cx - s.width / 2, s.cy - s.height / 2, s.width, s.height)

    ctx.strokeStyle = 'rgba(233, 163, 61, 0.9)'
    ctx.lineWidth = 1
    for (const entry of this.beans.values()) {
      const { x, y } = entry.body.position
      const v = entry.body.velocity
      ctx.beginPath()
      ctx.moveTo(x, y)
      ctx.lineTo(x + v.x * 4, y + v.y * 4)
      ctx.stroke()
    }

    // Spring tether: anchor point + line to the held bean.
    const held = this.heldId != null ? this.beans.get(this.heldId) : undefined
    const anchor = this.grabConstraint?.pointA
    if (held && anchor) {
      ctx.strokeStyle = 'rgba(246, 200, 116, 0.9)'
      ctx.lineWidth = 1
      ctx.beginPath()
      ctx.moveTo(anchor.x, anchor.y)
      ctx.lineTo(held.body.position.x, held.body.position.y)
      ctx.stroke()
      ctx.fillStyle = 'rgba(246, 200, 116, 0.9)'
      ctx.beginPath()
      ctx.arc(anchor.x, anchor.y, 3, 0, Math.PI * 2)
      ctx.fill()
    }
  }

  private emitDebug = (): void => {
    if (this.destroyed || !this.opts.onDebugState) return

    const held = this.heldId != null ? this.beans.get(this.heldId) : undefined
    const anchor = this.grabConstraint?.pointA
    const heldBeanVelocity = held
      ? { x: held.body.velocity.x * STEP_HZ, y: held.body.velocity.y * STEP_HZ }
      : { x: 0, y: 0 }
    const heldTracker = this.heldId != null ? this.trackers.get(this.heldId) : undefined

    this.opts.onDebugState({
      lastThrow: this.lastThrow,
      activeBeanCount: this.beans.size,
      dragging: this.heldId != null,
      heldBeanSpeed: Math.hypot(heldBeanVelocity.x, heldBeanVelocity.y),
      heldBeanVelocity,
      pointerSpeed: heldTracker ? heldTracker.pointerSpeed() : 0,
      beanAnchorDistance:
        held && anchor
          ? Math.hypot(held.body.position.x - anchor.x, held.body.position.y - anchor.y)
          : 0,
      tether: {
        length: this.cfg.tether.length,
        stiffness: this.cfg.tether.stiffness,
        damping: this.cfg.tether.damping,
      },
    })
  }
}
