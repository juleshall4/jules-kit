import { expect, test } from 'bun:test'

test('Bun test runner is available', () => {
  expect(process.versions.bun).toBeDefined()
})
