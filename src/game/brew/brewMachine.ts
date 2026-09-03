/**
 * The coffee-preparation state machine. Pure and deterministic: no Matter.js, no
 * React, no DOM, no clock. Matter.js reports classified {@link ThrowResult}s in
 * through the {@link useBrew} hook, which turns them into the actions below and
 * owns the timers; this module only decides how state changes.
 *
 * Conceptual phases (kept deliberately small):
 *
 *   grinder:  idle -> grinding -> filter-ready
 *   filter:   filling -> ready -> carrying -> installed
 *
 * The filter never gains grounds past `groundsRequired`, and once it is `ready`
 * every further bean is a no-op that only bumps `busyTick` (the "grinder is
 * waiting for you to move the filter" cue).
 */

import { BREW } from './brewConfig.ts'
import type { BrewConfig } from './brewConfig.ts'

export type GrinderPhase = 'idle' | 'grinding' | 'filter-ready'
export type FilterStage = 'filling' | 'ready' | 'carrying' | 'installed'

export interface BrewState {
  /** Grounds one filter needs. Copied from config so a reset can reuse it. */
  groundsRequired: number
  /** Committed grounds visible in the filter. Never exceeds `groundsRequired`. */
  grounds: number
  /** Accepted multiplier units waiting for the next grind cycle to dispense. */
  queued: number
  phase: GrinderPhase
  stage: FilterStage
  /** Bumped each time grounds are dispensed; the view spawns particles off it. */
  dispenseTick: number
  /** Grounds added by the most recent dispense (for particle count). */
  dispenseAmount: number
  /** Bumped whenever a bean arrives that the grinder can't currently use. */
  busyTick: number
}

export type BrewAction =
  /** A bean was accepted; `units` is already clamped to remaining capacity. */
  | { type: 'accept'; units: number }
  /** A bean arrived but the grinder can't use it (filter full / mid-move). */
  | { type: 'reject' }
  /** A grind cycle finished: move everything queued into the filter. */
  | { type: 'grind-cycle' }
  | { type: 'carry-start' }
  | { type: 'carry-cancel' }
  | { type: 'carry-install' }
  | { type: 'reset' }

export function createBrewState(cfg: BrewConfig = BREW): BrewState {
  return {
    groundsRequired: cfg.groundsRequired,
    grounds: 0,
    queued: 0,
    phase: 'idle',
    stage: 'filling',
    dispenseTick: 0,
    dispenseAmount: 0,
    busyTick: 0,
  }
}

/** Room left for more grounds, counting what is already queued to grind. */
export function remainingCapacity(s: BrewState): number {
  return Math.max(0, s.groundsRequired - s.grounds - s.queued)
}

/** 0..1 fill level for the visible grounds mound. Clamped — never overfills. */
export function fillRatio(s: BrewState): number {
  if (s.groundsRequired <= 0) return 1
  return Math.min(1, s.grounds / s.groundsRequired)
}

/**
 * True while a fresh bean can still contribute to this batch. Mirrored into
 * CafePhysics so a bean tossed at a full grinder is spat back out instead of
 * vanishing for no reward.
 */
export function isAcceptingBeans(s: BrewState): boolean {
  return s.stage === 'filling' && remainingCapacity(s) > 0
}

export function brewReducer(state: BrewState, action: BrewAction): BrewState {
  switch (action.type) {
    case 'accept': {
      const units = Math.min(Math.max(0, Math.floor(action.units)), remainingCapacity(state))
      if (units <= 0) return { ...state, busyTick: state.busyTick + 1 }
      return { ...state, queued: state.queued + units, phase: 'grinding' }
    }

    case 'reject':
      return { ...state, busyTick: state.busyTick + 1 }

    case 'grind-cycle': {
      if (state.queued <= 0) {
        // Nothing to dispense (a stray cycle) — settle the phase and move on.
        const phase = state.stage === 'filling' ? 'idle' : state.phase
        return phase === state.phase ? state : { ...state, phase }
      }
      const room = state.groundsRequired - state.grounds
      const added = Math.max(0, Math.min(state.queued, room))
      const grounds = state.grounds + added
      const full = grounds >= state.groundsRequired
      return {
        ...state,
        grounds,
        queued: 0,
        phase: full ? 'filter-ready' : 'idle',
        stage: full && state.stage === 'filling' ? 'ready' : state.stage,
        dispenseTick: state.dispenseTick + 1,
        dispenseAmount: added,
      }
    }

    case 'carry-start':
      return state.stage === 'ready' ? { ...state, stage: 'carrying' } : state

    case 'carry-cancel':
      return state.stage === 'carrying' ? { ...state, stage: 'ready' } : state

    case 'carry-install':
      return state.stage === 'carrying' ? { ...state, stage: 'installed' } : state

    case 'reset':
      return createBrewState({ ...BREW, groundsRequired: state.groundsRequired })
  }
}
