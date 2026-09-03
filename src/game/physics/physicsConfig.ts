/**
 * Every tunable number for the bean toy lives here. Nothing physics-related
 * should hard-code a constant elsewhere — playtesting means editing this file
 * and nothing else.
 *
 * Units: scene CSS pixels, milliseconds, and px/second unless noted. "Scene
 * pixels" = the live pixel size of the <CafeScene> box (see sceneGeometry).
 */

export interface ScoringThresholds {
  /** Release speed at or below this counts as a direct drop (1x). */
  dropSpeed: number
  /** Release speed for a "strong" toss. */
  strongSpeed: number
  /** Post-release travel (px) also required for "strong". */
  strongTravel: number
  /** Minimum release speed for a bank shot to be considered. */
  bankMinSpeed: number
  /** Post-release travel (px) required so a scrape along the counter can't bank. */
  bankMinTravel: number
  /** Environment bounces required for a bank shot. */
  bankMinBounces: number
}

export interface BeanTuning {
  /** Body width / height in scene px (wider than tall — a bean lies down). */
  width: number
  height: number
  /** Corner rounding; keeps it from behaving like a box. */
  chamfer: number
  density: number
  restitution: number
  friction: number
  frictionStatic: number
  frictionAir: number
}

export interface PhysicsConfig {
  gravity: {
    /** Matter world gravity Y (1 = downward). */
    y: number
    /** Matter gravity scale — the real tuning knob for "fall speed". */
    scale: number
  }
  bean: BeanTuning
  throw: {
    /** Recent-motion window used to derive release velocity. */
    sampleWindowMs: number
    /** Reject velocity samples closer together than this (divide-by-~0 guard). */
    minSampleDt: number
    /** Multiplier on the raw sampled px/s before clamping. */
    speedScale: number
    /** Hard cap on release speed, px/s. */
    maxSpeed: number
    /** Below this release speed the throw is treated as a direct drop. */
    dropSpeedThreshold: number
    /** Cap on the bean's angular velocity at launch, rad/step. */
    maxSpin: number
  }
  tether: {
    /**
     * Spring rest length between the pointer anchor and the bean centre while
     * the pointer is MOVING, px. Short — enough to swing around the cursor,
     * not so much that it feels detached.
     */
    length: number
    /** Matter constraint stiffness while moving, 0..1. Low = a soft, swingy spring. */
    stiffness: number
    /** Matter constraint damping while moving, 0..1. Bleeds off oscillation. */
    damping: number
    /**
     * Hard safety cap: the bean is never allowed farther than this from the
     * anchor (guards runaway separation, resize glitches, pointer off-screen).
     */
    maxSeparation: number
    /**
     * Gravity multiplier applied to the bean while it is held. 0 makes the held
     * bean weightless so it settles ONTO the anchor instead of hanging below it;
     * normal weight resumes the instant it is released.
     */
    heldGravityScale: number
    /** Spring rest length once the pointer has been idle — pulls the bean onto the anchor. */
    idleLength: number
    /** Constraint stiffness once idle — firmer, so the bean converges. */
    idleStiffness: number
    /** Constraint damping once idle — high, so it settles without oscillating. */
    idleDamping: number
    /** Pointer speed (px/s) at or below which the pointer counts as idle. */
    idleSpeedThreshold: number
    /** Pointer speed (px/s) that snaps straight back to the moving feel (hysteresis). */
    idleReleaseThreshold: number
    /** How long the pointer must stay slow before the tether switches to idle, ms. */
    idleDelayMs: number
    /** Per-frame blend (0..1) of the live constraint params toward the target mode. */
    idleBlend: number
  }
  bounce: {
    /** Minimum impact speed (px/s) for a collision to count as a bounce. */
    minSpeed: number
    /** Ignore further bounces on the same bean within this window. */
    cooldownMs: number
  }
  beans: {
    /** Hard cap on loose beans; oldest loose bean is culled past this. */
    maxLoose: number
    /** Delay before a fresh ready bean appears after the last one is grabbed. */
    replaceDelayMs: number
    /** Speed (px/s) under which a loose bean is considered at rest. */
    restSpeed: number
    /** Continuous rest time before a thrown bean's telemetry is finalised. */
    settleMs: number
  }
  sensor: {
    /** Hopper sensor width = grinderHopper anchor width x this. */
    widthScale: number
    /** Hopper sensor height as a fraction of scene height. */
    heightPct: number
    /**
     * How far the sensor centre sits below the hopper mouth line, as a
     * fraction of the sensor's own height. Kept relative so the sensor never
     * drifts off the opening when the scene is resized.
     */
    dropFrac: number
    /**
     * Width of the top-entry gate (the plane a bean must cross downward to
     * count), as a fraction of the grinderHopper anchor width. This is the
     * real acceptance test now — the Matter sensor is only a backstop.
     */
    entranceWidthScale: number
    /**
     * Extra half-width (as a fraction of bean width) added to the entry X
     * bounds so a shot that visibly clips the rim on the way in still counts.
     */
    entranceFairnessScale: number
    /**
     * Minimum downward velocity (px/s) for a RELEASED bean to count as entering
     * from the top. Small — a gently falling bean still qualifies; a bean fired
     * horizontally through the side (vy ~ 0) does not.
     */
    entranceMinDownSpeed: number
  }
  walls: {
    /** Thickness of the invisible bounds, px. */
    thickness: number
    restitution: number
    /** Beans this far outside the scene are culled and respawned. */
    cleanupMargin: number
  }
  funnel: {
    /** Lip segment length = hopper width x this. */
    lengthScale: number
    thickness: number
    angleDeg: number
    restitution: number
  }
  grinder: {
    /**
     * Upward speed (px/s) a bean is given when it reaches a grinder that can't
     * accept it (filter full / being carried). It is bounced back out and stays
     * in play instead of vanishing without a reward.
     */
    deflectSpeed: number
    /** Sideways nudge (px/s) added to the deflection so the bean clears the mouth. */
    deflectSideSpeed: number
    /** Minimum gap between "grinder busy" cues fired from deflections, ms. */
    deflectCueCooldownMs: number
  }
  scoring: ScoringThresholds
}

export const PHYSICS: PhysicsConfig = {
  gravity: { y: 1, scale: 0.0016 },
  bean: {
    width: 15,
    height: 10,
    chamfer: 4,
    density: 0.0018,
    restitution: 0.42,
    friction: 0.06,
    frictionStatic: 0.4,
    frictionAir: 0.012,
  },
  throw: {
    sampleWindowMs: 90,
    minSampleDt: 6,
    speedScale: 1,
    maxSpeed: 2600,
    dropSpeedThreshold: 150,
    maxSpin: 0.9,
  },
  tether: {
    length: 12,
    stiffness: 0.05,
    damping: 0.09,
    maxSeparation: 90,
    heldGravityScale: 0,
    idleLength: 0.5,
    idleStiffness: 0.2,
    idleDamping: 0.55,
    idleSpeedThreshold: 45,
    idleReleaseThreshold: 95,
    idleDelayMs: 120,
    idleBlend: 0.16,
  },
  bounce: {
    minSpeed: 130,
    cooldownMs: 110,
  },
  beans: {
    maxLoose: 20,
    replaceDelayMs: 120,
    restSpeed: 22,
    settleMs: 900,
  },
  sensor: {
    widthScale: 1.15,
    heightPct: 0.1,
    dropFrac: 0.35,
    entranceWidthScale: 0.92,
    entranceFairnessScale: 0.5,
    entranceMinDownSpeed: 6,
  },
  walls: {
    thickness: 60,
    restitution: 0.15,
    cleanupMargin: 120,
  },
  funnel: {
    lengthScale: 0.9,
    thickness: 9,
    angleDeg: 38,
    restitution: 0.4,
  },
  grinder: {
    deflectSpeed: 360,
    deflectSideSpeed: 150,
    deflectCueCooldownMs: 600,
  },
  scoring: {
    dropSpeed: 150,
    strongSpeed: 900,
    strongTravel: 180,
    bankMinSpeed: 500,
    bankMinTravel: 120,
    bankMinBounces: 1,
  },
}

/**
 * Reduced-motion tuning: the bean still responds to the player (the swing is
 * user-driven, not automatic), but it sheds energy faster so nothing keeps
 * rolling or oscillating on its own. No behaviour is added.
 */
export function withReducedMotion(cfg: PhysicsConfig, reduced: boolean): PhysicsConfig {
  if (!reduced) return cfg
  return {
    ...cfg,
    bean: {
      ...cfg.bean,
      restitution: cfg.bean.restitution * 0.65,
      frictionAir: cfg.bean.frictionAir * 2.2,
    },
    tether: { ...cfg.tether, damping: Math.min(1, cfg.tether.damping * 2) },
  }
}
