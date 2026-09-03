/**
 * Minimal test entry point: find every `*.test.ts` under `src/` and run it with
 * Node's built-in test runner via the `tsx` loader. Node 20.18's `--test`
 * neither globs nor discovers `.ts` files, so we collect them ourselves.
 */
import { readdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { spawnSync } from 'node:child_process'

const SRC = join(dirname(dirname(fileURLToPath(import.meta.url))), 'src')

/** @param {string} dir @returns {string[]} */
function collect(dir) {
  const out = []
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name)
    if (entry.isDirectory()) out.push(...collect(full))
    else if (entry.name.endsWith('.test.ts')) out.push(full)
  }
  return out
}

const files = collect(SRC).sort()
if (files.length === 0) {
  console.log('No *.test.ts files found under src/.')
  process.exit(0)
}

const result = spawnSync(
  process.execPath,
  ['--import', 'tsx', '--test', ...files],
  { stdio: 'inherit' },
)
process.exit(result.status ?? 1)
