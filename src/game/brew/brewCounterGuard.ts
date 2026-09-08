/**
 * Decides, from a sequence of `FilterStage` updates, the exact moment a
 * completed pot should be reported to the global counter: the rising edge
 * into `'installed'`. Pure, stateful, framework-free — no fetch, no timers,
 * no React — so it's unit-testable the same way `ThrowTracker` is, and it's
 * what actually prevents duplicate counts, not the React effect around it.
 *
 * Exact timing (this is the part that matters for correctness):
 *
 *  - MARKED COUNTED: synchronously, inside `shouldCount()`, the instant it
 *    observes `stage === 'installed'` for the first time since the last
 *    reset. This happens *before* `useBrewCounter` even starts the POST —
 *    the flag flips first, the network call comes after — so there is no
 *    async window where two calls can both still see "not counted yet".
 *  - RESET (ready for the next brew cycle): the very next time `shouldCount()`
 *    is called with any stage other than `'installed'`. There is no timer and
 *    no separate "reset" call; leaving `'installed'` *is* the reset.
 *  - DUPLICATE POSTS from React rerenders / repeated completion callbacks:
 *    `useBrewCounter` calls `shouldCount(stage)` once per `stage` change (via
 *    a `[stage]`-keyed effect), plus once extra in dev from React Strict
 *    Mode's mount -> cleanup -> mount double-invoke of that same effect. Every
 *    one of those calls after the first, for as long as `stage` stays
 *    `'installed'`, hits the `if (this.counted) return false` branch and
 *    never reaches the caller's fetch at all — so it isn't that a second POST
 *    gets sent and then discarded, no second POST is ever attempted. A second
 *    independent backstop lives in `brewMachine.ts`: `'carry-install'` is a
 *    no-op once `stage` is already `'installed'`, so even a duplicate
 *    dispatch of that action can't re-trigger the rising edge this guard
 *    watches for.
 *
 * If a future milestone adds a way to brew a second pot in one session, this
 * already does the right thing: the guard resets the moment `stage` leaves
 * `'installed'`, so the next rising edge counts again.
 */

import type { FilterStage } from './brewMachine.ts'

export class BrewCounterGuard {
  /** True from the instant the current 'installed' episode is first seen until stage leaves it. */
  private counted = false

  /** Call on every stage update. True exactly once per `'installed'` episode. */
  shouldCount(stage: FilterStage): boolean {
    if (stage !== 'installed') {
      this.counted = false // leaving 'installed' IS the reset — no separate call needed
      return false
    }
    if (this.counted) return false // already reported this episode — no second fetch, ever
    this.counted = true // flips before the caller does anything async
    return true
  }
}
