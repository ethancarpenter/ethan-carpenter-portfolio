import { test } from 'node:test'
import assert from 'node:assert/strict'

import { clampAnchorToBounds, clampSpeed, separationCorrection } from './tether.ts'

test('an anchor inside the scene (plus margin) is left alone', () => {
  const p = clampAnchorToBounds({ x: 120, y: 80 }, { width: 400, height: 300 }, 60)
  assert.deepEqual(p, { x: 120, y: 80 })
})

test('an anchor far off-screen is clamped to the margin band', () => {
  const size = { width: 400, height: 300 }
  assert.deepEqual(clampAnchorToBounds({ x: -9999, y: 150 }, size, 60), { x: -60, y: 150 })
  assert.deepEqual(clampAnchorToBounds({ x: 200, y: 9999 }, size, 60), { x: 200, y: 360 })
})

test('separationCorrection returns null while the bean is within range', () => {
  assert.equal(separationCorrection({ x: 10, y: 0 }, { x: 0, y: 0 }, 90), null)
  assert.equal(separationCorrection({ x: 0, y: 0 }, { x: 0, y: 0 }, 90), null)
})

test('separationCorrection snaps a runaway bean back to exactly maxSeparation', () => {
  const c = separationCorrection({ x: 300, y: 0 }, { x: 0, y: 0 }, 90)
  assert.ok(c)
  assert.equal(Math.round(Math.hypot(c.x, c.y)), 90)
  // same direction (straight right)
  assert.ok(c.x > 0 && Math.abs(c.y) < 1e-6)
})

test('separationCorrection keeps the bearing on a diagonal overshoot', () => {
  const c = separationCorrection({ x: 300, y: 400 }, { x: 0, y: 0 }, 100)
  assert.ok(c)
  assert.equal(Math.round(Math.hypot(c.x, c.y)), 100)
  assert.ok(Math.abs(c.x / c.y - 300 / 400) < 1e-6)
})

test('clampSpeed leaves a slow launch untouched and scales a fast one down', () => {
  assert.deepEqual(clampSpeed({ x: 100, y: 0 }, 2600), { x: 100, y: 0 })
  const fast = clampSpeed({ x: 6000, y: 8000 }, 2600)
  assert.equal(Math.round(Math.hypot(fast.x, fast.y)), 2600)
  assert.ok(Math.abs(fast.x / fast.y - 6000 / 8000) < 1e-6) // direction preserved
})

test('clampSpeed is NaN-safe', () => {
  const v = clampSpeed({ x: Number.NaN, y: 0 }, 2600)
  assert.ok(Number.isNaN(v.x)) // pass-through, no throw
})
