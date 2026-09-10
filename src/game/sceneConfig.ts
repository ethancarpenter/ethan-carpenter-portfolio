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
  /** Resting spot for the filter basket, on the counter under the grinder spout. */
  filterHome: SceneAnchor
  /** Where the full filter basket clicks into the coffee machine. */
  machineSlot: SceneAnchor
  /** Coffee machine on the right. */
  coffeeMachine: SceneAnchor
  /** Carafe / pot — the brewing interaction. */
  carafe: SceneAnchor
  /** Top surface of the countertop, % of scene height (physics floor). */
  counterTopY: number
}

// The scene box is ~30% taller than the art was originally designed for (see
// CafeScene.module.css) so thrown beans have headroom for a real arc. All the
// extra height goes in ABOVE the objects: every Y anchor below is the old
// value pushed down by that same 30%-of-old-height offset, then rescaled to
// the new box — so the counter, grinder and bowl stay put relative to the
// floor while the ceiling above them lifts.
export const desktopLayout: SceneLayout = {
  // Bowl sits low on the front-left of the counter, clear of and below the
  // expanded intro panel (which occupies the upper-left wall zone), so a
  // visitor can see and reach a bean before the intro ever collapses.
  beanBowl: { x: 4, y: 84.6, width: 22 },
  grinder: { x: 45, y: 49.2, width: 17 },
  grinderHopper: { x: 48, y: 46.1, width: 11 },
  // On the counter, centred under the grinder body; the basket art nudges
  // itself up so it rests on the surface rather than hanging from this point.
  filterHome: { x: 47, y: 66.9, width: 13 },
  machineSlot: { x: 78, y: 55.4, width: 12 },
  coffeeMachine: { x: 74, y: 46.1, width: 21 },
  carafe: { x: 78, y: 70.8, width: 12 },
  counterTopY: 70.8,
}

/**
 * Mobile (portrait scene). The physics anchors — `grinderHopper`, `beanBowl`,
 * `counterTopY` — are unchanged from the values playtested on touch; only the
 * art-and-drag anchors move, to give the wider mobile funnel room and stack the
 * machine + carafe low on the right, clear of the catch wings. Decorations thin
 * out via CSS, not here. `.machine` also shortens on mobile (layers.module.css).
 */
export const mobileLayout: SceneLayout = {
  beanBowl: { x: 8, y: 62, width: 30 },
  grinder: { x: 44, y: 45, width: 34 },
  grinderHopper: { x: 55, y: 35, width: 20 },
  filterHome: { x: 40, y: 58, width: 18 },
  machineSlot: { x: 80, y: 56, width: 15 },
  coffeeMachine: { x: 70, y: 48, width: 27 },
  carafe: { x: 74, y: 66, width: 20 },
  counterTopY: 66,
}

export function getSceneLayout(isMobile: boolean): SceneLayout {
  return isMobile ? mobileLayout : desktopLayout
}

/** Breakpoint at which the scene switches to the mobile layout. */
export const SCENE_MOBILE_QUERY = '(max-width: 720px)'
