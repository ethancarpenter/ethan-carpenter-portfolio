import { test } from 'node:test'
import assert from 'node:assert/strict'

import { BrewCounterGuard } from './brewCounterGuard.ts'
import type { FilterStage } from './brewMachine.ts'

function feed(stages: FilterStage[]): boolean[] {
  const guard = new BrewCounterGuard()
  return stages.map((s) => guard.shouldCount(s))
}

test('a full filling -> ready -> carrying -> installed run counts exactly once', () => {
  const results = feed(['filling', 'ready', 'carrying', 'installed'])
  assert.deepEqual(results, [false, false, false, true])
})

test('the stage staying installed across repeated calls never counts again', () => {
  // Simulates ordinary re-renders after the transition, and React Strict
  // Mode's mount -> cleanup -> mount double-invoke of the same effect run.
  const guard = new BrewCounterGuard()
  assert.equal(guard.shouldCount('carrying'), false)
  assert.equal(guard.shouldCount('installed'), true)
  assert.equal(guard.shouldCount('installed'), false)
  assert.equal(guard.shouldCount('installed'), false)
})

test('never reaching installed never counts', () => {
  const results = feed(['filling', 'ready', 'carrying', 'ready', 'carrying'])
  assert.ok(results.every((r) => r === false))
})

test('leaving installed resets the guard so the next pot can count', () => {
  const guard = new BrewCounterGuard()
  assert.equal(guard.shouldCount('installed'), true)
  assert.equal(guard.shouldCount('installed'), false)
  // Stage machinery has no route back out of 'installed' today, but the guard
  // itself must be correct if a future milestone adds one.
  assert.equal(guard.shouldCount('filling'), false)
  assert.equal(guard.shouldCount('carrying'), false)
  assert.equal(guard.shouldCount('installed'), true, 'a second completed pot must count')
})

test('a canceled carry (back to ready) never counts', () => {
  const results = feed(['ready', 'carrying', 'ready', 'carrying', 'ready'])
  assert.ok(results.every((r) => r === false))
})
