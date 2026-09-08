/**
 * Talks to the global brew-counter Worker (see worker/src/index.ts). Same-
 * origin relative path on purpose: Vite proxies `/api` to `wrangler dev` in
 * local dev (vite.config.ts), and production points a Cloudflare Route at the
 * deployed Worker, so the client never needs an absolute URL or CORS at all.
 *
 * Every export here resolves to `null` on any failure (network error, bad
 * status, malformed body) instead of throwing. The coffee game must stay
 * fully usable when this API is unreachable, so nothing upstream should ever
 * need a try/catch around these calls.
 */

const BREWS_ENDPOINT = '/api/brews'

async function parseCount(res: Response): Promise<number | null> {
  if (!res.ok) return null
  try {
    const body: unknown = await res.json()
    const count = (body as { count?: unknown } | null)?.count
    return typeof count === 'number' && Number.isFinite(count) ? count : null
  } catch {
    return null
  }
}

/** The current global total, or null if it couldn't be fetched. Never mutates anything. */
export async function fetchBrewCount(): Promise<number | null> {
  try {
    return await parseCount(await fetch(BREWS_ENDPOINT, { method: 'GET' }))
  } catch {
    return null
  }
}

/**
 * Reports one legitimately completed pot. Resolves to the server's new
 * authoritative total, or null if the increment did not happen (network
 * failure, rate limit, server error) — callers must never fake a success.
 */
export async function postBrewCompleted(): Promise<number | null> {
  try {
    return await parseCount(await fetch(BREWS_ENDPOINT, { method: 'POST' }))
  } catch {
    return null
  }
}
