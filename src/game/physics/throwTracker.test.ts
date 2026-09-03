import { test } from 'node:test'
import assert from 'node:assert/strict'

import { PHYSICS } from './physicsConfig.ts'
import { sampleReleaseVelocity, ThrowTracker } from './throwTracker.ts'
import type { PointerSample } from './throwTracker.ts'

const T = PHYSICS.throw

test('fewer than two samples yields zero velocity (treated as a drop)', () => {
  assert.deepEqual(sampleReleaseVelocity([], T), { x: 0, y: 0, speed: 0 })
  assert.deepEqual(sampleReleaseVelocity([{ x: 0, y: 0, t: 0 }], T), { x: 0, y: 0, speed: 0 })
})

test('a near-zero time delta is rejected, not divided by', () => {
  const samples: PointerSample[] = [
    { x: 0, y: 0, t: 1000 },
    { x: 50, y: 0, t: 1000 + T.minSampleDt / 2 },
  ]
  const v = sampleReleaseVelocity(samples, T)
  assert.equal(v.speed, 0)
})

test('velocity comes from the recent window, not the whole drag', () => {
  // Slow for 400ms, then a fast 60px flick over the final 30ms.
  const samples: PointerSample[] = [
    { x: 0, y: 0, t: 0 },
    { x: 10, y: 0, t: 400 },
    { x: 70, y: 0, t: 430 },
  ]
  const v = sampleReleaseVelocity(samples, T)
  // ~ (70-10)/30 * 1000 = 2000 px/s, far faster than the whole-drag 70/430*1000.
  assert.ok(v.x > 1500, `expected a fast flick, got ${v.x}`)
})

test('speed is clamped to the configured maximum', () => {
  const samples: PointerSample[] = [
    { x: 0, y: 0, t: 0 },
    { x: 100000, y: 0, t: 16 },
  ]
  const v = sampleReleaseVelocity(samples, T)
  assert.ok(v.speed <= T.maxSpeed + 1e-6)
  assert.equal(Math.round(v.speed), T.maxSpeed)
})

test('a non-finite sample does not produce NaN velocity', () => {
  const samples: PointerSample[] = [
    { x: Number.NaN, y: 0, t: 0 },
    { x: 10, y: 0, t: 16 },
  ]
  const v = sampleReleaseVelocity(samples, T)
  assert.ok(Number.isFinite(v.x) && Number.isFinite(v.y) && Number.isFinite(v.speed))
})

test('diagonal flick keeps both components and a matching magnitude', () => {
  const samples: PointerSample[] = [
    { x: 0, y: 0, t: 0 },
    { x: 30, y: 40, t: 50 },
  ]
  const v = sampleReleaseVelocity(samples, T)
  assert.ok(v.x > 0 && v.y > 0)
  assert.ok(Math.abs(v.speed - Math.hypot(v.x, v.y)) < 1e-6)
})

test('ThrowTracker.release records the bean body velocity, not the pointer gesture', () => {
  const tracker = new ThrowTracker(1, { x: 0, y: 0 }, 0, PHYSICS)
  // Pointer barely moved (a near-still cursor at the moment of release)...
  tracker.addPointerSample({ x: 2, y: 0 }, 40)
  tracker.addPointerSample({ x: 3, y: 0 }, 80)
  // ...but the swinging bean is moving fast.
  const beanVelocity = { x: 0, y: 900 }
  tracker.release({ x: 3, y: 40 }, beanVelocity, 100)
  const tele = tracker.finalize(120, 0, false)

  assert.deepEqual(tele.releaseVelocity, beanVelocity)
  assert.equal(Math.round(tele.releaseSpeed), 900)
  // Gesture info is retained separately and is clearly slower.
  assert.ok(tele.pointerReleaseSpeed < 200)
  assert.ok(tele.releasedBeforeGrinder)
})

test('ThrowTracker direct drag-in still records a 1x-worthy telemetry', () => {
  const tracker = new ThrowTracker(2, { x: 0, y: 0 }, 0, PHYSICS)
  tracker.addPointerSample({ x: 5, y: 5 }, 60)
  tracker.markEnteredWhileHeld({ x: 5, y: 5 }, 90)
  const tele = tracker.finalize(90, 30, true)
  assert.equal(tele.releasedBeforeGrinder, false)
  assert.equal(tele.releaseSpeed, 0)
})
