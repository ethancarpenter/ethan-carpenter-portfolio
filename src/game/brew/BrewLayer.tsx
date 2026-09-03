import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { CSSProperties, PointerEvent as ReactPointerEvent } from 'react'

import type { SceneLayout } from '../sceneConfig.ts'
import { BREW } from './brewConfig.ts'
import type { BrewConfig } from './brewConfig.ts'
import { anchorCenter, clientToScenePct, withinSnap } from './dragMath.ts'
import type { PctPoint } from './dragMath.ts'
import type { BrewApi } from './useBrew.ts'
import styles from './BrewLayer.module.css'

interface BrewLayerProps {
  className: string
  layout: SceneLayout
  brew: BrewApi
  reducedMotion: boolean
  cfg?: BrewConfig
}

interface Cluster {
  id: number
  /** Horizontal position within the fall zone, %. */
  left: number
  delayMs: number
}

let clusterSeq = 0

/**
 * The coffee filter basket under the grinder: the paper filter, the grounds
 * that visibly accumulate inside it (the primary progress indicator), the short
 * falling-ground effect after each grind cycle, and the drag-to-the-machine
 * interaction once it's full.
 *
 * This layer owns only presentation and the drag gesture. All state — how much
 * is ground, whether the filter is full, where in the carry flow we are — lives
 * in the brew state machine behind {@link BrewApi}.
 */
export function BrewLayer({ className, layout, brew, reducedMotion, cfg = BREW }: BrewLayerProps) {
  const layerRef = useRef<HTMLDivElement>(null)
  const activePointer = useRef<number | null>(null)
  const [dragPct, setDragPct] = useState<PctPoint | null>(null)
  const [clusters, setClusters] = useState<Cluster[]>([])

  const { stage, fillRatio, grounds, groundsRequired, dispenseTick, dispenseAmount } = brew
  const carrying = stage === 'carrying'
  const full = fillRatio >= 1

  const { machineSlot } = layout
  const slotCenter = useMemo(
    () => anchorCenter(machineSlot, machineSlot.width * 0.9),
    [machineSlot],
  )

  // A short burst of falling ground clusters after each dispense. Skipped under
  // reduced motion — the mound still grows, which is the real confirmation.
  useEffect(() => {
    if (dispenseTick === 0 || reducedMotion || cfg.particlesPerDispense <= 0) return
    const count = Math.min(
      10,
      cfg.particlesPerDispense + Math.max(0, dispenseAmount - 1) * cfg.particlesPerGround,
    )
    const batch: Cluster[] = Array.from({ length: count }, () => ({
      id: (clusterSeq += 1),
      left: 28 + Math.random() * 44,
      delayMs: Math.random() * 140,
    }))
    setClusters((prev) => [...prev, ...batch])
    const ids = new Set(batch.map((c) => c.id))
    const timer = window.setTimeout(() => {
      setClusters((prev) => prev.filter((c) => !ids.has(c.id)))
    }, cfg.particleFallMs + 260)
    return () => window.clearTimeout(timer)
  }, [dispenseTick, dispenseAmount, reducedMotion, cfg])

  const pointFromEvent = useCallback(
    (e: ReactPointerEvent | PointerEvent): PctPoint | null => {
      const el = layerRef.current
      if (!el) return null
      return clientToScenePct(e.clientX, e.clientY, el.getBoundingClientRect())
    },
    [],
  )

  const endCarry = useCallback(
    (e: PointerEvent | ReactPointerEvent) => {
      if (activePointer.current == null) return
      activePointer.current = null
      const at = pointFromEvent(e)
      if (at && withinSnap(at, slotCenter, cfg.snapRadiusPct)) brew.installFilter()
      else brew.cancelCarry()
      setDragPct(null)
    },
    [brew, cfg.snapRadiusPct, pointFromEvent, slotCenter],
  )

  // Window-level fallback: if pointer capture is lost mid-drag, the basket must
  // still track and still resolve on release — the player never loses it.
  useEffect(() => {
    if (!carrying) return
    const move = (e: PointerEvent) => {
      if (e.pointerId !== activePointer.current) return
      const at = pointFromEvent(e)
      if (at) setDragPct(at)
    }
    const up = (e: PointerEvent) => {
      if (e.pointerId !== activePointer.current) return
      endCarry(e)
    }
    window.addEventListener('pointermove', move)
    window.addEventListener('pointerup', up)
    window.addEventListener('pointercancel', up)
    return () => {
      window.removeEventListener('pointermove', move)
      window.removeEventListener('pointerup', up)
      window.removeEventListener('pointercancel', up)
    }
  }, [carrying, endCarry, pointFromEvent])

  const onBasketPointerDown = (e: ReactPointerEvent) => {
    if (stage !== 'ready') return
    e.preventDefault()
    activePointer.current = e.pointerId
    try {
      e.currentTarget.setPointerCapture(e.pointerId)
    } catch {
      /* best effort — the window fallback covers this */
    }
    const at = pointFromEvent(e)
    if (at) setDragPct(at)
    brew.beginCarry()
  }

  const anchor = stage === 'installed' ? layout.machineSlot : layout.filterHome
  const position: CSSProperties =
    carrying && dragPct
      ? { left: `${dragPct.x}%`, top: `${dragPct.y}%`, width: `${layout.filterHome.width}%` }
      : { left: `${anchor.x}%`, top: `${anchor.y}%`, width: `${anchor.width}%` }

  const basketStyle = {
    ...position,
    '--fill': Math.max(0, Math.min(1, fillRatio)),
    '--brew-return': `${cfg.basketReturnMs}ms`,
  } as CSSProperties

  return (
    <div ref={layerRef} className={className} data-layer="brew" aria-hidden="true">
      <div
        className={styles.slot}
        data-active={carrying ? 'true' : undefined}
        style={{
          left: `${layout.machineSlot.x}%`,
          top: `${layout.machineSlot.y}%`,
          width: `${layout.machineSlot.width}%`,
        }}
      />

      <div
        className={styles.basket}
        style={basketStyle}
        data-stage={stage}
        data-full={full ? 'true' : undefined}
        data-dragging={carrying ? 'true' : undefined}
        data-reduced={reducedMotion ? 'true' : undefined}
        onPointerDown={onBasketPointerDown}
        onPointerMove={
          carrying
            ? (e) => {
                if (e.pointerId !== activePointer.current) return
                const at = pointFromEvent(e)
                if (at) setDragPct(at)
              }
            : undefined
        }
        onPointerUp={carrying ? endCarry : undefined}
        onPointerCancel={carrying ? endCarry : undefined}
      >
        <span className={styles.shell}>
          <span className={styles.paper} />
          <span className={styles.grounds} />
        </span>
        <span className={styles.clusters}>
          {clusters.map((c) => (
            <span
              key={c.id}
              className={styles.cluster}
              style={{
                left: `${c.left}%`,
                animationDelay: `${c.delayMs}ms`,
                animationDuration: `${cfg.particleFallMs}ms`,
              }}
            />
          ))}
        </span>
        <span className={styles.count} data-full={full ? 'true' : undefined}>
          {grounds}/{groundsRequired}
        </span>
      </div>
    </div>
  )
}
