import { test } from 'node:test'
import assert from 'node:assert/strict'

import { checkHopperEntry, resolveEntryOutcome } from './hopperEntry.ts'
import type { HopperEntrance } from './hopperEntry.ts'

// Mouth spans x 40..60 on the plane y = 100. +Y is down.
const ENTRANCE: HopperEntrance = { y: 100, minX: 40, maxX: 60 }
const RELEASED = { fairnessMargin: 7.5, minDownSpeed: 6 }
const HELD = { fairnessMargin: 7.5, minDownSpeed: 0 }

test('A: a slow bean descending through the middle of the mouth is accepted', () => {
  const r = checkHopperEntry({ x: 50, y: 90 }, { x: 50, y: 105 }, { x: 0, y: 20 }, ENTRANCE, RELEASED)
  assert.equal(r.entered, true)
  assert.ok(Math.abs((r.crossingX ?? 0) - 50) < 1e-9)
})

test('B: a bean fast enough to skip the plane between frames is still caught (swept)', () => {
  const r = checkHopperEntry(
    { x: 50, y: -220 },
    { x: 50, y: 380 },
    { x: 40, y: 3200 },
    ENTRANCE,
    RELEASED,
  )
  assert.equal(r.entered, true)
})

test('C: a near-horizontal shot entering from the left is rejected (crosses outside the mouth)', () => {
  const r = checkHopperEntry(
    { x: -100, y: 99 },
    { x: 150, y: 101 },
    { x: 4000, y: 20 },
    ENTRANCE,
    RELEASED,
  )
  assert.equal(r.entered, false)
  assert.equal(r.reason, 'outside-mouth')
})

test('D: a near-horizontal shot entering from the right is rejected', () => {
  const r = checkHopperEntry(
    { x: 200, y: 99 },
    { x: -50, y: 101 },
    { x: -4000, y: 20 },
    ENTRANCE,
    RELEASED,
  )
  assert.equal(r.entered, false)
  assert.equal(r.reason, 'outside-mouth')
})

test('E: a bean travelling upward through the hopper is rejected', () => {
  const r = checkHopperEntry({ x: 50, y: 112 }, { x: 50, y: 92 }, { x: 0, y: -40 }, ENTRANCE, RELEASED)
  assert.equal(r.entered, false)
  assert.equal(r.reason, 'no-cross')
})

test('F: a trajectory that crosses the plane Y but outside the mouth X is rejected', () => {
  const r = checkHopperEntry({ x: 90, y: 90 }, { x: 90, y: 110 }, { x: 5, y: 45 }, ENTRANCE, RELEASED)
  assert.equal(r.entered, false)
  assert.equal(r.reason, 'outside-mouth')
})

test('G: a diagonal trajectory that lands inside the opening is accepted', () => {
  const r = checkHopperEntry({ x: 30, y: 80 }, { x: 55, y: 110 }, { x: 120, y: 200 }, ENTRANCE, RELEASED)
  assert.equal(r.entered, true)
  assert.ok((r.crossingX ?? 0) > 40 && (r.crossingX ?? 0) < 60)
})

test('H: a held bean lowered slowly straight down through the top is a direct drop', () => {
  const r = checkHopperEntry({ x: 50, y: 70 }, { x: 50, y: 102 }, { x: 0, y: 8 }, ENTRANCE, HELD)
  assert.equal(r.entered, true)
})

test('I: a held bean dragged in diagonally from the side crosses outside the mouth — rejected', () => {
  const r = checkHopperEntry({ x: 12, y: 96 }, { x: 42, y: 104 }, { x: 600, y: 5 }, ENTRANCE, HELD)
  assert.equal(r.entered, false)
  assert.equal(r.reason, 'outside-mouth')
})

test('I2: a released bean fired horizontally through the mouth (vy ~ 0) is rejected as not descending', () => {
  const r = checkHopperEntry({ x: 48, y: 99.6 }, { x: 52, y: 100.4 }, { x: 900, y: 1 }, ENTRANCE, RELEASED)
  assert.equal(r.entered, false)
  assert.equal(r.reason, 'not-descending')
})

test('J: once past the plane, the very next frame does not report a second entry', () => {
  const first = checkHopperEntry(
    { x: 50, y: -80 },
    { x: 50, y: 130 },
    { x: 0, y: 3000 },
    ENTRANCE,
    RELEASED,
  )
  assert.equal(first.entered, true)
  const next = checkHopperEntry(
    { x: 50, y: 130 },
    { x: 50, y: 360 },
    { x: 0, y: 3000 },
    ENTRANCE,
    RELEASED,
  )
  assert.equal(next.entered, false)
  assert.equal(next.reason, 'no-cross')
})

test('K: a valid entry consumes while accepting and deflects (never destroys) while not', () => {
  assert.equal(resolveEntryOutcome(true, true), 'consume')
  assert.equal(resolveEntryOutcome(true, false), 'deflect')
  assert.equal(resolveEntryOutcome(false, false), 'ignore')
  assert.equal(resolveEntryOutcome(false, true), 'ignore')
})

test('the crossing calculation is deterministic', () => {
  const args = [
    { x: 33, y: 71 },
    { x: 57, y: 118 },
    { x: 90, y: 400 },
  ] as const
  assert.deepEqual(
    checkHopperEntry(args[0], args[1], args[2], ENTRANCE, RELEASED),
    checkHopperEntry(args[0], args[1], args[2], ENTRANCE, RELEASED),
  )
})
