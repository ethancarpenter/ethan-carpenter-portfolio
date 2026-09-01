import type { CSSProperties } from 'react'

import { BeanBowl } from '../objects/BeanBowl.tsx'
import { Carafe, CoffeeMachine } from '../objects/CoffeeMachine.tsx'
import { Grinder } from '../objects/Grinder.tsx'
import type { SceneAnchor, SceneLayout } from '../sceneConfig.ts'
import styles from './layers.module.css'

interface ObjectsLayerProps {
  className: string
  layout: SceneLayout
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
export function ObjectsLayer({ className, layout }: ObjectsLayerProps) {
  return (
    <div
      className={className}
      aria-hidden="true"
      style={{ '--counter-top': `${layout.counterTopY}%` } as CSSProperties}
    >
      <div className={styles.counter} />
      <BeanBowl style={anchorStyle(layout.beanBowl)} />
      <Grinder style={anchorStyle(layout.grinder)} />
      <CoffeeMachine style={anchorStyle(layout.coffeeMachine)} />
      <Carafe style={anchorStyle(layout.carafe)} />
    </div>
  )
}
