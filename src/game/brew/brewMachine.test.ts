import { test } from 'node:test'
import assert from 'node:assert/strict'

import { BREW } from './brewConfig.ts'
import {
  brewReducer,
  createBrewState,
  fillRatio,
  isAcceptingBeans,
  remainingCapacity,
} from './brewMachine.ts'
import type { BrewAction, BrewState } from './brewMachine.ts'

const cfg = { ...BREW, groundsRequired: 12 }

function run(state: BrewState, ...actions: BrewAction[]): BrewState {
  return actions.reduce(brewReducer, state)
}

test('a fresh state is empty and idle, filling, accepting beans', () => {
  const s = createBrewState(cfg)
  assert.equal(s.grounds, 0)
  assert.equal(s.queued, 0)
  assert.equal(s.phase, 'idle')
  assert.equal(s.stage, 'filling')
  assert.equal(remainingCapacity(s), 12)
  assert.equal(isAcceptingBeans(s), true)
})

test('accept queues units and moves the grinder to grinding', () => {
  const s = run(createBrewState(cfg), { type: 'accept', units: 3 })
  assert.equal(s.queued, 3)
  assert.equal(s.grounds, 0)
  assert.equal(s.phase, 'grinding')
})

test('a grind cycle dispenses the whole queued batch into the filter', () => {
  const s = run(
    createBrewState(cfg),
    { type: 'accept', units: 2 },
    { type: 'accept', units: 3 },
    { type: 'grind-cycle' },
  )
  assert.equal(s.grounds, 5)
  assert.equal(s.queued, 0)
  assert.equal(s.dispenseTick, 1)
  assert.equal(s.dispenseAmount, 5)
  assert.equal(s.phase, 'idle')
})

test('accept never queues past remaining capacity', () => {
  // 12 required, 10 already committed -> only 2 more can be queued.
  let s = run(
    createBrewState(cfg),
    { type: 'accept', units: 4 },
    { type: 'grind-cycle' },
    { type: 'accept', units: 4 },
    { type: 'grind-cycle' },
    { type: 'accept', units: 2 },
    { type: 'grind-cycle' },
  )
  assert.equal(s.grounds, 10)
  s = brewReducer(s, { type: 'accept', units: 4 })
  assert.equal(s.queued, 2, 'clamped to the 2 remaining')
})

test('reaching the target fills exactly, never overfills, and flips to ready', () => {
  const s = run(
    createBrewState(cfg),
    { type: 'accept', units: 4 },
    { type: 'accept', units: 4 },
    { type: 'accept', units: 4 },
    { type: 'grind-cycle' },
    // one more bean lands during that same cycle window
    { type: 'accept', units: 4 },
    { type: 'grind-cycle' },
  )
  assert.equal(s.grounds, 12)
  assert.equal(fillRatio(s), 1)
  assert.equal(s.phase, 'filter-ready')
  assert.equal(s.stage, 'ready')
})

test('a full filter stops accepting; extra beans only bump busyTick', () => {
  let s = run(
    createBrewState(cfg),
    { type: 'accept', units: 4 },
    { type: 'accept', units: 4 },
    { type: 'accept', units: 4 },
    { type: 'grind-cycle' },
  )
  assert.equal(isAcceptingBeans(s), false)
  const before = { grounds: s.grounds, busy: s.busyTick }
  s = brewReducer(s, { type: 'accept', units: 3 })
  assert.equal(s.grounds, before.grounds, 'no extra grounds')
  assert.equal(s.busyTick, before.busy + 1)
})

test('reject bumps busyTick and nothing else', () => {
  const s0 = createBrewState(cfg)
  const s1 = brewReducer(s0, { type: 'reject' })
  assert.equal(s1.busyTick, 1)
  assert.equal(s1.grounds, 0)
  assert.equal(s1.queued, 0)
})

test('no accepted unit is ever lost across rapid cycles', () => {
  // Fire a burst: 1 + 2 + 3 + 4 + 2 + 4 = 16 units of intent, cap is 12.
  let s = createBrewState(cfg)
  const bursts = [1, 2, 3, 4, 2, 4]
  for (const units of bursts) {
    s = brewReducer(s, { type: 'accept', units })
    s = brewReducer(s, { type: 'grind-cycle' })
  }
  assert.equal(s.grounds + s.queued, 12, 'filled to the cap, no more, no less')
  assert.equal(s.stage, 'ready')
})

test('carry flow: start only from ready, cancel returns to ready, install locks in', () => {
  const ready = run(
    createBrewState(cfg),
    { type: 'accept', units: 4 },
    { type: 'accept', units: 4 },
    { type: 'accept', units: 4 },
    { type: 'grind-cycle' },
  )
  assert.equal(brewReducer(createBrewState(cfg), { type: 'carry-start' }).stage, 'filling')

  const carrying = brewReducer(ready, { type: 'carry-start' })
  assert.equal(carrying.stage, 'carrying')

  assert.equal(brewReducer(carrying, { type: 'carry-cancel' }).stage, 'ready')

  const installed = brewReducer(carrying, { type: 'carry-install' })
  assert.equal(installed.stage, 'installed')
  // An installed filter is inert to further carry actions.
  assert.equal(brewReducer(installed, { type: 'carry-start' }).stage, 'installed')
})

test('reset clears everything but keeps the configured target', () => {
  const dirty = run(
    { ...createBrewState(cfg), groundsRequired: 20 },
    { type: 'accept', units: 4 },
    { type: 'grind-cycle' },
  )
  const s = brewReducer(dirty, { type: 'reset' })
  assert.equal(s.grounds, 0)
  assert.equal(s.groundsRequired, 20)
  assert.equal(s.stage, 'filling')
})

test('empty pot: reset from installed returns a fully fresh, brewable cycle', () => {
  // Brew and install one full pot.
  const installed = run(
    createBrewState(cfg),
    { type: 'accept', units: 4 },
    { type: 'accept', units: 4 },
    { type: 'accept', units: 4 },
    { type: 'grind-cycle' },
    { type: 'carry-start' },
    { type: 'carry-install' },
  )
  assert.equal(installed.stage, 'installed')

  // The reset control fires this. The pot empties and the flow is back to start.
  const emptied = brewReducer(installed, { type: 'reset' })
  assert.equal(emptied.stage, 'filling')
  assert.equal(emptied.phase, 'idle')
  assert.equal(emptied.grounds, 0)
  assert.equal(emptied.queued, 0)
  assert.equal(emptied.dispenseTick, 0, 'dispense/particle counters are fresh too')
  assert.equal(emptied.busyTick, 0)
  assert.equal(isAcceptingBeans(emptied), true, 'the grinder takes beans again')

  // A second pot brews and installs normally after the reset.
  const secondPot = run(
    emptied,
    { type: 'accept', units: 4 },
    { type: 'accept', units: 4 },
    { type: 'accept', units: 4 },
    { type: 'grind-cycle' },
    { type: 'carry-start' },
    { type: 'carry-install' },
  )
  assert.equal(secondPot.stage, 'installed')
  assert.equal(fillRatio(secondPot), 1)
})

test('classification is deterministic — identical actions, identical state', () => {
  const actions: BrewAction[] = [
    { type: 'accept', units: 3 },
    { type: 'grind-cycle' },
    { type: 'accept', units: 2 },
  ]
  assert.deepEqual(run(createBrewState(cfg), ...actions), run(createBrewState(cfg), ...actions))
})
