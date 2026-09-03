import { useEffect, useState } from 'react'
import type { CSSProperties } from 'react'

import styles from '../layers/layers.module.css'

interface GrinderProps {
  style: CSSProperties
  /** True while a bean is being ground — drives the subtle shake. */
  reacting?: boolean
  /** Bumped when a bean hits the grinder while it can't accept it. */
  busyTick?: number
}

/**
 * Manual coffee grinder — the throw target. The hopper mouth is drawn as an
 * obvious dark opening; its hit-box comes from `grinderHopper` in sceneConfig so
 * the physics sensor and this art stay aligned.
 *
 * The shake is a CSS `transform` animation on this wrapper only. It never moves
 * the Matter.js hopper sensor — gameplay geometry is untouched — and the
 * movement is capped at ~1.5px so the art never looks detached from its collider.
 */
export function Grinder({ style, reacting, busyTick }: GrinderProps) {
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (!busyTick) return
    setBusy(true)
    const timer = window.setTimeout(() => setBusy(false), 420)
    return () => window.clearTimeout(timer)
  }, [busyTick])

  return (
    <div
      className={`${styles.object} ${styles.grinder}`}
      style={style}
      data-object="grinder"
      data-reacting={reacting ? 'true' : undefined}
      data-busy={busy ? 'true' : undefined}
    >
      <div className={styles.grinderCrank} />
      <div className={styles.grinderHopper} />
      <div className={styles.grinderHopperMouth} />
      <div className={styles.grinderBody} />
      <div className={styles.grinderDrawer} />
    </div>
  )
}
