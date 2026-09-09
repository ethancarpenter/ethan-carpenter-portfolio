/**
 * React binding for the brew state machine. It owns the two timers the pure
 * reducer can't (the grind cycle and the grinder-shake window), plays the
 * confirmation chime, and exposes a small, stable API for the scene layers.
 *
 * The ThrowResult -> brew-state seam lives here: `handleThrow` consumes the
 * multiplier Milestone 2 already produced — it never re-scores a throw.
 */

import { useCallback, useEffect, useMemo, useReducer, useRef, useState } from 'react'

import { createChimePlayer } from '../audio/chime.ts'
import type { ChimePlayer } from '../audio/chime.ts'
import type { ThrowResult } from '../physics/types.ts'
import { BREW } from './brewConfig.ts'
import type { BrewConfig } from './brewConfig.ts'
import {
  brewReducer,
  createBrewState,
  fillRatio,
  isAcceptingBeans,
  remainingCapacity,
} from './brewMachine.ts'
import type { FilterStage, GrinderPhase } from './brewMachine.ts'

export interface BrewApi {
  grounds: number
  groundsRequired: number
  /** 0..1, clamped — safe to feed straight to a CSS custom property. */
  fillRatio: number
  phase: GrinderPhase
  stage: FilterStage
  /** True while the grinder shake animation should run. */
  reacting: boolean
  /** Increments on every grounds dispense; the view spawns particles off it. */
  dispenseTick: number
  /** Grounds added by the most recent dispense. */
  dispenseAmount: number
  /** Increments when a bean can't currently be used (drives the "busy" cue). */
  busyTick: number
  /** Mirror of the machine's accept gate, pushed into CafePhysics. */
  accepting: boolean

  /** Wire to <PhysicsLayer onThrowResolved>. Consumes the existing ThrowResult. */
  handleThrow: (result: ThrowResult) => void
  /** Wire to <PhysicsLayer onThrowRejected> (bean spat back by a full grinder). */
  handleRejectedBean: () => void

  beginCarry: () => void
  cancelCarry: () => void
  installFilter: () => void
  /**
   * Empty the brewed pot and return the whole grind -> fill -> carry -> install
   * flow to its starting state so another pot can be brewed. Purely local: it
   * never touches the global counter (no decrement, no API call) and never
   * re-triggers the completed-pot guard — leaving `'installed'` simply re-arms
   * it for the next legitimate brew. Wired to the in-scene reset control, which
   * only appears once `stage === 'installed'`.
   */
  resetPot: () => void
}

export function useBrew(cfg: BrewConfig = BREW): BrewApi {
  const [state, dispatch] = useReducer(brewReducer, cfg, createBrewState)
  const [reacting, setReacting] = useState(false)

  // The reducer state is read from event handlers that close over a stale copy;
  // this ref is the up-to-date view for those.
  const stateRef = useRef(state)
  stateRef.current = state

  const chimeRef = useRef<ChimePlayer | null>(null)
  const grindTimer = useRef<number | null>(null)
  const reactionTimer = useRef<number | null>(null)

  // The chime player is created in an effect (not lazily during render) so
  // React 19 Strict Mode's mount/unmount/mount cycle always leaves a live one.
  useEffect(() => {
    const player = createChimePlayer()
    chimeRef.current = player
    return () => {
      if (grindTimer.current != null) window.clearTimeout(grindTimer.current)
      if (reactionTimer.current != null) window.clearTimeout(reactionTimer.current)
      player.dispose()
      chimeRef.current = null
    }
  }, [])

  // Declarative grind pump: whenever something is queued and no cycle is
  // pending, schedule exactly one. `dispenseTick` in the deps re-runs this after
  // each cycle so a batch that grew mid-cycle gets its own follow-up cycle —
  // one timer at a time, no overlapping races.
  useEffect(() => {
    if (state.queued > 0 && grindTimer.current == null) {
      grindTimer.current = window.setTimeout(() => {
        grindTimer.current = null
        dispatch({ type: 'grind-cycle' })
      }, cfg.grindCycleMs)
    }
  }, [state.queued, state.dispenseTick, cfg.grindCycleMs])

  const bumpReaction = useCallback(() => {
    setReacting(true)
    if (reactionTimer.current != null) window.clearTimeout(reactionTimer.current)
    reactionTimer.current = window.setTimeout(() => {
      reactionTimer.current = null
      setReacting(false)
    }, cfg.reactionMs)
  }, [cfg.reactionMs])

  const handleThrow = useCallback(
    (result: ThrowResult) => {
      const current = stateRef.current
      if (!isAcceptingBeans(current)) {
        dispatch({ type: 'reject' })
        return
      }
      const units = Math.min(result.multiplier, remainingCapacity(current))
      chimeRef.current?.play()
      dispatch({ type: 'accept', units })
      bumpReaction()
    },
    [bumpReaction],
  )

  const handleRejectedBean = useCallback(() => {
    dispatch({ type: 'reject' })
  }, [])

  const beginCarry = useCallback(() => dispatch({ type: 'carry-start' }), [])
  const cancelCarry = useCallback(() => dispatch({ type: 'carry-cancel' }), [])
  const installFilter = useCallback(() => dispatch({ type: 'carry-install' }), [])
  const resetPot = useCallback(() => dispatch({ type: 'reset' }), [])

  return useMemo(
    () => ({
      grounds: state.grounds,
      groundsRequired: state.groundsRequired,
      fillRatio: fillRatio(state),
      phase: state.phase,
      stage: state.stage,
      reacting,
      dispenseTick: state.dispenseTick,
      dispenseAmount: state.dispenseAmount,
      busyTick: state.busyTick,
      accepting: isAcceptingBeans(state),
      handleThrow,
      handleRejectedBean,
      beginCarry,
      cancelCarry,
      installFilter,
      resetPot,
    }),
    [
      state,
      reacting,
      handleThrow,
      handleRejectedBean,
      beginCarry,
      cancelCarry,
      installFilter,
      resetPot,
    ],
  )
}
