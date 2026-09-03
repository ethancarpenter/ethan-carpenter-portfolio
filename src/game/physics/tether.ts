/**
 * Pure helpers for the spring-tether grab. No Matter.js — the constraint
 * itself is created in cafePhysics; these are the bounded-safety calculations
 * that are worth testing in isolation.
 */

import type { Size } from './sceneGeometry.ts'
import type { Vec } from './types.ts'

function clamp(v: number, lo: number, hi: number): number {
  return v < lo ? lo : v > hi ? hi : v
}

/**
 * Keep the pointer anchor within `margin` px of the scene box. A pointer that
 * runs far off-screen (pointer capture keeps sending moves) would otherwise
 * give the spring an enormous lever arm.
 */
export function clampAnchorToBounds(point: Vec, size: Size, margin: number): Vec {
  return {
    x: clamp(point.x, -margin, size.width + margin),
    y: clamp(point.y, -margin, size.height + margin),
  }
}

/**
 * If the bean has drifted farther than `maxSeparation` from the anchor, return
 * the position it should be snapped back to (same direction, capped distance).
 * Returns null when the bean is within range or exactly on the anchor.
 */
export function separationCorrection(
  beanPos: Vec,
  anchor: Vec,
  maxSeparation: number,
): Vec | null {
  const dx = beanPos.x - anchor.x
  const dy = beanPos.y - anchor.y
  const dist = Math.hypot(dx, dy)
  if (dist <= maxSeparation || dist === 0 || !Number.isFinite(dist)) return null
  const k = maxSeparation / dist
  return { x: anchor.x + dx * k, y: anchor.y + dy * k }
}

/** Scale a velocity vector so its magnitude never exceeds `maxSpeed`. */
export function clampSpeed(v: Vec, maxSpeed: number): Vec {
  const s = Math.hypot(v.x, v.y)
  if (s <= maxSpeed || s === 0 || !Number.isFinite(s)) return { x: v.x, y: v.y }
  const k = maxSpeed / s
  return { x: v.x * k, y: v.y * k }
}
