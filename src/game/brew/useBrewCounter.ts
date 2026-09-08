/**
 * React binding for the global brew counter. Fetches the current total once
 * on mount, and reports exactly one completed pot per `'installed'` episode
 * of the brew state machine — the transition-detection and dedup guarantee
 * live in the pure, unit-tested {@link BrewCounterGuard}, not here.
 *
 * Failure handling is deliberately quiet: a failed fetch or increment never
 * throws (see brewApi.ts) and never changes what's on screen — the last
 * known count (or the initial "unavailable" placeholder) just stays put.
 */

import { useEffect, useRef, useState } from 'react'

import { fetchBrewCount, postBrewCompleted } from './brewApi.ts'
import { BrewCounterGuard } from './brewCounterGuard.ts'
import type { FilterStage } from './brewMachine.ts'

export type BrewCounterState =
  | { status: 'loading' }
  | { status: 'ready'; count: number }
  /** Never yet had a real count to show (first load failed / still failing). */
  | { status: 'unavailable' }

export function useBrewCounter(stage: FilterStage): BrewCounterState {
  const [state, setState] = useState<BrewCounterState>({ status: 'loading' })
  const guardRef = useRef<BrewCounterGuard | null>(null)
  if (guardRef.current == null) guardRef.current = new BrewCounterGuard()

  useEffect(() => {
    let cancelled = false
    fetchBrewCount().then((count) => {
      if (cancelled) return
      if (count != null) setState({ status: 'ready', count })
      else setState((prev) => (prev.status === 'ready' ? prev : { status: 'unavailable' }))
    })
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    if (!guardRef.current!.shouldCount(stage)) return
    let cancelled = false
    postBrewCompleted().then((count) => {
      if (cancelled || count == null) return // failure: leave the last known state exactly as it was
      setState({ status: 'ready', count })
    })
    return () => {
      cancelled = true
    }
  }, [stage])

  return state
}
