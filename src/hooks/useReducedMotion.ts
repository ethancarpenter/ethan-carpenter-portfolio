import { useMediaQuery } from './useMediaQuery.ts'

/**
 * True when the visitor has asked for reduced motion. Gameplay and
 * decorative animation (bean wiggle, steam, particles) should check this.
 */
export function useReducedMotion(): boolean {
  return useMediaQuery('(prefers-reduced-motion: reduce)')
}
