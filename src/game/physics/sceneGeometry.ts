/**
 * Turns a `SceneLayout` (percentage anchors, shared with the CSS art) plus the
 * live pixel size of the <CafeScene> box into concrete Matter.js geometry, in
 * scene pixels. Pure: no Matter.js, no DOM. The controller rebuilds bodies from
 * this on every resize and breakpoint change, so the sensor and walls can never
 * drift away from the drawn scene.
 */

import type { PhysicsConfig } from './physicsConfig.ts'
import type { SceneLayout } from '../sceneConfig.ts'

export interface Size {
  width: number
  height: number
}

/** An axis-aligned or rotated static rectangle, centre-origin. */
export interface StaticSegment {
  id: string
  cx: number
  cy: number
  width: number
  height: number
  angle: number
  restitution: number
}

export interface HopperSensor {
  cx: number
  cy: number
  width: number
  height: number
}

export interface SceneGeometry {
  size: Size
  /** World Y of the countertop surface. */
  floorY: number
  segments: StaticSegment[]
  sensor: HopperSensor
  /** Where a fresh ready bean is placed (rests onto the counter from here). */
  spawn: { x: number; y: number }
  /** A bean fully outside this box is culled. */
  cleanup: { minX: number; maxX: number; maxY: number }
}

const DEG = Math.PI / 180

export function resolveSceneGeometry(
  layout: SceneLayout,
  size: Size,
  cfg: PhysicsConfig,
): SceneGeometry {
  const { width: w, height: h } = size
  const floorY = (layout.counterTopY / 100) * h
  const t = cfg.walls.thickness

  const hopper = layout.grinderHopper
  const hopperCx = ((hopper.x + hopper.width / 2) / 100) * w
  const hopperMouthY = (hopper.y / 100) * h
  const sensorW = (hopper.width / 100) * w * cfg.sensor.widthScale
  const sensorH = cfg.sensor.heightPct * h
  const sensorDrop = sensorH * cfg.sensor.dropFrac
  const sensor: HopperSensor = {
    cx: hopperCx,
    cy: hopperMouthY + sensorDrop + sensorH / 2,
    width: sensorW,
    height: sensorH,
  }

  const segments: StaticSegment[] = [
    // Countertop — beans land, bounce, roll and settle on this.
    {
      id: 'floor',
      cx: w / 2,
      cy: floorY + t / 2,
      width: w + t * 2,
      height: t,
      angle: 0,
      restitution: cfg.walls.restitution,
    },
    // Scene bounds, nudged just off-screen (the scene box already clips).
    {
      id: 'wall-left',
      cx: -t / 2,
      cy: h / 2,
      width: t,
      height: h * 2 + t,
      angle: 0,
      restitution: cfg.walls.restitution,
    },
    {
      id: 'wall-right',
      cx: w + t / 2,
      cy: h / 2,
      width: t,
      height: h * 2 + t,
      angle: 0,
      restitution: cfg.walls.restitution,
    },
    {
      id: 'ceiling',
      cx: w / 2,
      cy: -t / 2,
      width: w + t * 2,
      height: t,
      angle: 0,
      restitution: cfg.walls.restitution,
    },
  ]

  // Two short angled lips framing the hopper mouth: rim bounces and bank shots
  // read well, and an obvious near-miss glances off instead of falling in.
  const lipLen = sensorW * cfg.funnel.lengthScale
  const lipAngle = cfg.funnel.angleDeg * DEG
  const lipInset = sensorW / 2
  const lipCy = hopperMouthY - Math.sin(lipAngle) * (lipLen / 2) + sensorDrop
  segments.push(
    {
      id: 'funnel-left',
      cx: hopperCx - lipInset - Math.cos(lipAngle) * (lipLen / 2),
      cy: lipCy,
      width: lipLen,
      height: cfg.funnel.thickness,
      angle: lipAngle,
      restitution: cfg.funnel.restitution,
    },
    {
      id: 'funnel-right',
      cx: hopperCx + lipInset + Math.cos(lipAngle) * (lipLen / 2),
      cy: lipCy,
      width: lipLen,
      height: cfg.funnel.thickness,
      angle: -lipAngle,
      restitution: cfg.funnel.restitution,
    },
  )

  const bowl = layout.beanBowl
  const spawn = {
    x: ((bowl.x + bowl.width / 2) / 100) * w,
    y: floorY - cfg.bean.height * 1.5,
  }

  const margin = cfg.walls.cleanupMargin
  return {
    size: { width: w, height: h },
    floorY,
    segments,
    sensor,
    spawn,
    cleanup: { minX: -margin, maxX: w + margin, maxY: h + margin },
  }
}

/** Ids of the segments that count as "environment" for bounce telemetry. */
export const ENVIRONMENT_SEGMENT_IDS: ReadonlySet<string> = new Set([
  'floor',
  'wall-left',
  'wall-right',
  'ceiling',
  'funnel-left',
  'funnel-right',
])
