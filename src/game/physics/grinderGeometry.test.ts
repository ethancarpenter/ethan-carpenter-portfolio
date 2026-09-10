import { test } from 'node:test'
import assert from 'node:assert/strict'

import { resolveGrinderGeometry } from './grinderGeometry.ts'
import { PHYSICS } from './physicsConfig.ts'
import { resolveSceneGeometry } from './sceneGeometry.ts'
import { desktopLayout, mobileLayout } from '../sceneConfig.ts'

const DEG = Math.PI / 180
const SIZES = [
  { width: 1200, height: 560 },
  { width: 800, height: 450 },
  { width: 1600, height: 900 },
  { width: 390, height: 490 },
]

/**
 * The exact formula the geometry used before it was extracted into
 * grinderGeometry.ts. If this drifts from `resolveGrinderGeometry`, a collider
 * moved — a regression this test exists to catch.
 */
function legacyLips(hopper: typeof desktopLayout.grinderHopper, w: number, h: number) {
  const hopperWidthPx = (hopper.width / 100) * w
  const hopperCx = ((hopper.x + hopper.width / 2) / 100) * w
  const hopperMouthY = (hopper.y / 100) * h
  const entranceHalf = (hopperWidthPx * PHYSICS.sensor.entranceWidthScale) / 2
  const minX = hopperCx - entranceHalf
  const maxX = hopperCx + entranceHalf
  const lipLen = hopperWidthPx * PHYSICS.funnel.lengthScale
  const lipAngle = PHYSICS.funnel.angleDeg * DEG
  const lipHalfDx = Math.cos(lipAngle) * (lipLen / 2)
  const lipHalfDy = Math.sin(lipAngle) * (lipLen / 2)
  return {
    left: { cx: minX - lipHalfDx, cy: hopperMouthY - lipHalfDy, width: lipLen, angle: lipAngle },
    right: { cx: maxX + lipHalfDx, cy: hopperMouthY - lipHalfDy, width: lipLen, angle: -lipAngle },
  }
}

test('resolveGrinderGeometry reproduces the pre-extraction lip geometry exactly', () => {
  for (const layout of [desktopLayout, mobileLayout]) {
    for (const size of SIZES) {
      const g = resolveGrinderGeometry(
        layout.grinderHopper,
        size,
        PHYSICS.funnel,
        PHYSICS.sensor.entranceWidthScale,
      )
      const want = legacyLips(layout.grinderHopper, size.width, size.height)
      const [left, right] = g.lips
      const near = (a: number, b: number, msg: string) =>
        assert.ok(Math.abs(a - b) < 1e-9, `${msg}: ${a} vs ${b}`)

      near(left.cx, want.left.cx, 'left cx')
      near(left.cy, want.left.cy, 'left cy')
      near(left.length, want.left.width, 'left length')
      near(left.angle, want.left.angle, 'left angle')
      near(right.cx, want.right.cx, 'right cx')
      near(right.cy, want.right.cy, 'right cy')
      near(right.angle, want.right.angle, 'right angle')
      assert.equal(left.thickness, PHYSICS.funnel.thickness)
    }
  }
})

test('the scene geometry funnel segments still match the shared helper', () => {
  const size = { width: 1180, height: 560 }
  const scene = resolveSceneGeometry(desktopLayout, size, PHYSICS)
  const g = resolveGrinderGeometry(
    desktopLayout.grinderHopper,
    size,
    PHYSICS.funnel,
    PHYSICS.sensor.entranceWidthScale,
  )
  for (const lip of g.lips) {
    const seg = scene.segments.find((s) => s.id === lip.id)
    assert.ok(seg, `missing segment ${lip.id}`)
    assert.ok(Math.abs(seg!.cx - lip.cx) < 1e-9)
    assert.ok(Math.abs(seg!.cy - lip.cy) < 1e-9)
    assert.ok(Math.abs(seg!.width - lip.length) < 1e-9)
    assert.ok(Math.abs(seg!.height - lip.thickness) < 1e-9)
    assert.ok(Math.abs(seg!.angle - lip.angle) < 1e-9)
    // Material properties stay physics-only.
    assert.equal(seg!.restitution, PHYSICS.funnel.restitution)
    assert.equal(seg!.friction, PHYSICS.funnel.friction)
  }
  // The top-entry gate still sits on the shared mouth span.
  assert.ok(Math.abs(scene.hopperEntrance.y - g.mouth.y) < 1e-9)
  assert.ok(Math.abs(scene.hopperEntrance.minX - (g.mouth.cx - g.mouth.halfWidth)) < 1e-9)
  assert.ok(Math.abs(scene.hopperEntrance.maxX - (g.mouth.cx + g.mouth.halfWidth)) < 1e-9)
})

test('lip inner ends meet the mouth span edges; lips rise outward and up', () => {
  const g = resolveGrinderGeometry(
    desktopLayout.grinderHopper,
    { width: 1200, height: 560 },
    PHYSICS.funnel,
    PHYSICS.sensor.entranceWidthScale,
  )
  const [left, right] = g.lips
  // The lip's two long-axis ends; the "inner" one is nearer the mouth centre.
  const innerEnd = (lip: typeof left) => {
    const dx = Math.cos(lip.angle) * (lip.length / 2)
    const dy = Math.sin(lip.angle) * (lip.length / 2)
    const a = { x: lip.cx + dx, y: lip.cy + dy }
    const b = { x: lip.cx - dx, y: lip.cy - dy }
    return Math.abs(a.x - g.mouth.cx) < Math.abs(b.x - g.mouth.cx) ? a : b
  }
  const li = innerEnd(left)
  const ri = innerEnd(right)
  assert.ok(Math.abs(li.x - (g.mouth.cx - g.mouth.halfWidth)) < 1e-6, 'left inner end at mouth left edge')
  assert.ok(Math.abs(li.y - g.mouth.y) < 1e-6)
  assert.ok(Math.abs(ri.x - (g.mouth.cx + g.mouth.halfWidth)) < 1e-6, 'right inner end at mouth right edge')
  // Centres are above the mouth and outside their edge.
  assert.ok(left.cy < g.mouth.y && left.cx < g.mouth.cx - g.mouth.halfWidth)
  assert.ok(right.cy < g.mouth.y && right.cx > g.mouth.cx + g.mouth.halfWidth)
})
