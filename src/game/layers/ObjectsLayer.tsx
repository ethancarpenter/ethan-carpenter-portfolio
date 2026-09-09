import type { CSSProperties } from 'react'

import type { ElementSize } from '../../hooks/useElementSize.ts'
import { BeanBowl } from '../objects/BeanBowl.tsx'
import { Carafe, CoffeeMachine } from '../objects/CoffeeMachine.tsx'
import { Grinder } from '../objects/Grinder.tsx'
import type { SceneAnchor, SceneLayout } from '../sceneConfig.ts'
import styles from './layers.module.css'

interface ObjectsLayerProps {
  className: string
  layout: SceneLayout
  /** Live scene-box pixel size — feeds the grinder's collider-aligned funnel art. */
  sceneSize: ElementSize
  /** True while the grinder should be shaking (a bean is being ground). */
  grinderReacting?: boolean
  /** Bumped when a bean hits the grinder while the filter is full / moving. */
  grinderBusyTick?: number
  /** True once a filter is installed — the carafe fills with coffee. */
  brewed?: boolean
  /** Honour the reduced-motion preference for the carafe fill / steam. */
  reducedMotion?: boolean
}

/** Turn a percentage anchor from sceneConfig into absolute-position styles. */
function anchorStyle(anchor: SceneAnchor): CSSProperties {
  return {
    left: `${anchor.x}%`,
    top: `${anchor.y}%`,
    width: `${anchor.width}%`,
  }
}

/** The countertop and cafe props, positioned from the active scene layout. */
export function ObjectsLayer({
  className,
  layout,
  sceneSize,
  grinderReacting,
  grinderBusyTick,
  brewed,
  reducedMotion,
}: ObjectsLayerProps) {
  return (
    <div
      className={className}
      aria-hidden="true"
      style={{ '--counter-top': `${layout.counterTopY}%` } as CSSProperties}
    >
      <div className={styles.counter} />
      <BeanBowl style={anchorStyle(layout.beanBowl)} />
      <Grinder
        style={anchorStyle(layout.grinder)}
        grinderAnchor={layout.grinder}
        hopperAnchor={layout.grinderHopper}
        sceneSize={sceneSize}
        reacting={grinderReacting}
        busyTick={grinderBusyTick}
      />
      <CoffeeMachine style={anchorStyle(layout.coffeeMachine)} />
      <Carafe style={anchorStyle(layout.carafe)} brewed={brewed} reducedMotion={reducedMotion} />
    </div>
  )
}
