import type { CSSProperties } from 'react'

import styles from '../layers/layers.module.css'

/** Coffee machine and carafe on the right — home of the brewing interaction. */
export function CoffeeMachine({ style }: { style: CSSProperties }) {
  return (
    <div className={`${styles.object} ${styles.machine}`} style={style} data-object="coffee-machine">
      <div className={styles.machineHead} />
      <div className={styles.machineBody} />
      <div className={styles.machineWarmer} />
    </div>
  )
}

export function Carafe({ style }: { style: CSSProperties }) {
  return (
    <div className={`${styles.object} ${styles.carafe}`} style={style} data-object="carafe">
      <div className={styles.carafeLid} />
      <div className={styles.carafeGlass} />
      <div className={styles.carafeHandle} />
    </div>
  )
}
