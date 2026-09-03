import type { CSSProperties } from 'react'

import styles from '../layers/layers.module.css'

/**
 * Bean source on the left of the counter. The grabbable "ready" bean that rests
 * here is a live physics body drawn on the physics layer, not part of this art.
 */
export function BeanBowl({ style }: { style: CSSProperties }) {
  return (
    <div className={`${styles.object} ${styles.beanBowl}`} style={style} data-object="bean-bowl">
      <div className={styles.beanPile} />
      <div className={styles.beanBowlDish} />
    </div>
  )
}
