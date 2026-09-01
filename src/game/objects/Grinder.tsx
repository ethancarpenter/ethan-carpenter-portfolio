import type { CSSProperties } from 'react'

import styles from '../layers/layers.module.css'

/**
 * Manual coffee grinder — the throw target. The hopper mouth is drawn as an
 * obvious dark opening; its hit-box comes from `grinderHopper` in sceneConfig
 * so the physics sensor and this art stay aligned.
 */
export function Grinder({ style }: { style: CSSProperties }) {
  return (
    <div className={`${styles.object} ${styles.grinder}`} style={style} data-object="grinder">
      <div className={styles.grinderCrank} />
      <div className={styles.grinderHopper} />
      <div className={styles.grinderHopperMouth} />
      <div className={styles.grinderBody} />
      <div className={styles.grinderDrawer} />
    </div>
  )
}
