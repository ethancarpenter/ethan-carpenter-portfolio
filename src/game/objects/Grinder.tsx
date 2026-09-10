import { useEffect, useState } from 'react'
import type { CSSProperties } from 'react'

import type { ElementSize } from '../../hooks/useElementSize.ts'
import { resolveGrinderGeometry } from '../physics/grinderGeometry.ts'
import { PHYSICS } from '../physics/physicsConfig.ts'
import type { SceneAnchor } from '../sceneConfig.ts'
import styles from '../layers/layers.module.css'

interface GrinderProps {
  style: CSSProperties
  /** The grinder-body anchor (percentages) — the mill drawn below the funnel. */
  grinderAnchor: SceneAnchor
  /** The hopper anchor (percentages) — funnel geometry derives from this. */
  hopperAnchor: SceneAnchor
  /** Live scene-box pixels, so the funnel art lands on the Matter colliders. */
  sceneSize: ElementSize
  /** True while a bean is being ground — drives the subtle shake. */
  reacting?: boolean
  /** Bumped when a bean hits the grinder while it can't accept it. */
  busyTick?: number
}

/**
 * Manual coffee grinder — the throw target.
 *
 * The two angled catch wings and the mouth are drawn straight from
 * {@link resolveGrinderGeometry} — the exact same function that builds the
 * Matter.js catch-lip bodies and the top-entry gate — so the visible funnel and
 * the collision funnel are the same shape at every size. The mill body below is
 * ordinary anchor-positioned art.
 *
 * The shake is a CSS `transform` on the mill body only; the funnel (which owns
 * the colliders' shape) never moves.
 */
export function Grinder({
  style,
  grinderAnchor,
  hopperAnchor,
  sceneSize,
  reacting,
  busyTick,
}: GrinderProps) {
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (!busyTick) return
    setBusy(true)
    const timer = window.setTimeout(() => setBusy(false), 420)
    return () => window.clearTimeout(timer)
  }, [busyTick])

  const { width: w, height: h } = sceneSize
  const geo =
    w > 0 && h > 0
      ? resolveGrinderGeometry(
          hopperAnchor,
          sceneSize,
          PHYSICS.funnel,
          PHYSICS.sensor.entranceWidthScale,
        )
      : null

  return (
    <>
      {geo && (
        <div
          className={styles.grinderFunnel}
          style={
            {
              '--throat-top': `${(geo.mouth.y / h) * 100}%`,
              // Reach well into the top of the mill body so the funnel and the
              // mill read as one piece.
              '--throat-bottom': `${Math.max((geo.mouth.y / h) * 100 + 11, grinderAnchor.y + 5)}%`,
              '--throat-cx': `${(geo.mouth.cx / w) * 100}%`,
              // A touch wider than the bare mouth span so the wings look seated
              // on it rather than hovering above a slot.
              '--throat-w': `${((geo.mouth.halfWidth * 2.2) / w) * 100}%`,
            } as CSSProperties
          }
        >
          <span className={styles.grinderThroat} />
          {geo.lips.map((lip) => (
            <span
              key={lip.id}
              className={styles.grinderCatch}
              data-side={lip.id === 'funnel-left' ? 'left' : 'right'}
              style={{
                left: `${(lip.cx / w) * 100}%`,
                top: `${(lip.cy / h) * 100}%`,
                width: `${(lip.length / w) * 100}%`,
                height: `${(lip.thickness / h) * 100}%`,
                transform: `translate(-50%, -50%) rotate(${lip.angle}rad)`,
              }}
            />
          ))}
        </div>
      )}

      <div
        className={`${styles.object} ${styles.grinder}`}
        style={style}
        data-object="grinder"
        data-reacting={reacting ? 'true' : undefined}
        data-busy={busy ? 'true' : undefined}
      >
        <div className={styles.grinderCrank} />
        <div className={styles.grinderBody} />
        <div className={styles.grinderDrawer} />
      </div>
    </>
  )
}
