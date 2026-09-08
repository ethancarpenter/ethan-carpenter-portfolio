import { test } from 'node:test'
import assert from 'node:assert/strict'

import { getBrewCount, incrementBrewCount } from './db.ts'
import type { D1Like } from './db.ts'

/**
 * A tiny in-memory stand-in for the one D1 shape db.ts uses
 * (`prepare(sql).bind(...).first()`), just enough to exercise the two real
 * queries. Not a SQLite engine: it pattern-matches UPDATE vs SELECT by regex,
 * which is fine because db.ts only ever sends these exact two statements.
 */
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

test('getBrewCount reads the seeded value without changing it', async () => {
  const db = fakeD1({ coffee_pots_brewed: 41 })
  assert.equal(await getBrewCount(db), 41)
  assert.equal(await getBrewCount(db), 41, 'a second read must not mutate the value')
})

test('getBrewCount returns null when the row is missing (migration not run)', async () => {
  const db = fakeD1({})
  assert.equal(await getBrewCount(db), null)
})

test('incrementBrewCount adds exactly 1 and returns the new total', async () => {
  const db = fakeD1({ coffee_pots_brewed: 0 })
  assert.equal(await incrementBrewCount(db), 1)
  assert.equal(await incrementBrewCount(db), 2)
})

test('multiple sequential increments produce the expected running total', async () => {
  const db = fakeD1({ coffee_pots_brewed: 100 })
  const totals: number[] = []
  for (let i = 0; i < 5; i += 1) {
    totals.push((await incrementBrewCount(db))!)
  }
  assert.deepEqual(totals, [101, 102, 103, 104, 105])
})

test('incrementBrewCount returns null when the row is missing', async () => {
  const db = fakeD1({})
  assert.equal(await incrementBrewCount(db), null)
})
