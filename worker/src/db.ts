/**
 * The one stat this milestone needs. Both reads and the increment go through
 * a single prepared statement each — no read-then-write in application code,
 * so a concurrent request can never race the counter. `UPDATE ... RETURNING`
 * does the increment and the read as one atomic D1 statement.
 */

const STAT_KEY = 'coffee_pots_brewed'

interface StatRow {
  value: number
}

/**
 * The slice of `D1Database` this module actually calls. The real binding
 * (`D1Database` from `@cloudflare/workers-types`) satisfies this structurally
 * with no cast; tests pass a tiny hand-rolled fake instead of standing up a
 * real D1 runtime.
 */
export interface D1Like {
  prepare(sql: string): {
    bind(...values: unknown[]): {
      first<T = unknown>(): Promise<T | null>
    }
  }
}

/** Current count, or null if the `site_stats` row hasn't been seeded (migration not run). */
export async function getBrewCount(db: D1Like): Promise<number | null> {
  const row = await db
    .prepare('SELECT value FROM site_stats WHERE key = ?')
    .bind(STAT_KEY)
    .first<StatRow>()
  return row ? row.value : null
}

/** Atomically adds exactly 1 and returns the resulting total, or null if the row is missing. */
export async function incrementBrewCount(db: D1Like): Promise<number | null> {
  const row = await db
    .prepare('UPDATE site_stats SET value = value + 1 WHERE key = ? RETURNING value')
    .bind(STAT_KEY)
    .first<StatRow>()
  return row ? row.value : null
}
