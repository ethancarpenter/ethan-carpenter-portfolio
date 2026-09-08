/**
 * Pure route resolution: no Request/Response, no D1, no bindings — just method
 * + pathname in, a decision out. Kept separate so it's trivially unit-testable,
 * matching the app's existing pure-logic-first testing pattern.
 */

export type Route = 'get-count' | 'increment' | 'method-not-allowed' | 'not-found'

const BREWS_PATH = '/api/brews'

export function resolveRoute(method: string, pathname: string): Route {
  if (pathname !== BREWS_PATH) return 'not-found'
  if (method === 'GET') return 'get-count'
  if (method === 'POST') return 'increment'
  return 'method-not-allowed'
}
