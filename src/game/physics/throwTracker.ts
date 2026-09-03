/**
 * Per-bean throw telemetry. One `ThrowTracker` is created when a bean is
 * grabbed and lives until the bean is resolved (hopper entry) or settles.
 *
 * The velocity maths is a free function so it can be unit-tested without a
 * bean, an engine, or a clock.
 */

import type { PhysicsConfig } from './physicsConfig.ts'
import type { BeanId, ThrowTelemetry, Vec } from './types.ts'

export interface PointerSample {
  /** Scene px. */
  x: number
  y: number
  /** `performance.now()` ms. */
  t: number
}

export interface ReleaseVelocity {
  x: number
  y: number
  speed: number
}

const ZERO: ReleaseVelocity = { x: 0, y: 0, speed: 0 }

/**
 * Derive release velocity from the tail of the pointer's motion, not from the
 * whole drag. Uses the most recent sample as the end point and the oldest
 * sample still inside `sampleWindowMs` as the start point, so a slow drag that
 * ends in a fast flick still throws fast.
 *
 * Guards: fewer than two usable samples, or a time delta below `minSampleDt`,
 * yield zero (which the classifier reads as a direct drop). The result is
 * scaled by `speedScale` and its magnitude clamped to `maxSpeed`.
 */
export function sampleReleaseVelocity(
  samples: readonly PointerSample[],
  cfg: PhysicsConfig['throw'],
): ReleaseVelocity {
  if (samples.length < 2) return ZERO

  const end = samples[samples.length - 1]
  const windowStart = end.t - cfg.sampleWindowMs

  // Oldest sample within the window (fall back to the second-to-last).
  let start = samples[samples.length - 2]
  for (let i = 0; i < samples.length - 1; i += 1) {
    if (samples[i].t >= windowStart) {
      start = samples[i]
      break
    }
  }

  const dt = end.t - start.t
  if (!Number.isFinite(dt) || dt < cfg.minSampleDt) return ZERO

  // px/ms -> px/s
  let vx = ((end.x - start.x) / dt) * 1000 * cfg.speedScale
  let vy = ((end.y - start.y) / dt) * 1000 * cfg.speedScale
  if (!Number.isFinite(vx) || !Number.isFinite(vy)) return ZERO

  let speed = Math.hypot(vx, vy)
  if (speed > cfg.maxSpeed) {
    const k = cfg.maxSpeed / speed
    vx *= k
    vy *= k
    speed = cfg.maxSpeed
  }

  return { x: vx, y: vy, speed }
}

export class ThrowTracker {
  readonly beanId: BeanId
  private readonly cfg: PhysicsConfig
  private readonly samples: PointerSample[] = []
  private readonly dragStart: Vec

  private released = false
  private releasedBeforeGrinder = true
  private releasePos: Vec
  private releaseTime = 0
  /** Bean body velocity at release, px/s — the launch value scoring uses. */
  private releaseVelocity: Vec = { x: 0, y: 0 }
  private releaseSpeed = 0
  /** Player gesture velocity at release, px/s — telemetry only. */
  private pointerReleaseVelocity: Vec = { x: 0, y: 0 }
  private pointerReleaseSpeed = 0

  private lastCenter: Vec
  private postReleaseTravel = 0
  private bounceCount = 0
  private lastBounceAt = -Infinity
  /** Continuous rest start; -1 when moving. */
  private restSince = -1

  constructor(beanId: BeanId, pointer: Vec, nowMs: number, cfg: PhysicsConfig) {
    this.beanId = beanId
    this.cfg = cfg
    this.dragStart = { ...pointer }
    this.releasePos = { ...pointer }
    this.lastCenter = { ...pointer }
    this.addPointerSample(pointer, nowMs)
  }

  addPointerSample(pointer: Vec, nowMs: number): void {
    this.samples.push({ x: pointer.x, y: pointer.y, t: nowMs })
    // Keep a little more than the sampling window; this is not a history buffer.
    const cutoff = nowMs - this.cfg.throw.sampleWindowMs * 3
    while (this.samples.length > 2 && this.samples[0].t < cutoff) {
      this.samples.shift()
    }
  }

  /**
   * Genuine release. `beanVelocity` is the bean body's own velocity (px/s) the
   * instant the tether is cut — that becomes the launch velocity, swing
   * momentum included. The pointer gesture is sampled too, but only for
   * telemetry.
   */
  release(center: Vec, beanVelocity: Vec, nowMs: number): void {
    if (this.released) return
    this.released = true
    this.releasedBeforeGrinder = true
    this.releasePos = { ...center }
    this.lastCenter = { ...center }
    this.releaseTime = nowMs
    this.releaseVelocity = { x: beanVelocity.x, y: beanVelocity.y }
    this.releaseSpeed = Math.hypot(beanVelocity.x, beanVelocity.y)
    this.capturePointerGesture()
  }

  /** The bean reached the hopper while still held — a direct drag-in. */
  markEnteredWhileHeld(center: Vec, nowMs: number): void {
    if (this.released) return
    this.released = true
    this.releasedBeforeGrinder = false
    this.releasePos = { ...center }
    this.releaseTime = nowMs
    this.releaseVelocity = { x: 0, y: 0 }
    this.releaseSpeed = 0
    this.capturePointerGesture()
  }

  private capturePointerGesture(): void {
    const v = sampleReleaseVelocity(this.samples, this.cfg.throw)
    this.pointerReleaseVelocity = { x: v.x, y: v.y }
    this.pointerReleaseSpeed = v.speed
  }

  /** Recent pointer-gesture speed, px/s — for the live debug readout. */
  pointerSpeed(): number {
    return sampleReleaseVelocity(this.samples, this.cfg.throw).speed
  }

  /** Called every engine step while the bean is tracked. */
  onFrame(center: Vec, speed: number, nowMs: number): void {
    if (this.released) {
      this.postReleaseTravel += Math.hypot(center.x - this.lastCenter.x, center.y - this.lastCenter.y)
    }
    this.lastCenter = { x: center.x, y: center.y }

    if (speed <= this.cfg.beans.restSpeed) {
      if (this.restSince < 0) this.restSince = nowMs
    } else {
      this.restSince = -1
    }
  }

  registerBounce(impactSpeed: number, nowMs: number): void {
    if (!this.released) return
    if (impactSpeed < this.cfg.bounce.minSpeed) return
    if (nowMs - this.lastBounceAt < this.cfg.bounce.cooldownMs) return
    this.lastBounceAt = nowMs
    this.bounceCount += 1
  }

  /** True once the bean has been at rest long enough to stop tracking it. */
  hasSettled(nowMs: number): boolean {
    return this.released && this.restSince >= 0 && nowMs - this.restSince >= this.cfg.beans.settleMs
  }

  finalize(nowMs: number, entrySpeed: number, success: boolean): ThrowTelemetry {
    return {
      beanId: this.beanId,
      dragStart: { ...this.dragStart },
      releasePos: { ...this.releasePos },
      releaseTime: this.releaseTime,
      releaseVelocity: { ...this.releaseVelocity },
      releaseSpeed: this.releaseSpeed,
      pointerReleaseVelocity: { ...this.pointerReleaseVelocity },
      pointerReleaseSpeed: this.pointerReleaseSpeed,
      releasedBeforeGrinder: this.releasedBeforeGrinder,
      postReleaseTravel: this.postReleaseTravel,
      airtimeMs: this.releaseTime > 0 ? Math.max(0, nowMs - this.releaseTime) : 0,
      bounceCount: this.bounceCount,
      entrySpeed,
      success,
    }
  }
}
