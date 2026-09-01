import { useMediaQuery } from '../hooks/useMediaQuery.ts'
import { BackgroundLayer } from './layers/BackgroundLayer.tsx'
import { EffectsLayer } from './layers/EffectsLayer.tsx'
import { ObjectsLayer } from './layers/ObjectsLayer.tsx'
import { PhysicsLayer } from './layers/PhysicsLayer.tsx'
import { SceneUiLayer } from './layers/SceneUiLayer.tsx'
import { getSceneLayout, SCENE_MOBILE_QUERY } from './sceneConfig.ts'
import styles from './CafeScene.module.css'

/**
 * The cafe scene is five stacked full-size layers rather than one image, so the
 * bean physics, grinding effects, and brew counter can each change without
 * touching the others. Stacking order (z-index in CafeScene.module.css):
 *
 *   Background — wall, window, shelves, lighting
 *   Objects    — counter, bean bowl, grinder, machine
 *   Physics    — Matter.js canvas mount point
 *   Effects    — particles, steam, score popups
 *   Scene UI   — grinder progress, brew counter, hint
 *
 * The scene is decorative for assistive tech (role="img"); everything needed to
 * use the site lives outside it.
 */
export function CafeScene() {
  const isMobile = useMediaQuery(SCENE_MOBILE_QUERY)
  const layout = getSceneLayout(isMobile)

  return (
    <div className={styles.scene} data-scene role="img" aria-label="A cozy pixel-art cafe counter with a bean bowl, a coffee grinder, and a coffee machine.">
      <BackgroundLayer className={`${styles.layer} ${styles.layerBackground}`} />
      <ObjectsLayer className={`${styles.layer} ${styles.layerObjects}`} layout={layout} />
      <PhysicsLayer className={`${styles.layer} ${styles.layerPhysics}`} />
      <EffectsLayer className={`${styles.layer} ${styles.layerEffects}`} />
      <SceneUiLayer className={`${styles.layer} ${styles.layerUi}`} layout={layout} />
    </div>
  )
}
