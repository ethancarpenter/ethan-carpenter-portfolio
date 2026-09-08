import { test } from 'node:test'
import assert from 'node:assert/strict'

import { fetchBrewCount, postBrewCompleted } from './brewApi.ts'

/** Swaps global fetch for the duration of one test, always restoring it after. */
async function withFetch<T>(impl: typeof fetch, run: () => Promise<T>): Promise<T> {
  const original = globalThis.fetch
  globalThis.fetch = impl
  try {
    return await run()
  } finally {
    globalThis.fetch = original
  }
}

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

test('fetchBrewCount returns the count on a healthy response', async () => {
  const count = await withFetch(
    async () => jsonResponse({ count: 42 }),
    () => fetchBrewCount(),
  )
  assert.equal(count, 42)
})

test('postBrewCompleted returns the server-authoritative new total', async () => {
  const count = await withFetch(
    async (_input, init) => {
      assert.equal(init?.method, 'POST')
      return jsonResponse({ count: 43 })
    },
    () => postBrewCompleted(),
  )
  assert.equal(count, 43)
})

test('a network error resolves to null instead of throwing', async () => {
  await assert.doesNotReject(async () => {
    const count = await withFetch(
      async () => {
        throw new TypeError('network down')
      },
      () => fetchBrewCount(),
    )
    assert.equal(count, null)
  })
})

test('a non-2xx status resolves to null and is not treated as a count', async () => {
  const count = await withFetch(
    async () => jsonResponse({ error: 'Too many requests' }, 429),
    () => postBrewCompleted(),
  )
  assert.equal(count, null)
})

test('a malformed body resolves to null instead of throwing', async () => {
  const count = await withFetch(
    async () => new Response('not json', { status: 200 }),
    () => fetchBrewCount(),
  )
  assert.equal(count, null)
})

test('a body without a numeric count resolves to null', async () => {
  const count = await withFetch(
    async () => jsonResponse({ count: '42' }),
    () => fetchBrewCount(),
  )
  assert.equal(count, null)
})
