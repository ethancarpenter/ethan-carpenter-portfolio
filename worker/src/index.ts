/**
 * The global coffee-brew counter API. One route, two methods:
 *
 *   GET  /api/brews  -> { count } — read-only, never mutates.
 *   POST /api/brews  -> { count } — atomically adds exactly 1, rate-limited.
 *
 * The client never sends a total; the Worker is the only thing that ever
 * changes the stored value (see db.ts). CORS is wide open (Access-Control-
 * Allow-Origin: *) because this is a public, unauthenticated, rate-limited
 * counter with nothing to protect via origin checks — the rate limiter is the
 * actual abuse control.
 */

import type { D1Database, ExecutionContext } from '@cloudflare/workers-types'

import { getBrewCount, incrementBrewCount } from './db.ts'
import { resolveRoute } from './router.ts'

/** Ambient shape for the Rate Limiting binding until every consumer is guaranteed a
 *  `@cloudflare/workers-types` version new enough to export `RateLimit` itself. */
export interface RateLimiter {
  limit(options: { key: string }): Promise<{ success: boolean }>
}

export interface Env {
  DB: D1Database
  BREW_RATE_LIMITER: RateLimiter
}

const CORS_HEADERS: Record<string, string> = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
}

function json(body: unknown, status = 200, extraHeaders?: Record<string, string>): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', ...CORS_HEADERS, ...extraHeaders },
  })
}

/** Best-effort per-visitor key for rate limiting. No auth, no cookies — just the edge IP. */
function rateLimitKey(request: Request): string {
  return request.headers.get('CF-Connecting-IP') ?? 'unknown'
}

export default {
  async fetch(request: Request, env: Env, _ctx: ExecutionContext): Promise<Response> {
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: CORS_HEADERS })
    }

    const url = new URL(request.url)
    const route = resolveRoute(request.method, url.pathname)

    try {
      switch (route) {
        case 'get-count': {
          const count = await getBrewCount(env.DB)
          if (count == null) return json({ error: 'Counter not initialized' }, 500)
          return json({ count })
        }

        case 'increment': {
          const { success } = await env.BREW_RATE_LIMITER.limit({ key: rateLimitKey(request) })
          if (!success) return json({ error: 'Too many requests' }, 429)

          const count = await incrementBrewCount(env.DB)
          if (count == null) return json({ error: 'Counter not initialized' }, 500)
          return json({ count })
        }

        case 'method-not-allowed':
          return json({ error: 'Method not allowed' }, 405, { Allow: 'GET, POST, OPTIONS' })

        case 'not-found':
        default:
          return json({ error: 'Not found' }, 404)
      }
    } catch (error) {
      console.error('brew-counter worker error:', error)
      return json({ error: 'Internal error' }, 500)
    }
  },
}
