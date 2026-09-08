import { useCallback } from 'react'

import { useMediaQuery } from '../hooks/useMediaQuery.ts'
import { useReducedMotion } from '../hooks/useReducedMotion.ts'
import { BrewLayer } from './brew/BrewLayer.tsx'
import { useBrew } from './brew/useBrew.ts'
import { useBrewCounter } from './brew/useBrewCounter.ts'
import { BackgroundLayer } from './layers/BackgroundLayer.tsx'
import { EffectsLayer } from './layers/EffectsLayer.tsx'
import { ObjectsLayer } from './layers/ObjectsLayer.tsx'
import { PhysicsLayer } from './layers/PhysicsLayer.tsx'
import { SceneUiLayer } from './layers/SceneUiLayer.tsx'
import type { ThrowResult } from './physics/types.ts'
import { getSceneLayout, SCENE_MOBILE_QUERY } from './sceneConfig.ts'
import styles from './CafeScene.module.css'

/**
 * The cafe scene is six stacked full-size layers rather than one image, so the
 * bean physics, grinding/filter interaction, and brew counter can each change
 * without touching the others. Stacking order (z-index in CafeScene.module.css):
 *
 *   Background — wall, window, shelves, lighting
 *   Objects    — counter, bean bowl, grinder, machine
 *   Physics    — Matter.js bean canvas
 *   Brew       — filter basket, grounds, dispense effect, machine slot
 *   Effects    — particles, steam, score popups
 *   Scene UI   — brew counter, contextual hint
 *
 * Data flows one way: bean physics emits a classified `ThrowResult`, the brew
 * state machine consumes it, and the layers render off that state. Nothing in
 * `CafePhysics` knows about grinding, sound, or the filter.
 *
 * The scene is decorative for assistive tech (role="img"); everything needed to
 * use the site lives outside it.
 */
export function CafeScene({ onThrowResolved }: { onThrowResolved?: (result: ThrowResult) => void } = {}) {
  const isMobile = useMediaQuery(SCENE_MOBILE_QUERY)
  const layout = getSceneLayout(isMobile)
  const reducedMotion = useReducedMotion()
  const brew = useBrew()
  const brewCounter = useBrewCounter(brew.stage)

  const handleResolved = useCallback(
    (result: ThrowResult) => {
      brew.handleThrow(result)
      onThrowResolved?.(result)
    },
    [brew, onThrowResolved],
  )

  const started = brew.grounds > 0 || brew.phase === 'grinding'

  return (
    <div
      className={styles.scene}
      data-scene
      role="img"
      aria-label="A cozy pixel-art cafe counter with a bean bowl, a coffee grinder, and a coffee machine."
    >
      <BackgroundLayer className={`${styles.layer} ${styles.layerBackground}`} />
      <ObjectsLayer
        className={`${styles.layer} ${styles.layerObjects}`}
        layout={layout}
        grinderReacting={brew.reacting}
        grinderBusyTick={brew.busyTick}
      />
      <PhysicsLayer
        className={`${styles.layer} ${styles.layerPhysics}`}
        layout={layout}
        accepting={brew.accepting}
        onThrowResolved={handleResolved}
        onThrowRejected={brew.handleRejectedBean}
      />
      <BrewLayer
        className={`${styles.layer} ${styles.layerBrew}`}
        layout={layout}
        brew={brew}
        reducedMotion={reducedMotion}
      />
      <EffectsLayer className={`${styles.layer} ${styles.layerEffects}`} />
      <SceneUiLayer
        className={`${styles.layer} ${styles.layerUi}`}
        layout={layout}
        stage={brew.stage}
        started={started}
        busyTick={brew.busyTick}
        brewCounter={brewCounter}
      />
    </div>
  )
}
