import { useEffect, useRef, useState } from 'react'

import { isPhysicsDebugEnabled, shouldColliderOverlayStartOn } from '../debug/debugFlag.ts'
import { PhysicsDebugPanel } from '../debug/PhysicsDebugPanel.tsx'
import { CafePhysics } from '../physics/cafePhysics.ts'
import type { PhysicsDebugState, ThrowResult } from '../physics/types.ts'
import type { SceneLayout } from '../sceneConfig.ts'
import { useHeroIntro } from '../../hooks/heroIntro.ts'
import { useReducedMotion } from '../../hooks/useReducedMotion.ts'
import styles from './PhysicsLayer.module.css'

interface PhysicsLayerProps {
  className: string
  layout: SceneLayout
  /** Milestone 3 seam: every accepted throw, already classified. */
  onThrowResolved?: (result: ThrowResult) => void
  /** A bean reached a grinder that can't accept it (filter full / being moved). */
  onThrowRejected?: () => void
  /** When false, the grinder bounces beans back out instead of consuming them. */
  accepting?: boolean
}

/**
 * Mounts the Matter.js bean toy onto a canvas that fills this layer. The engine
 * lives entirely in {@link CafePhysics}; this component only owns the DOM nodes,
 * feeds the responsive layout in, and (in dev) renders the tuning panel.
 *
 * No React state changes per physics frame — `CafePhysics` draws straight to
 * the canvas and only pushes coarse snapshots for the debug panel.
 */
export function PhysicsLayer({
  className,
  layout,
  onThrowResolved,
  onThrowRejected,
  accepting = true,
}: PhysicsLayerProps) {
  const hostRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const engineRef = useRef<CafePhysics | null>(null)

  const { autoCollapse } = useHeroIntro()
  const reducedMotion = useReducedMotion()

  // Kept in refs so a breakpoint change or a new callback identity updates the
  // running engine instead of tearing the whole world down and rebuilding it.
  const latest = useRef({ autoCollapse, onThrowResolved, onThrowRejected, layout })
  latest.current = { autoCollapse, onThrowResolved, onThrowRejected, layout }

  const [debugState, setDebugState] = useState<PhysicsDebugState | null>(null)
  const debugEnabled = isPhysicsDebugEnabled()

  useEffect(() => {
    const host = hostRef.current
    const canvas = canvasRef.current
    if (!host || !canvas) return

    const engine = new CafePhysics({
      container: host,
      canvas,
      layout: latest.current.layout,
      reducedMotion,
      onFirstInteraction: () => latest.current.autoCollapse(),
      onThrowResolved: (result) => latest.current.onThrowResolved?.(result),
      onThrowRejected: () => latest.current.onThrowRejected?.(),
      onDebugState: debugEnabled ? setDebugState : undefined,
    })
    engineRef.current = engine

    return () => {
      engine.destroy()
      engineRef.current = null
    }
  }, [reducedMotion, debugEnabled])

  useEffect(() => {
    engineRef.current?.setLayout(layout)
  }, [layout])

  useEffect(() => {
    engineRef.current?.setAcceptingBeans(accepting)
  }, [accepting])

  return (
    <div ref={hostRef} className={className} data-layer="physics" aria-hidden="true">
      <canvas ref={canvasRef} className={styles.canvas} data-pixel />
      {debugEnabled && debugState && (
        <PhysicsDebugPanel
          state={debugState}
          initialColliders={shouldColliderOverlayStartOn()}
          onToggleColliders={(on) => engineRef.current?.setDebug(on)}
        />
      )}
    </div>
  )
}
