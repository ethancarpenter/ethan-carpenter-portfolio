/**
 * Pure top-entry test for the grinder hopper. No Matter.js, no DOM, no clock —
 * it is handed two positions and a velocity and answers one question:
 *
 *   Did the bean cross the hopper's top entrance plane, downward, within the
 *   mouth opening?
 *
 * This is the authoritative acceptance check. It runs every physics step on the
 * swept segment `previous centre -> current centre`, so a bean moving fast
 * enough to skip over a thin sensor between steps is still caught — Matter's
 * discrete `collisionStart` is only a secondary trigger that routes through this
 * same function.
 *
 * Scene coordinates: +X right, +Y DOWN. "Above the plane" means a smaller Y.
 */

import type { Vec } from './types.ts'

/**
 * The hopper's top opening, in scene px. Derived from the `grinderHopper` scene
 * anchor by {@link ./sceneGeometry.resolveSceneGeometry}, so it stays aligned
 * with the drawn hopper at every size / breakpoint.
 */
export interface HopperEntrance {
  /** Y of the entrance plane (the mouth line). */
  y: number
  /** Left edge of the valid mouth opening. */
  minX: number
  /** Right edge of the valid mouth opening. */
  maxX: number
}

export interface EntryCheckOptions {
  /**
   * Extra half-width added to each side of the mouth so a bean whose centre is
   * marginally outside — but whose body visibly clips the rim — still counts.
   */
  fairnessMargin: number
  /**
   * Minimum downward velocity (px/s) required. A released throw must actually be
   * descending; a bean fired horizontally through the side (vy ~ 0) fails here.
   * Pass 0 for a held bean the player is deliberately lowering in.
   */
  minDownSpeed: number
}

export interface EntryResult {
  entered: boolean
  /** Interpolated X where the path met the entrance plane (present iff entered). */
  crossingX?: number
  /** Why it was rejected — handy for the debug overlay. */
  reason?: 'no-cross' | 'not-descending' | 'outside-mouth'
}

/**
 * @param prev     bean centre at the end of the previous physics step
 * @param curr     bean centre now
 * @param velocity bean's real velocity in px/s (used only for the direction gate)
 */
export function checkHopperEntry(
  prev: Vec,
  curr: Vec,
  velocity: Vec,
  entrance: HopperEntrance,
  opts: EntryCheckOptions,
): EntryResult {
  // 1. The segment must go from strictly above the plane to on/below it.
  //    A bean moving upward through the plane, or already below it, fails here —
  //    this alone rejects side/underneath approaches that never came from above.
  if (!(prev.y < entrance.y && curr.y >= entrance.y)) {
    return { entered: false, reason: 'no-cross' }
  }

  // 2. It must be descending. The crossing above already proves net downward
  //    motion over the step; this also rejects a near-horizontal shot that only
  //    grazed the plane with a hair of downward drift.
  if (velocity.y < opts.minDownSpeed) {
    return { entered: false, reason: 'not-descending' }
  }

  // 3. Interpolate X at the exact crossing and test it against the mouth.
  const dy = curr.y - prev.y
  const t = dy <= 0 ? 0 : (entrance.y - prev.y) / dy
  const crossingX = prev.x + (curr.x - prev.x) * t

  const minX = entrance.minX - opts.fairnessMargin
  const maxX = entrance.maxX + opts.fairnessMargin
  if (crossingX < minX || crossingX > maxX) {
    return { entered: false, reason: 'outside-mouth' }
  }

  return { entered: true, crossingX }
}

export type EntryOutcome = 'consume' | 'deflect' | 'ignore'

/**
 * What to do once {@link checkHopperEntry} has run. Keeps the accept-gate
 * decision in one pure, testable place: a valid top entry is consumed while the
 * grinder is accepting, deflected (bounced back into play, never destroyed)
 * while it is not.
 */
export function resolveEntryOutcome(entered: boolean, accepting: boolean): EntryOutcome {
  if (!entered) return 'ignore'
  return accepting ? 'consume' : 'deflect'
}
