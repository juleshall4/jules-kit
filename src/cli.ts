#!/usr/bin/env node

import { createRequire } from 'node:module'
import { existsSync } from 'node:fs'
import { mkdir, readFile, rm, writeFile } from 'node:fs/promises'
import { dirname, join, resolve } from 'node:path'
import { spawn, execFile } from 'node:child_process'
import { promisify } from 'node:util'
import { parseArgs } from 'node:util'
import { fileURLToPath } from 'node:url'

const execFileAsync = promisify(execFile)
const require = createRequire(import.meta.url)

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const templatePath = join(root, 'templates', 'template.json')
const packagePatchPath = join(root, 'templates', 'project-package.json')

export type CliOptions = {
  projectName?: string
  targetDir?: string
  noInstall: boolean
  help: boolean
  version: boolean
}

export function usage(): string {
  return `Usage: create-jules-kit <project-name> [options]

Options:
  --target-dir <path>  Create the project at a specific path
  --no-install         Skip dependency installation and validation
  -h, --help           Show this help
  -v, --version        Show the package version`
}

export function parseCliArgs(args: string[]): CliOptions {
  const { values, positionals } = parseArgs({
    args,
    allowPositionals: true,
    strict: true,
    options: {
      'target-dir': { type: 'string' },
      'no-install': { type: 'boolean' },
      help: { type: 'boolean', short: 'h' },
      version: { type: 'boolean', short: 'v' },
    },
  })

  if (positionals.length > 1) {
    throw new Error('Only one project name is allowed.')
  }

  return {
    projectName: positionals[0],
    targetDir: values['target-dir'],
    noInstall: values['no-install'] ?? false,
    help: values.help ?? false,
    version: values.version ?? false,
  }
}

export function validateProjectName(projectName: string): void {
  if (!/^[a-z][a-z0-9-]*$/.test(projectName)) {
    throw new Error(
      'Project name must start with a lowercase letter and contain only lowercase letters, numbers, and hyphens.',
    )
  }
}

export function replaceProjectName(content: string, projectName: string): string {
  return content.replace(/^# PROJECT_NAME$/m, `# ${projectName}`)
}

export function resolveTarget(options: CliOptions, cwd = process.cwd()): string {
  if (!options.projectName) {
    throw new Error('A project name is required.')
  }

  validateProjectName(options.projectName)

  return resolve(
    cwd,
    options.targetDir ?? options.projectName,
  )
}

export function buildScaffoldArgs(
  projectName: string,
  target: string,
): readonly string[] {
  return [
    'create',
    projectName,
    '--template',
    templatePath,
    '--no-examples',
    '--no-intent',
    '--package-manager',
    'bun',
    '--no-install',
    '--no-git',
    '--yes',
    '--target-dir',
    target,
  ]
}

export function buildValidationCommands(): readonly (readonly [
  string,
  string,
  readonly string[],
])[] {
  return [
    ['check', 'bun', ['run', 'check']],
    ['build', 'bun', ['run', 'build']],
    ['test', 'bun', ['run', 'test']],
    ['doctor', 'bun', ['run', 'doctor']],
  ]
}

async function readJson<T>(path: string): Promise<T> {
  return JSON.parse(await readFile(path, 'utf8')) as T
}

async function writeJson(path: string, value: unknown): Promise<void> {
  await writeFile(path, `${JSON.stringify(value, null, 2)}\n`)
}

async function packageVersion(): Promise<string> {
  const packageJson = await readJson<{ version: string }>(join(root, 'package.json'))
  return packageJson.version
}

async function ensureCommand(command: string, args: string[]): Promise<string> {
  try {
    const result = await execFileAsync(command, args)
    return result.stdout.trim()
  } catch {
    throw new Error(`Required command not found or unusable: ${command}`)
  }
}

async function ensureEnvironment(): Promise<void> {
  const nodeMajor = Number.parseInt(process.versions.node.split('.')[0] ?? '0', 10)
  if (nodeMajor < 20) {
    throw new Error(`Node 20+ is required; found ${process.version}.`)
  }

  await ensureCommand('bun', ['--version'])
  await ensureCommand('git', ['--version'])
}

export async function ensureTargetDoesNotExist(target: string): Promise<void> {
  if (existsSync(target)) {
    throw new Error(`Target already exists; choose a new path: ${target}`)
  }

  await mkdir(dirname(target), { recursive: true })
}

function resolveTanStackCliBin(): string {
  const packageJsonPath = require.resolve('@tanstack/cli/package.json') as string
  const packageJson = require(packageJsonPath) as {
    bin: string | Record<string, string>
  }
  const bin = typeof packageJson.bin === 'string' ? packageJson.bin : packageJson.bin.tanstack

  if (!bin) {
    throw new Error('Could not resolve the TanStack CLI executable.')
  }

  return resolve(dirname(packageJsonPath), bin)
}

function run(command: string, args: readonly string[], cwd?: string): Promise<void> {
  return new Promise((resolvePromise, reject) => {
    const child = spawn(command, args, {
      cwd,
      stdio: 'inherit',
      shell: false,
    })

    child.on('error', reject)
    child.on('close', (code) => {
      if (code === 0) {
        resolvePromise()
      } else {
        reject(new Error(`${command} exited with code ${code ?? 'unknown'}.`))
      }
    })
  })
}

async function scaffold(target: string, projectName: string): Promise<void> {
  await run(process.execPath, [resolveTanStackCliBin(), ...buildScaffoldArgs(projectName, target)])
}

type PackagePatch = {
  dependencies: Record<string, string>
  devDependencies: Record<string, string>
  scripts: Record<string, string>
}

async function configureProject(target: string, projectName: string): Promise<void> {
  const packageJsonPath = join(target, 'package.json')
  const packageJson = await readJson<Record<string, unknown>>(packageJsonPath)
  const patch = await readJson<PackagePatch>(packagePatchPath)

  packageJson.name = projectName
  packageJson.private = true
  packageJson.packageManager = 'bun@1.2.20'
  packageJson.dependencies = patch.dependencies
  packageJson.devDependencies = patch.devDependencies
  packageJson.scripts = patch.scripts
  delete packageJson.pnpm

  await writeJson(packageJsonPath, packageJson)

  const tsconfigPath = join(target, 'tsconfig.json')
  const tsconfig = await readFile(tsconfigPath, 'utf8')
  if (!/"types"\s*:\s*\[[^\]]*\]/.test(tsconfig)) {
    throw new Error('Generated tsconfig.json did not contain a types setting.')
  }
  const patchedTsconfig = tsconfig.replace(
    /"types"\s*:\s*\[[^\]]*\]/,
    '"types": ["vite/client", "bun-types"]',
  )
  await writeFile(tsconfigPath, patchedTsconfig)

  const readmePath = join(target, 'README.md')
  if (existsSync(readmePath)) {
    const readme = await readFile(readmePath, 'utf8')
    await writeFile(readmePath, replaceProjectName(readme, projectName))
  }

  const agentsPath = join(target, 'AGENTS.md')
  if (existsSync(agentsPath)) {
    const agents = await readFile(agentsPath, 'utf8')
    await writeFile(agentsPath, replaceProjectName(agents, projectName))
  }

  await Promise.all([
    rm(join(target, '.cta.json'), { force: true }),
    rm(join(target, 'template-info.json'), { force: true }),
    rm(join(target, 'template.json'), { force: true }),
  ])
}

async function initializeGit(target: string): Promise<void> {
  try {
    await run('git', ['init', target])
  } catch (error) {
    const reason = error instanceof Error ? ` ${error.message}` : ''
    throw new Error(
      `Git initialization failed for ${target}. Check that the directory is writable and Git is available.${reason}`,
    )
  }
}

async function runValidation(target: string): Promise<void> {
  for (const command of buildValidationCommands()) {
    const [name, executable, args] = command
    console.log(`\nRunning ${name}...`)
    await run(executable, args, target)
  }
}

export async function main(args = process.argv.slice(2)): Promise<void> {
  const options = parseCliArgs(args)

  if (options.help) {
    console.log(usage())
    return
  }

  if (options.version) {
    console.log(await packageVersion())
    return
  }

  const target = resolveTarget(options)
  const projectName = options.projectName as string

  await ensureEnvironment()
  await ensureTargetDoesNotExist(target)

  console.log(`Creating ${projectName} in ${target}...`)
  await scaffold(target, projectName)
  await configureProject(target, projectName)
  await initializeGit(target)

  if (!options.noInstall) {
    console.log('\nInstalling dependencies...')
    await run('bun', ['install'], target)
    await runValidation(target)
  }

  console.log(`\nCreated ${projectName}.`)
  console.log(`\n  cd ${target}`)
  console.log('  bun run dev')
}

const entrypoint = process.argv[1]
if (entrypoint && resolve(entrypoint) === fileURLToPath(import.meta.url)) {
  main().catch((error: unknown) => {
    console.error(`\nError: ${error instanceof Error ? error.message : String(error)}`)
    process.exitCode = 1
  })
}
