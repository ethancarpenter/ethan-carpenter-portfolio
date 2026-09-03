import { test } from 'node:test'
import assert from 'node:assert/strict'

import { PHYSICS } from './physicsConfig.ts'
import { resolveSceneGeometry } from './sceneGeometry.ts'
import { desktopLayout, mobileLayout } from '../sceneConfig.ts'

test('the floor sits at counterTopY as a fraction of scene height', () => {
  const g = resolveSceneGeometry(desktopLayout, { width: 1000, height: 500 }, PHYSICS)
  assert.equal(g.floorY, (desktopLayout.counterTopY / 100) * 500)
})

test('the hopper sensor is centred on the grinderHopper anchor at any size', () => {
  for (const size of [
    { width: 800, height: 400 },
    { width: 1600, height: 900 },
    { width: 360, height: 640 },
  ]) {
    const g = resolveSceneGeometry(desktopLayout, size, PHYSICS)
    const expectedCx =
      ((desktopLayout.grinderHopper.x + desktopLayout.grinderHopper.width / 2) / 100) * size.width
    assert.ok(
      Math.abs(g.sensor.cx - expectedCx) < 1e-6,
      `size ${size.width}x${size.height}: sensor cx ${g.sensor.cx} vs ${expectedCx}`,
    )
  }
})

test('resizing rescales the sensor proportionally — no pixel drift', () => {
  const small = resolveSceneGeometry(desktopLayout, { width: 800, height: 450 }, PHYSICS)
  const big = resolveSceneGeometry(desktopLayout, { width: 1600, height: 900 }, PHYSICS)
  assert.ok(Math.abs(big.sensor.cx - small.sensor.cx * 2) < 1e-6)
  assert.ok(Math.abs(big.sensor.cy - small.sensor.cy * 2) < 1e-6)
  assert.ok(Math.abs(big.sensor.width - small.sensor.width * 2) < 1e-6)
})

test('the bean-to-grinder throw is shorter on a mobile scene than a desktop one', () => {
  // Each layout at a box shaped like its own breakpoint (desktop wide, mobile
  // portrait) — that's what makes the mobile throw physically shorter.
  const d = resolveSceneGeometry(desktopLayout, { width: 1180, height: 560 }, PHYSICS)
  const m = resolveSceneGeometry(mobileLayout, { width: 390, height: 490 }, PHYSICS)
  const gap = (g: typeof d) => Math.abs(g.sensor.cx - g.spawn.x)
  assert.ok(gap(m) < gap(d), `mobile gap ${gap(m).toFixed(0)} should be < desktop gap ${gap(d).toFixed(0)}`)
})

test('the ready-bean spawn rests above the counter surface', () => {
  const g = resolveSceneGeometry(desktopLayout, { width: 1000, height: 500 }, PHYSICS)
  assert.ok(g.spawn.y < g.floorY)
})

test('environment segments include a floor and four bounds', () => {
  const g = resolveSceneGeometry(desktopLayout, { width: 1000, height: 500 }, PHYSICS)
  const ids = g.segments.map((s) => s.id)
  for (const id of ['floor', 'wall-left', 'wall-right', 'ceiling', 'funnel-left', 'funnel-right']) {
    assert.ok(ids.includes(id), `missing segment ${id}`)
  }
})
