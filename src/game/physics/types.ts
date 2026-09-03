/**
 * Shared physics/scoring types. Kept free of any Matter.js import so the
 * scoring logic and tests never pull the engine in.
 */

export type BeanId = number

export interface Vec {
  x: number
  y: number
}

/** Where a bean is in its lifecycle. */
export type BeanState =
  /** Resting at the bowl, waiting to be grabbed. Exactly one at a time. */
  | 'ready'
  /** Held by the pointer right now. */
  | 'held'
  /** Released / knocked loose, living on the counter. */
  | 'loose'
  /** Accepted by the grinder hopper; scheduled for removal. */
  | 'consumed'

export type ThrowCategory = 'drop' | 'short' | 'strong' | 'bank'

/**
 * Everything recorded about one bean's trip from grab to resolution. Populated
 * by {@link ./throwTracker.ThrowTracker}; consumed only by
 * {@link ../scoring/throwScoring.classifyThrow} and the debug panel.
 */
export interface ThrowTelemetry {
  beanId: BeanId
  /** Pointer position (scene px) when the bean was grabbed. */
  dragStart: { x: number; y: number }
  /** Bean centre (scene px) at the moment of release. */
  releasePos: { x: number; y: number }
  /** `performance.now()` at release. */
  releaseTime: number
  /**
   * The bean body's own velocity at release, scene px/s (clamped to the
   * configured max). With the spring tether this is the meaningful launch
   * value — it carries swing momentum the pointer never had.
   */
  releaseVelocity: { x: number; y: number }
  /** `Math.hypot` of {@link releaseVelocity}. */
  releaseSpeed: number
  /**
   * The player's gesture velocity from recent pointer-motion sampling, scene
   * px/s. Kept for telemetry and gesture-vs-bean comparison; NOT used for
   * scoring anymore.
   */
  pointerReleaseVelocity: { x: number; y: number }
  /** `Math.hypot` of {@link pointerReleaseVelocity}. */
  pointerReleaseSpeed: number
  /**
   * False when the bean entered the hopper while still under the pointer
   * (a direct drag-in). True for any genuine release before entry.
   */
  releasedBeforeGrinder: boolean
  /** Distance the bean centre travelled after release, scene px. */
  postReleaseTravel: number
  /** Time from release to resolution (hopper entry or settle), ms. */
  airtimeMs: number
  /** Meaningful environment collisions after release (rest contact excluded). */
  bounceCount: number
  /** Bean speed (px/s) as it crossed into the hopper sensor. */
  entrySpeed: number
  /** Whether the bean was accepted by the grinder. */
  success: boolean
}

export interface ThrowResult {
  category: ThrowCategory
  multiplier: 1 | 2 | 3 | 4
  label: string
  telemetry: ThrowTelemetry
}

/** Snapshot pushed to the dev debug panel. Throttled — never per frame. */
export interface PhysicsDebugState {
  lastThrow: ThrowResult | null
  activeBeanCount: number
  /** True while a bean is tethered to the pointer. */
  dragging: boolean
  /** Held bean's body speed, scene px/s (0 when nothing held). */
  heldBeanSpeed: number
  /** Held bean's body velocity, scene px/s. */
  heldBeanVelocity: { x: number; y: number }
  /** Recent pointer-gesture speed, scene px/s. */
  pointerSpeed: number
  /** Distance from the held bean to the pointer anchor, scene px. */
  beanAnchorDistance: number
  /** The active tether tuning, echoed for on-screen reference. */
  tether: { length: number; stiffness: number; damping: number }
}
