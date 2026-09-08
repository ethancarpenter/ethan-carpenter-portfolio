import { test } from 'node:test'
import assert from 'node:assert/strict'

import worker from './index.ts'
import type { Env, RateLimiter } from './index.ts'
import type { D1Like } from './db.ts'

/** Same minimal fake as db.test.ts, duplicated locally so this file stays self-contained. */
function fakeD1(seed: Record<string, number> = {}): D1Like {
  const rows = new Map(Object.entries(seed))
  return {
    prepare(sql: string) {
      return {
        bind(...values: unknown[]) {
          return {
            async first<T>(): Promise<T | null> {
              const key = values[0] as string
              if (!rows.has(key)) return null
              if (/^UPDATE/i.test(sql)) {
                const next = (rows.get(key) ?? 0) + 1
                rows.set(key, next)
                return { value: next } as T
              }
              return { value: rows.get(key) } as T
            },
          }
        },
      }
    },
  }
}

/** Always allows, unless told to always deny — enough to test both branches. */
function fakeRateLimiter(allow = true): RateLimiter {
  return { limit: async () => ({ success: allow }) }
}

function env(db: D1Like, allow = true): Env {
  return { DB: db as Env['DB'], BREW_RATE_LIMITER: fakeRateLimiter(allow) }
}

const ctx = {} as ExecutionContext

test('GET /api/brews returns the stored count and does not mutate it', async () => {
  const db = fakeD1({ coffee_pots_brewed: 7 })
  const res = await worker.fetch(new Request('http://x/api/brews'), env(db), ctx)
  assert.equal(res.status, 200)
  assert.deepEqual(await res.json(), { count: 7 })

  const res2 = await worker.fetch(new Request('http://x/api/brews'), env(db), ctx)
  assert.deepEqual(await res2.json(), { count: 7 }, 'GET must never increment')
})

test('POST /api/brews increments by exactly one and returns the new total', async () => {
  const db = fakeD1({ coffee_pots_brewed: 7 })
  const res = await worker.fetch(new Request('http://x/api/brews', { method: 'POST' }), env(db), ctx)
  assert.equal(res.status, 200)
  assert.deepEqual(await res.json(), { count: 8 })
})

test('multiple legitimate POSTs produce the expected running total', async () => {
  const db = fakeD1({ coffee_pots_brewed: 0 })
  const e = env(db)
  const totals: number[] = []
  for (let i = 0; i < 3; i += 1) {
    const res = await worker.fetch(new Request('http://x/api/brews', { method: 'POST' }), e, ctx)
    totals.push(((await res.json()) as { count: number }).count)
  }
  assert.deepEqual(totals, [1, 2, 3])
})

test('an unsupported method returns 405 and does not increment', async () => {
  const db = fakeD1({ coffee_pots_brewed: 3 })
  const e = env(db)
  const res = await worker.fetch(new Request('http://x/api/brews', { method: 'DELETE' }), e, ctx)
  assert.equal(res.status, 405)

  const check = await worker.fetch(new Request('http://x/api/brews'), e, ctx)
  assert.deepEqual(await check.json(), { count: 3 })
})

test('an unknown path returns 404 and does not increment', async () => {
  const db = fakeD1({ coffee_pots_brewed: 3 })
  const e = env(db)
  const res = await worker.fetch(new Request('http://x/api/nope', { method: 'POST' }), e, ctx)
  assert.equal(res.status, 404)

  const check = await worker.fetch(new Request('http://x/api/brews'), e, ctx)
  assert.deepEqual(await check.json(), { count: 3 })
})

test('a rate-limited POST returns 429 and does not increment', async () => {
  const db = fakeD1({ coffee_pots_brewed: 5 })
  const blocked = env(db, false)
  const res = await worker.fetch(new Request('http://x/api/brews', { method: 'POST' }), blocked, ctx)
  assert.equal(res.status, 429)

  const check = await worker.fetch(
    new Request('http://x/api/brews'),
    env(db, true),
    ctx,
  )
  assert.deepEqual(await check.json(), { count: 5 })
})

test('a missing/unseeded counter row fails cleanly instead of inventing a value', async () => {
  const db = fakeD1({})
  const res = await worker.fetch(new Request('http://x/api/brews', { method: 'POST' }), env(db), ctx)
  assert.equal(res.status, 500)
  const body = (await res.json()) as { error: string }
  assert.ok(body.error)
})
