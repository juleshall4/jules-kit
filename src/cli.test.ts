import { describe, expect, test } from 'bun:test'
import { mkdtemp, rmdir } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import {
  buildScaffoldArgs,
  buildValidationCommands,
  ensureTargetDoesNotExist,
  parseCliArgs,
  replaceProjectName,
  resolveTarget,
  validateProjectName,
} from './cli.ts'

describe('CLI arguments', () => {
  test('parses the documented options', () => {
    expect(parseCliArgs(['my-app', '--target-dir', './apps/my-app', '--no-install'])).toEqual({
      projectName: 'my-app',
      targetDir: './apps/my-app',
      noInstall: true,
      help: false,
      version: false,
    })
  })

  test('rejects multiple project names', () => {
    expect(() => parseCliArgs(['one', 'two'])).toThrow('Only one project name is allowed.')
  })

  test('rejects unsafe project names', () => {
    expect(() => validateProjectName('../app')).toThrow()
  })

  test('replaces the generated project name heading', () => {
    expect(replaceProjectName('# PROJECT_NAME\n', 'my-app')).toBe('# my-app\n')
  })

  test('resolves the default target from the working directory', () => {
    expect(resolveTarget(parseCliArgs(['my-app']), '/tmp')).toBe('/tmp/my-app')
  })

  test('rejects an existing target directory', async () => {
    const existing = await mkdtemp(join(tmpdir(), 'create-jules-kit-'))

    try {
      await expect(ensureTargetDoesNotExist(existing)).rejects.toThrow(
        'Target already exists',
      )
    } finally {
      await rmdir(existing)
    }
  })

  test('builds the pinned scaffold command arguments', () => {
    expect(buildScaffoldArgs('my-app', '/tmp/my-app')).toEqual([
      'create',
      'my-app',
      '--template',
      expect.stringContaining('/templates/template.json'),
      '--no-examples',
      '--no-intent',
      '--package-manager',
      'bun',
      '--no-install',
      '--no-git',
      '--yes',
      '--target-dir',
      '/tmp/my-app',
    ])
  })

  test('builds the validation command sequence', () => {
    expect(buildValidationCommands()).toEqual([
      ['check', 'bun', ['run', 'check']],
      ['build', 'bun', ['run', 'build']],
      ['test', 'bun', ['run', 'test']],
      ['doctor', 'bun', ['run', 'doctor']],
    ])
  })

  test('reports unknown options', () => {
    expect(() => parseCliArgs(['my-app', '--unknown'])).toThrow()
  })
})
