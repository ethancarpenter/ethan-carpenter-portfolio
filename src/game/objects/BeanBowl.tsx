import type { CSSProperties } from 'react'

import styles from '../layers/layers.module.css'

/**
 * Bean source on the left of the counter, and the spawn point for tossable
 * beans. The "demo bean" resting on the rim performs the one-time flick
 * gesture that teaches the interaction.
 */
export function BeanBowl({ style }: { style: CSSProperties }) {
  return (
    <div className={`${styles.object} ${styles.beanBowl}`} style={style} data-object="bean-bowl">
      <div className={styles.beanPile} />
      <div className={styles.beanBowlDish} />
      <div className={styles.demoBean} />
    </div>
  )
}
