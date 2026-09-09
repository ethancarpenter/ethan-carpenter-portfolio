/**
 * The grinder's funnel geometry — the hopper mouth line plus the two angled
 * catch lips — derived purely from the `grinderHopper` scene anchor and the
 * `funnel` tuning. Scene-pixel space. No Matter.js, no DOM, no React.
 *
 * This is the ONE source of truth for that shape:
 *  - {@link ./sceneGeometry.resolveSceneGeometry} builds the Matter catch-lip
 *    bodies and the top-entry gate from it, and
 *  - the <Grinder> art draws its funnel wings and mouth from the very same
 *    numbers.
 *
 * So the visible funnel and the collision funnel cannot drift apart. A
 * regression test (grinderGeometry.test.ts) pins the output to the exact values
 * the hand-inlined version produced, so "extract the helper" changed no collider.
 */

import type { SceneAnchor } from '../sceneConfig.ts'
import type { Size } from './sceneGeometry.ts'

const DEG = Math.PI / 180

/** A catch lip as a rotated rectangle, centre-origin, scene px. */
export interface FunnelLip {
  id: 'funnel-left' | 'funnel-right'
  cx: number
  cy: number
  /** Long axis, scene px. */
  length: number
  /** Short axis (collider + drawn thickness), scene px. */
  thickness: number
  /** Rotation, radians. Scene coords: +Y down, positive = clockwise. */
  angle: number
}

export interface GrinderGeometry {
  /**
   * The hopper's top opening: a horizontal span the art's drawn mouth and the
   * physics top-entry gate both sit on.
   */
  mouth: { cx: number; y: number; halfWidth: number }
  /** `[left, right]` catch lips. Inner ends meet the mouth span's edges. */
  lips: [FunnelLip, FunnelLip]
}

/** The slice of `PHYSICS.funnel` this needs — the shape/size knobs, not the material ones. */
export interface FunnelSpec {
  /** Lip length as a multiple of the hopper anchor width. */
  lengthScale: number
  /** Lip thickness, scene px. */
  thickness: number
  /** Lip rise from horizontal, degrees. */
  angleDeg: number
}

export function resolveGrinderGeometry(
  hopper: SceneAnchor,
  size: Size,
  funnel: FunnelSpec,
  /** `PHYSICS.sensor.entranceWidthScale` — mouth width as a fraction of the anchor. */
  entranceWidthScale: number,
): GrinderGeometry {
  const { width: w, height: h } = size
  const hopperWidthPx = (hopper.width / 100) * w
  const cx = ((hopper.x + hopper.width / 2) / 100) * w
  const y = (hopper.y / 100) * h
  const halfWidth = (hopperWidthPx * entranceWidthScale) / 2

  const length = hopperWidthPx * funnel.lengthScale
  const angle = funnel.angleDeg * DEG
  const halfDx = Math.cos(angle) * (length / 2)
  const halfDy = Math.sin(angle) * (length / 2)

  const lips: [FunnelLip, FunnelLip] = [
    {
      id: 'funnel-left',
      cx: cx - halfWidth - halfDx,
      cy: y - halfDy,
      length,
      thickness: funnel.thickness,
      angle,
    },
    {
      id: 'funnel-right',
      cx: cx + halfWidth + halfDx,
      cy: y - halfDy,
      length,
      thickness: funnel.thickness,
      angle: -angle,
    },
  ]

  return { mouth: { cx, y, halfWidth }, lips }
}
