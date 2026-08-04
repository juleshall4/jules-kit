import { describe, expect, test } from 'bun:test'
import { existsSync } from 'node:fs'
import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import {
  buildGitHubCreateArgs,
  buildInitialCommitCommands,
  buildScaffoldArgs,
  buildValidationCommands,
  ensureTargetDoesNotExist,
  hasGitHubWorkflowScope,
  isVersionAtLeast,
  parseCliArgs,
  replaceProjectName,
  resolveTarget,
  validateProjectName,
} from './cli.ts'

describe('CLI arguments', () => {
  test('parses the documented options', () => {
    expect(
      parseCliArgs(['my-app', '--target-dir', './apps/my-app', '--no-install', '--dry-run']),
    ).toEqual({
      projectName: 'my-app',
      targetDir: './apps/my-app',
      noInstall: true,
      dryRun: true,
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

  test('checks minimum Bun versions', () => {
    expect(isVersionAtLeast('1.2.20', '1.2.20')).toBe(true)
    expect(isVersionAtLeast('1.3.0', '1.2.20')).toBe(true)
    expect(isVersionAtLeast('1.2.19', '1.2.20')).toBe(false)
  })

  test('checks the GitHub workflow token scope', () => {
    expect(hasGitHubWorkflowScope('X-OAuth-Scopes: gist, repo, workflow')).toBe(true)
    expect(hasGitHubWorkflowScope('X-OAuth-Scopes: gist, repo')).toBe(false)
    expect(hasGitHubWorkflowScope('HTTP/2.0 200 OK')).toBe(true)
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
      await rm(existing, { force: true, recursive: true })
    }
  })

  test('does not create a parent directory during a dry run', async () => {
    const existing = await mkdtemp(join(tmpdir(), 'create-jules-kit-'))
    const target = join(existing, 'nested', 'my-app')

    try {
      await ensureTargetDoesNotExist(target, false)
      expect(existsSync(join(existing, 'nested'))).toBe(false)
    } finally {
      await rm(existing, { force: true, recursive: true })
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
      ['test', 'bun', ['run', 'test']],
      ['doctor', 'bun', ['run', 'doctor']],
      ['build', 'bun', ['run', 'build']],
    ])
  })

  test('builds the one-commit GitHub publish sequence', () => {
    expect(buildInitialCommitCommands()).toEqual([
      ['git', ['branch', '-M', 'main']],
      ['git', ['add', '--all']],
      ['git', ['commit', '--message', 'chore: initial project scaffold']],
    ])
    expect(buildGitHubCreateArgs('my-app')).toEqual([
      'repo',
      'create',
      'my-app',
      '--public',
      '--source',
      '.',
      '--remote',
      'origin',
      '--push',
    ])
  })

  test('reports unknown options', () => {
    expect(() => parseCliArgs(['my-app', '--unknown'])).toThrow()
  })
})
