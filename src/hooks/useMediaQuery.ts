import { useSyncExternalStore } from 'react'

/**
 * Subscribe to a CSS media query. SSR-safe and re-renders on change.
 *
 * @example const isMobile = useMediaQuery('(max-width: 720px)')
 */
export function useMediaQuery(query: string): boolean {
  return useSyncExternalStore(
    (onChange) => {
      const mql = window.matchMedia(query)
      mql.addEventListener('change', onChange)
      return () => mql.removeEventListener('change', onChange)
    },
    () => window.matchMedia(query).matches,
    () => false,
  )
}
