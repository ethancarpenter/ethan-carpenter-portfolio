import { test } from 'node:test'
import assert from 'node:assert/strict'

import { resolveRoute } from './router.ts'

test('GET /api/brews resolves to get-count', () => {
  assert.equal(resolveRoute('GET', '/api/brews'), 'get-count')
})

test('POST /api/brews resolves to increment', () => {
  assert.equal(resolveRoute('POST', '/api/brews'), 'increment')
})

test('an unsupported method on /api/brews is method-not-allowed, not increment', () => {
  for (const method of ['PUT', 'DELETE', 'PATCH', 'HEAD']) {
    assert.equal(resolveRoute(method, '/api/brews'), 'method-not-allowed', method)
  }
})

test('any other path is not-found regardless of method', () => {
  assert.equal(resolveRoute('GET', '/api/other'), 'not-found')
  assert.equal(resolveRoute('POST', '/'), 'not-found')
  assert.equal(resolveRoute('GET', '/api/brews/'), 'not-found')
})
