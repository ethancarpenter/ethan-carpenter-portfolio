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

interface CarafeProps {
  style: CSSProperties
  /**
   * True once a filter has been installed (`stage === 'installed'`). Drives the
   * coffee filling the glass and the steam afterward; back to false the instant
   * the pot is reset, which empties the glass again. Pure presentation — the
   * global counter already incremented at the `installed` transition.
   */
  brewed?: boolean
  reducedMotion?: boolean
}

export function Carafe({ style, brewed, reducedMotion }: CarafeProps) {
  return (
    <div
      className={`${styles.object} ${styles.carafe}`}
      style={style}
      data-object="carafe"
      data-brewed={brewed ? 'true' : undefined}
      data-reduced={reducedMotion ? 'true' : undefined}
    >
      <div className={styles.carafeSteam} aria-hidden="true">
        <span />
        <span />
        <span />
      </div>
      <div className={styles.carafeLid} />
      <div className={styles.carafeGlass}>
        <div className={styles.carafeCoffee} />
      </div>
      <div className={styles.carafeHandle} />
    </div>
  )
}
