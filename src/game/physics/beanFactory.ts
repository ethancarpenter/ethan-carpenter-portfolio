/**
 * Builds the Matter.js bodies for the scene: coffee beans, the static
 * environment segments, and the hopper sensor. Body geometry only — no world,
 * no engine, no lifecycle. Bodies are tagged by `label` so collision handling
 * can tell beans, walls and the sensor apart without touching `plugin`.
 */

import Matter from 'matter-js'

import type { PhysicsConfig } from './physicsConfig.ts'
import type { HopperSensor, StaticSegment } from './sceneGeometry.ts'

export const BEAN_LABEL = 'bean'
export const SENSOR_LABEL = 'hopper-sensor'
/** `label` prefix for the static environment; the suffix is the segment id. */
export const SEGMENT_LABEL_PREFIX = 'env:'

const { Bodies, Body } = Matter

/** A bean: a chamfered rectangle, so it tips and rolls rather than spinning like a disc. */
export function createBeanBody(x: number, y: number, cfg: PhysicsConfig): Matter.Body {
  const { bean } = cfg
  const body = Bodies.rectangle(x, y, bean.width, bean.height, {
    label: BEAN_LABEL,
    chamfer: { radius: bean.chamfer },
    density: bean.density,
    restitution: bean.restitution,
    friction: bean.friction,
    frictionStatic: bean.frictionStatic,
    frictionAir: bean.frictionAir,
    sleepThreshold: 45,
  })
  Body.setAngle(body, (Math.random() - 0.5) * 0.8)
  return body
}

export function createSegmentBody(segment: StaticSegment): Matter.Body {
  const body = Bodies.rectangle(segment.cx, segment.cy, segment.width, segment.height, {
    label: `${SEGMENT_LABEL_PREFIX}${segment.id}`,
    isStatic: true,
    restitution: segment.restitution,
    friction: segment.friction,
    frictionStatic: segment.frictionStatic,
  })
  if (segment.angle !== 0) Body.setAngle(body, segment.angle)
  return body
}

export function createSensorBody(sensor: HopperSensor): Matter.Body {
  return Bodies.rectangle(sensor.cx, sensor.cy, sensor.width, sensor.height, {
    label: SENSOR_LABEL,
    isStatic: true,
    isSensor: true,
  })
}

export function isBean(body: Matter.Body): boolean {
  return body.label === BEAN_LABEL
}

export function isSensor(body: Matter.Body): boolean {
  return body.label === SENSOR_LABEL
}

export function isEnvironment(body: Matter.Body): boolean {
  return body.label.startsWith(SEGMENT_LABEL_PREFIX)
}
