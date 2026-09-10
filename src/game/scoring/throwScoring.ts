/**
 * Pure, deterministic throw classification. No Matter.js, no DOM, no clock —
 * everything it needs is in the telemetry it's handed, so it is trivially
 * unit-testable and safe to reuse from the brew flow.
 */

import type { ScoringThresholds } from '../physics/physicsConfig.ts'
import { PHYSICS } from '../physics/physicsConfig.ts'
import type { ThrowCategory, ThrowResult, ThrowTelemetry } from '../physics/types.ts'

const LABELS: Record<ThrowCategory, string> = {
  drop: 'Direct drop',
  short: 'Nice toss',
  strong: 'Great shot',
  bank: 'Bank shot',
}

const MULTIPLIERS: Record<ThrowCategory, 1 | 2 | 3 | 4> = {
  drop: 1,
  short: 2,
  strong: 3,
  bank: 4,
}

export interface ThrowVerdict {
  category: ThrowCategory
  multiplier: 1 | 2 | 3 | 4
  label: string
}

/**
 * Classify a resolved throw from its telemetry.
 *
 * Order matters:
 *  1. No genuine release, or negligible release speed → direct drop.
 *  2. A real bounce off the environment *and* meaningful travel *and* enough
 *     release speed → bank shot. The travel gate stops a bean that merely
 *     scraped the counter on the way over from banking.
 *  3. Fast release that also covered real distance → strong toss.
 *  4. Anything else that made it in → short toss.
 */
export function classifyThrow(
  telemetry: ThrowTelemetry,
  thresholds: ScoringThresholds = PHYSICS.scoring,
): ThrowVerdict {
  const category = categorize(telemetry, thresholds)
  return { category, multiplier: MULTIPLIERS[category], label: LABELS[category] }
}

function categorize(t: ThrowTelemetry, s: ScoringThresholds): ThrowCategory {
  if (!t.releasedBeforeGrinder || t.releaseSpeed < s.dropSpeed) {
    return 'drop'
  }

  const bankedOffSomething =
    t.bounceCount >= s.bankMinBounces &&
    t.postReleaseTravel >= s.bankMinTravel &&
    t.releaseSpeed >= s.bankMinSpeed
  if (bankedOffSomething) return 'bank'

  if (t.releaseSpeed >= s.strongSpeed && t.postReleaseTravel >= s.strongTravel) {
    return 'strong'
  }

  return 'short'
}

/** Attach the verdict to its telemetry to make the emitted {@link ThrowResult}. */
export function toThrowResult(
  telemetry: ThrowTelemetry,
  thresholds?: ScoringThresholds,
): ThrowResult {
  return { ...classifyThrow(telemetry, thresholds), telemetry }
}
