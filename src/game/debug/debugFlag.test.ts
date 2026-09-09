import { test } from 'node:test'
import assert from 'node:assert/strict'

import { debugFlagInUrl } from './debugFlag.ts'

test('debug flag is off for a normal visitor URL', () => {
  assert.equal(debugFlagInUrl('', ''), false)
  assert.equal(debugFlagInUrl('?utm_source=x&ref=y', '#projects'), false)
  assert.equal(debugFlagInUrl('?nodebug=1', ''), false)
  assert.equal(debugFlagInUrl('?debugging=1', ''), false, 'must be the exact key, not a prefix match')
})

test('debug flag is on with ?debug in the query, alone or alongside others', () => {
  assert.equal(debugFlagInUrl('?debug', ''), true)
  assert.equal(debugFlagInUrl('?debug=1', ''), true)
  assert.equal(debugFlagInUrl('?a=1&debug&b=2', ''), true)
  assert.equal(debugFlagInUrl('?a=1&debug=colliders', ''), true)
})

test('debug flag is on with #debug in the hash', () => {
  assert.equal(debugFlagInUrl('', '#debug'), true)
  assert.equal(debugFlagInUrl('', '#a&debug'), true)
})
