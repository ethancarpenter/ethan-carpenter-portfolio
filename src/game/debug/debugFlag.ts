/**
 * Whether the in-scene collider/physics debug overlay is allowed to show.
 *
 * Two independent ways to turn it on, both deliberately obscure so a normal
 * visitor never sees it:
 *
 *  - a dev build (`import.meta.env.DEV`) — the tuning panel with its live
 *    "show colliders" checkbox is mounted, defaulting to off;
 *  - an explicit `?debug` (or `#debug`) in the URL — works in ANY build,
 *    including a production `vite build` served locally, so alignment can be
 *    eyeballed against the real bundle. When set this way the overlay is drawn
 *    immediately, with no panel needed.
 *
 * It never reads or writes storage and never appears in the UI, so it cannot
 * be stumbled into.
 */

/** True when `?debug` / `&debug` / `#debug` (any value) is present in the URL. */
export function debugFlagInUrl(search: string, hash: string): boolean {
  const hasParam = (s: string): boolean => {
    const q = s.startsWith('?') || s.startsWith('#') ? s.slice(1) : s
    return q
      .split(/[&;]/)
      .some((pair) => pair === 'debug' || pair.startsWith('debug='))
  }
  return hasParam(search) || hasParam(hash) || hash === '#debug'
}

/** Live check against `window.location`. Safe to call anywhere (SSR-guarded). */
export function isPhysicsDebugEnabled(): boolean {
  if (import.meta.env.DEV) return true
  if (typeof window === 'undefined') return false
  try {
    return debugFlagInUrl(window.location.search, window.location.hash)
  } catch {
    return false
  }
}

/**
 * Should the collider overlay start visible? True only for the explicit URL
 * flag — a dev build still starts with it off (toggle it from the panel), so
 * day-to-day tuning isn't cluttered by collision lines.
 */
export function shouldColliderOverlayStartOn(): boolean {
  if (typeof window === 'undefined') return false
  try {
    return debugFlagInUrl(window.location.search, window.location.hash)
  } catch {
    return false
  }
}
