/**
 * Every tunable number for the grind -> fill -> carry flow. Playtesting means
 * editing this file and nothing else; no brew component should hard-code one of
 * these constants. Units: milliseconds, whole "grounds", and scene-% (a
 * percentage of the <CafeScene> box, matching sceneConfig anchors).
 */

export interface BrewConfig {
  /**
   * Grounds needed to fill one paper filter. The core progression knob — the
   * throw multipliers add 1..4 grounds each (mostly
   * 2x/3x once thrown), so 30 is roughly 12-18 good throws.
   */
  groundsRequired: number
  /**
   * One grind cycle: from "bean confirmed" to "grounds land in the filter".
   * Kept in the 0.8-1s band the milestone asks for. Beans that arrive mid-cycle
   * are batched into the next cycle rather than spawning their own timer.
   */
  grindCycleMs: number
  /** How long the grinder keeps shaking after the most recent accepted bean. */
  reactionMs: number
  /** Ground clusters spawned per dispense (a little more for a bigger batch). 0 disables. */
  particlesPerDispense: number
  /** Extra clusters added per ground in the batch, on top of the base count. */
  particlesPerGround: number
  /** Falling-cluster animation length, ms. */
  particleFallMs: number
  /** Drop the basket within this many scene-% of the machine slot to install it. */
  snapRadiusPct: number
  /** Basket glide-home / snap-into-slot transition, ms. */
  basketReturnMs: number
}

export const BREW: BrewConfig = {
  groundsRequired: 30,
  grindCycleMs: 900,
  reactionMs: 950,
  particlesPerDispense: 4,
  particlesPerGround: 1,
  particleFallMs: 520,
  snapRadiusPct: 15,
  basketReturnMs: 320,
}
