import { useEffect, useState } from 'react'
import type { CSSProperties } from 'react'

import type { BrewCounterState } from '../brew/useBrewCounter.ts'
import type { FilterStage } from '../brew/brewMachine.ts'
import type { SceneLayout } from '../sceneConfig.ts'
import styles from './SceneUiLayer.module.css'

interface SceneUiLayerProps {
  className: string
  layout: SceneLayout
  /** Where we are in the coffee-prep flow — drives the in-world hint. */
  stage: FilterStage
  /** True once grinding has started or grounds are in the filter. */
  started: boolean
  /** Bumped when a bean hits a grinder that can't use it. */
  busyTick: number
  /** The global pots-brewed total, or its loading/unavailable state. */
  brewCounter: BrewCounterState
  /**
   * Empty the brewed pot and start a fresh brew cycle. Local only — never
   * touches the global counter. The control below is shown only while
   * `stage === 'installed'`.
   */
  onResetPot: () => void
}

const COUNT_FORMATTER = new Intl.NumberFormat('en-US')

/**
 * In-scene HUD: the global brew-count slot (shared across every visitor — see
 * useBrewCounter.ts) and a single contextual hint. There is no abstract grinder
 * progress bar — the grounds visibly filling the paper filter are the progress
 * indicator.
 */
export function SceneUiLayer({
  className,
  layout,
  stage,
  started,
  busyTick,
  brewCounter,
  onResetPot,
}: SceneUiLayerProps) {
  const { grinderHopper, carafe } = layout

  // Anchor the hint just above the hopper opening.
  const hintStyle: CSSProperties = {
    left: `${grinderHopper.x + grinderHopper.width / 2}%`,
    bottom: `${100 - grinderHopper.y + 4}%`,
  }

  const [busyCue, setBusyCue] = useState(false)
  useEffect(() => {
    if (!busyTick) return
    setBusyCue(true)
    const timer = window.setTimeout(() => setBusyCue(false), 1600)
    return () => window.clearTimeout(timer)
  }, [busyTick])

  const hint = resolveHint(stage, started, busyCue)

  // Sit the reset control under the carafe, but clamp so the whole pill stays
  // inside the scene box on a narrow layout (translate:-50% centres it on this).
  const resetCx = Math.min(Math.max(carafe.x + carafe.width / 2, 24), 82)
  const resetStyle: CSSProperties = {
    left: `${resetCx}%`,
    top: `${carafe.y + 3}%`,
  }

  return (
    <div className={className}>
      <div className={styles.brewCounter} data-status={brewCounter.status}>
        <span className={styles.brewCounterLabel}>Pots brewed worldwide</span>
        <span className={styles.brewCounterValue} aria-hidden="true">
          {brewCounter.status === 'ready' ? COUNT_FORMATTER.format(brewCounter.count) : '———'}
        </span>
        <span className="sr-only">
          {brewCounter.status === 'ready'
            ? `Global brew counter: ${COUNT_FORMATTER.format(brewCounter.count)} pots brewed by every visitor to this site.`
            : brewCounter.status === 'loading'
              ? 'Global brew counter loading.'
              : 'Global brew counter is temporarily unavailable.'}
        </span>
      </div>

      {hint && (
        <p className={styles.hint} style={hintStyle} data-tone={hint.tone}>
          <span aria-hidden="true">{hint.icon}</span> {hint.text}
        </p>
      )}

      {stage === 'installed' && (
        <button
          type="button"
          className={styles.resetPot}
          style={resetStyle}
          onClick={onResetPot}
          aria-label="Empty pot and start a new brew"
        >
          <span aria-hidden="true" className={styles.resetPotIcon}>
            ↺
          </span>
          <span className={styles.resetPotText}>Empty pot</span>
        </button>
      )}
    </div>
  )
}

interface Hint {
  text: string
  icon: string
  tone: 'prompt' | 'progress' | 'ready' | 'busy'
}

function resolveHint(stage: FilterStage, started: boolean, busyCue: boolean): Hint | null {
  if (busyCue && (stage === 'ready' || stage === 'carrying')) {
    return { text: 'Move the full filter to the machine first', icon: '✋', tone: 'busy' }
  }
  switch (stage) {
    case 'filling':
      return started
        ? { text: "Keep 'em coming — the filter's filling", icon: '☕', tone: 'progress' }
        : { text: 'Toss a bean in', icon: '☕', tone: 'prompt' }
    case 'ready':
      return { text: "Filter's full — drag it to the machine", icon: '➜', tone: 'ready' }
    case 'carrying':
      return { text: 'Drop it into the coffee machine', icon: '➜', tone: 'ready' }
    case 'installed':
      return null
  }
}
