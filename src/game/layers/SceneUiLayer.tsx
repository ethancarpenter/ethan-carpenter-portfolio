import type { CSSProperties } from 'react'

import type { SceneLayout } from '../sceneConfig.ts'
import styles from './SceneUiLayer.module.css'

interface SceneUiLayerProps {
  className: string
  layout: SceneLayout
}

/** In-scene HUD: grinder fill, global brew count, and the toss hint. */
export function SceneUiLayer({ className, layout }: SceneUiLayerProps) {
  const { grinder, grinderHopper } = layout

  // Anchor the hint just above the hopper opening.
  const hintStyle: CSSProperties = {
    left: `${grinderHopper.x + grinderHopper.width / 2}%`,
    bottom: `${100 - grinderHopper.y + 4}%`,
  }

  // Sit the fill gauge on the counter directly beneath the grinder, clear of
  // the bean bowl / spawn zone on the left and the open throwing path.
  const progressStyle: CSSProperties = {
    left: `${grinder.x + grinder.width / 2}%`,
    top: `${layout.counterTopY + 2}%`,
  }

  return (
    <div className={className}>
      <div className={styles.brewCounter}>
        <span className={styles.brewCounterLabel}>Coffee brewed here</span>
        <span className={styles.brewCounterValue} aria-hidden="true">
          &mdash;&mdash;&mdash;
        </span>
        <span className="sr-only">Global brew counter coming soon.</span>
      </div>

      <div
        className={styles.progress}
        style={progressStyle}
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={0}
        aria-label="Grinder fill level"
      >
        <div className={styles.progressLabelRow}>
          <span className={styles.progressTitle}>Grinder</span>
          <span>empty</span>
        </div>
        <div className={styles.bar}>
          <div className={styles.barFill} />
        </div>
      </div>

      <p className={styles.hint} style={hintStyle}>
        <span aria-hidden="true">☕</span> Toss a bean in
      </p>
    </div>
  )
}
