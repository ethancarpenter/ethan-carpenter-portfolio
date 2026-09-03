import { test } from 'node:test'
import assert from 'node:assert/strict'

import { anchorCenter, clientToScenePct, pctDistance, withinSnap } from './dragMath.ts'

const RECT = { left: 100, top: 50, width: 400, height: 300 }

test('clientToScenePct maps a point inside the box to a percentage', () => {
  assert.deepEqual(clientToScenePct(300, 200, RECT), { x: 50, y: 50 })
  assert.deepEqual(clientToScenePct(100, 50, RECT), { x: 0, y: 0 })
  assert.deepEqual(clientToScenePct(500, 350, RECT), { x: 100, y: 100 })
})

test('clientToScenePct clamps points outside the box to 0..100', () => {
  assert.deepEqual(clientToScenePct(-999, -999, RECT), { x: 0, y: 0 })
  assert.deepEqual(clientToScenePct(9999, 9999, RECT), { x: 100, y: 100 })
})

test('clientToScenePct tolerates a zero-sized rect without dividing by zero', () => {
  const p = clientToScenePct(10, 10, { left: 0, top: 0, width: 0, height: 0 })
  assert.ok(Number.isFinite(p.x) && Number.isFinite(p.y))
})

test('pctDistance is a plain hypotenuse in percentage units', () => {
  assert.equal(pctDistance({ x: 0, y: 0 }, { x: 3, y: 4 }), 5)
})

test('withinSnap is forgiving inside the radius and false outside it', () => {
  const target = { x: 78, y: 42 }
  assert.equal(withinSnap({ x: 80, y: 45 }, target, 15), true)
  assert.equal(withinSnap({ x: 78, y: 42 }, target, 15), true)
  assert.equal(withinSnap({ x: 60, y: 20 }, target, 15), false)
})

test('anchorCenter returns the middle of a sceneConfig anchor', () => {
  assert.deepEqual(anchorCenter({ x: 40, y: 50, width: 20 }, 10), { x: 50, y: 55 })
})
