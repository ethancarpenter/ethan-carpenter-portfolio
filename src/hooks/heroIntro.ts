import { createContext, useContext } from 'react'

/**
 * Breakpoint at which the intro becomes an absolutely-positioned overlay on
 * top of the cafe (mirrors the `@media (min-width: 901px)` rule in
 * HeroIntro.module.css). Below it, the intro is stacked above the scene in
 * normal flow.
 */
export const HERO_OVERLAY_QUERY = '(min-width: 901px)'

/**
 * Shared control for the hero introduction panel.
 *
 * The panel collapses on a user click, and the bean-physics code calls
 * `autoCollapse()` when the first drag/toss begins — it only needs this
 * context, never the reverse, so the two stay decoupled.
 *
 * `autoCollapse()` is responsive-aware: it collapses only while the intro
 * overlays the scene (`overlapsScene`, i.e. desktop). Below 901px the intro
 * sits in document flow above the cafe, so collapsing it mid-drag would move
 * the scene — and therefore the physics coordinate space — under the pointer.
 * There it is a no-op; the manual collapse/expand button still works.
 */
export interface HeroIntroControls {
  collapsed: boolean
  /** True while the intro is an overlay on top of the scene (desktop). */
  overlapsScene: boolean
  /** Unconditional — used by the manual collapse button. */
  collapse: () => void
  expand: () => void
  /** Collapses only when `overlapsScene` is true. Safe to call on every drag. */
  autoCollapse: () => void
}

export const HeroIntroContext = createContext<HeroIntroControls | null>(null)

export function useHeroIntro(): HeroIntroControls {
  const controls = useContext(HeroIntroContext)
  if (!controls) {
    throw new Error('useHeroIntro must be used inside <HeroIntroProvider>')
  }
  return controls
}
