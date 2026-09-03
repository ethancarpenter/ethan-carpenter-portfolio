/**
 * Pure geometry helpers for dragging the filter basket. Everything is in
 * "scene-%" (0..100 of the <CafeScene> box), the same space sceneConfig anchors
 * use, so the maths survives a resize. No DOM beyond a plain rect object.
 */

export interface PctPoint {
  x: number
  y: number
}

export interface RectLike {
  left: number
  top: number
  width: number
  height: number
}

function clamp(n: number, lo: number, hi: number): number {
  return Math.min(hi, Math.max(lo, n))
}

/** Client px -> scene-% (0..100), clamped to the box. */
export function clientToScenePct(clientX: number, clientY: number, rect: RectLike): PctPoint {
  const w = rect.width || 1
  const h = rect.height || 1
  return {
    x: clamp(((clientX - rect.left) / w) * 100, 0, 100),
    y: clamp(((clientY - rect.top) / h) * 100, 0, 100),
  }
}

/**
 * Distance between two scene-% points. x and y are percentages of different
 * axes, so this is not a true pixel distance — good enough for a forgiving snap
 * test where the radius is deliberately generous.
 */
export function pctDistance(a: PctPoint, b: PctPoint): number {
  return Math.hypot(a.x - b.x, a.y - b.y)
}

/** True when `from` is close enough to `target` to snap into place. */
export function withinSnap(from: PctPoint, target: PctPoint, radiusPct: number): boolean {
  return pctDistance(from, target) <= radiusPct
}

/** Centre point of a sceneConfig-style anchor, in scene-%. */
export function anchorCenter(anchor: { x: number; y: number; width: number }, heightPct: number): PctPoint {
  return { x: anchor.x + anchor.width / 2, y: anchor.y + heightPct / 2 }
}
