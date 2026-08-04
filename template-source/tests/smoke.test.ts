import { strict as assert } from 'node:assert/strict'
import { test } from 'node:test'

test('Bun test runner is available', () => {
  assert.ok(process.versions.bun)
})
