import { test } from 'node:test'
import assert from 'node:assert/strict'

import { shouldPlayChime } from './chime.ts'

const cfg = { minGapMs: 90, maxVoices: 3 }
const base = { muted: false, lastPlayMs: Number.NEGATIVE_INFINITY, voices: 0, now: 1000 }

test('plays when nothing is blocking it', () => {
  assert.equal(shouldPlayChime(base, cfg), true)
})

test('never plays while muted', () => {
  assert.equal(shouldPlayChime({ ...base, muted: true }, cfg), false)
})

test('skips a chime that lands inside the minimum gap', () => {
  assert.equal(shouldPlayChime({ ...base, lastPlayMs: 950, now: 1000 }, cfg), false)
  assert.equal(shouldPlayChime({ ...base, lastPlayMs: 900, now: 1000 }, cfg), true)
})

test('skips once the voice cap is reached, so rapid landings do not pile up', () => {
  assert.equal(shouldPlayChime({ ...base, voices: 3 }, cfg), false)
  assert.equal(shouldPlayChime({ ...base, voices: 2 }, cfg), true)
})
