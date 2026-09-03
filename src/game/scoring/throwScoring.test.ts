import { test } from 'node:test'
import assert from 'node:assert/strict'

import { PHYSICS } from '../physics/physicsConfig.ts'
import type { ThrowTelemetry } from '../physics/types.ts'
import { classifyThrow } from './throwScoring.ts'

const S = PHYSICS.scoring

function telemetry(over: Partial<ThrowTelemetry> = {}): ThrowTelemetry {
  return {
    beanId: 1,
    dragStart: { x: 0, y: 0 },
    releasePos: { x: 0, y: 0 },
    releaseTime: 0,
    releaseVelocity: { x: 0, y: 0 },
    releaseSpeed: 0,
    pointerReleaseVelocity: { x: 0, y: 0 },
    pointerReleaseSpeed: 0,
    releasedBeforeGrinder: true,
    postReleaseTravel: 0,
    airtimeMs: 0,
    bounceCount: 0,
    entrySpeed: 0,
    success: true,
    ...over,
  }
}

test('bean dragged straight into the hopper is a direct drop (1x)', () => {
  const v = classifyThrow(telemetry({ releasedBeforeGrinder: false, releaseSpeed: 0 }))
  assert.equal(v.category, 'drop')
  assert.equal(v.multiplier, 1)
})

test('released with negligible speed is still a direct drop', () => {
  const v = classifyThrow(telemetry({ releaseSpeed: S.dropSpeed - 1, postReleaseTravel: 20 }))
  assert.equal(v.category, 'drop')
})

test('a modest released toss is a short toss (2x)', () => {
  const v = classifyThrow(
    telemetry({ releaseSpeed: S.dropSpeed + 120, postReleaseTravel: 90, airtimeMs: 260 }),
  )
  assert.equal(v.category, 'short')
  assert.equal(v.multiplier, 2)
})

test('a fast toss that also travels far is a strong toss (3x)', () => {
  const v = classifyThrow(
    telemetry({
      releaseSpeed: S.strongSpeed + 200,
      postReleaseTravel: S.strongTravel + 60,
      airtimeMs: 420,
    }),
  )
  assert.equal(v.category, 'strong')
  assert.equal(v.multiplier, 3)
})

test('fast but short throw does not reach strong — stays a short toss', () => {
  const v = classifyThrow(
    telemetry({ releaseSpeed: S.strongSpeed + 400, postReleaseTravel: S.strongTravel - 40 }),
  )
  assert.equal(v.category, 'short')
})

test('a real bounce plus meaningful travel and speed is a bank shot (4x)', () => {
  const v = classifyThrow(
    telemetry({
      releaseSpeed: S.bankMinSpeed + 100,
      postReleaseTravel: S.bankMinTravel + 80,
      bounceCount: 1,
      airtimeMs: 500,
    }),
  )
  assert.equal(v.category, 'bank')
  assert.equal(v.multiplier, 4)
})

test('one incidental collision with almost no travel is NOT a bank shot', () => {
  const v = classifyThrow(
    telemetry({
      releaseSpeed: S.bankMinSpeed + 100,
      postReleaseTravel: S.bankMinTravel - 10,
      bounceCount: 1,
    }),
  )
  assert.notEqual(v.category, 'bank')
})

test('a slow bounce (bounceCount 1) below bank speed is not a bank shot', () => {
  const v = classifyThrow(
    telemetry({
      releaseSpeed: S.bankMinSpeed - 50,
      postReleaseTravel: S.bankMinTravel + 200,
      bounceCount: 1,
    }),
  )
  assert.notEqual(v.category, 'bank')
})

test('classification is deterministic for identical telemetry', () => {
  const t = telemetry({ releaseSpeed: 700, postReleaseTravel: 150, bounceCount: 0 })
  assert.deepEqual(classifyThrow(t), classifyThrow(t))
})
