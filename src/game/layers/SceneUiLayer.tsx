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
  /** The global pots-brewed total (Milestone 5), or its loading/unavailable state. */
  brewCounter: BrewCounterState
}

const COUNT_FORMATTER = new Intl.NumberFormat('en-US')

/**
 * In-scene HUD: the global brew-count slot (shared across every visitor — see
 * useBrewCounter.ts) and a single contextual hint. The abstract grinder
 * progress bar was removed in Milestone 3 — the grounds visibly filling the
 * paper filter are the progress indicator now.
 */
export function SceneUiLayer({
  className,
  layout,
  stage,
  started,
  busyTick,
  brewCounter,
}: SceneUiLayerProps) {
  const { grinderHopper } = layout

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
