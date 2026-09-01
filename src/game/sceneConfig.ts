/**
 * Scene layout config — the single source of truth for where cafe objects
 * sit inside the <CafeScene> box.
 *
 * Coordinates are PERCENTAGES of the scene box (0–100), origin top-left.
 * Both the rendered objects and the Matter.js bodies read from this, so the
 * physics world and the art stay aligned. Add a variant here to reposition
 * objects per breakpoint instead of scaling the whole scene down.
 */

export interface SceneAnchor {
  /** Left edge, % of scene width. */
  x: number
  /** Top edge, % of scene height. */
  y: number
  /** Width, % of scene width. Height follows from each object's art. */
  width: number
}

export interface SceneLayout {
  /** Bean source on the left — where draggable beans spawn from. */
  beanBowl: SceneAnchor
  /** The grinder body. */
  grinder: SceneAnchor
  /** The hopper opening — the target beans are tossed into. */
  grinderHopper: SceneAnchor
  /** Coffee machine on the right. */
  coffeeMachine: SceneAnchor
  /** Carafe / pot — the brewing interaction. */
  carafe: SceneAnchor
  /** Top surface of the countertop, % of scene height (physics floor). */
  counterTopY: number
}

export const desktopLayout: SceneLayout = {
  // Bowl sits low on the front-left of the counter, clear of and below the
  // expanded intro panel (which occupies the upper-left wall zone), so a
  // visitor can see and reach a bean before the intro ever collapses.
  beanBowl: { x: 4, y: 80, width: 22 },
  grinder: { x: 45, y: 34, width: 17 },
  grinderHopper: { x: 48, y: 30, width: 11 },
  coffeeMachine: { x: 74, y: 30, width: 21 },
  carafe: { x: 78, y: 62, width: 12 },
  counterTopY: 62,
}

/**
 * Mobile: grinder moves toward centre and lower, bean bowl sits closer so the
 * throw distance is shorter, machine tucks to the edge. Decorations thin out
 * via CSS, not here.
 */
export const mobileLayout: SceneLayout = {
  beanBowl: { x: 8, y: 62, width: 30 },
  grinder: { x: 52, y: 40, width: 30 },
  grinderHopper: { x: 55, y: 35, width: 20 },
  coffeeMachine: { x: 68, y: 20, width: 34 },
  carafe: { x: 74, y: 66, width: 22 },
  counterTopY: 66,
}

export function getSceneLayout(isMobile: boolean): SceneLayout {
  return isMobile ? mobileLayout : desktopLayout
}

/** Breakpoint at which the scene switches to the mobile layout. */
export const SCENE_MOBILE_QUERY = '(max-width: 720px)'
