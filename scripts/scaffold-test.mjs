import { createServer } from 'node:net'
import { existsSync } from 'node:fs'
import { execFile, spawn } from 'node:child_process'
import { chmod, mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import { once } from 'node:events'
import { dirname, join, resolve } from 'node:path'
import { promisify } from 'node:util'
import { tmpdir } from 'node:os'
import { fileURLToPath } from 'node:url'

const execFileAsync = promisify(execFile)
const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const cliPath = join(root, 'dist', 'cli.js')

function assert(condition, message) {
  if (!condition) {
    throw new Error(message)
  }
}

function run(command, args, cwd, env = process.env) {
  return new Promise((resolvePromise, reject) => {
    const child = spawn(command, args, {
      cwd,
      env,
      shell: false,
      stdio: 'inherit',
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

function delay(milliseconds) {
  return new Promise((resolvePromise) => setTimeout(resolvePromise, milliseconds))
}

async function getFreePort() {
  const server = createServer()
  await new Promise((resolvePromise, reject) => {
    server.once('error', reject)
    server.listen(0, '127.0.0.1', resolvePromise)
  })

  const address = server.address()
  assert(address && typeof address === 'object', 'Could not determine a free port.')
  const port = address.port
  await new Promise((resolvePromise, reject) => {
    server.close((error) => (error ? reject(error) : resolvePromise()))
  })
  return port
}

async function gitValue(target, args) {
  const result = await execFileAsync('git', ['-C', target, ...args])
  return result.stdout.trim()
}

async function waitForServer(child, url) {
  const deadline = Date.now() + 15_000
  let lastError = 'server did not respond'

  while (Date.now() < deadline) {
    if (child.exitCode !== null) {
      throw new Error(`Production server exited with code ${child.exitCode}.`)
    }

    try {
      const response = await fetch(url)
      if (response.ok) {
        return response.text()
      }
      lastError = `HTTP ${response.status}`
    } catch (error) {
      lastError = error instanceof Error ? error.message : String(error)
    }

    await delay(250)
  }

  throw new Error(`Production server was not reachable: ${lastError}`)
}

async function stopServer(child) {
  if (child.exitCode !== null) {
    return
  }

  child.kill('SIGTERM')
  await Promise.race([once(child, 'exit'), delay(3_000)])
  if (child.exitCode === null) {
    child.kill('SIGKILL')
    await once(child, 'exit')
  }
}

async function verifyProductionStart(target) {
  const port = await getFreePort()
  const child = spawn('bun', ['run', 'start'], {
    cwd: target,
    env: { ...process.env, HOST: '127.0.0.1', PORT: String(port) },
    shell: false,
    stdio: 'ignore',
  })

  try {
    const html = await waitForServer(child, `http://127.0.0.1:${port}/`)
    assert(html.includes('Welcome to TanStack Start'), 'Production page did not render.')
  } finally {
    await stopServer(child)
  }
}

assert(existsSync(cliPath), 'dist/cli.js is missing; run bun run build first.')

const temporaryRoot = await mkdtemp(join(tmpdir(), 'create-jules-kit-e2e-'))
const target = join(temporaryRoot, 'e2e-app')
const fakeBin = join(temporaryRoot, 'bin')
const ghStubPath = join(fakeBin, 'gh')
const ghLogPath = join(temporaryRoot, 'gh-args.jsonl')

await mkdir(fakeBin)
await writeFile(
  ghStubPath,
  `#!/usr/bin/env node
import { appendFileSync } from 'node:fs'
import { execFileSync } from 'node:child_process'

const args = process.argv.slice(2)

if (args[0] === '--version') {
  console.log('gh version 2.0.0')
  process.exit(0)
}

if (args[0] === 'auth' && args[1] === 'status') {
  process.exit(0)
}

if (args[0] === 'repo' && args[1] === 'create') {
  appendFileSync(process.env.GH_STUB_LOG, JSON.stringify(args) + '\\n')
  execFileSync('git', ['remote', 'add', 'origin', 'https://github.com/example/e2e-app.git'])
  process.exit(0)
}

console.error('Unexpected gh command: ' + args.join(' '))
process.exit(1)
`,
)
await chmod(ghStubPath, 0o755)

const testEnvironment = {
  ...process.env,
  GH_STUB_LOG: ghLogPath,
  PATH: `${fakeBin}:${process.env.PATH ?? ''}`,
}

try {
  await run(
    process.execPath,
    [cliPath, 'e2e-app', '--target-dir', target],
    root,
    testEnvironment,
  )

  const packageJson = JSON.parse(await readFile(join(target, 'package.json'), 'utf8'))
  const agents = await readFile(join(target, 'AGENTS.md'), 'utf8')

  assert(packageJson.name === 'e2e-app', 'Generated package name is incorrect.')
  assert(packageJson.scripts.test === 'bun test', 'Generated test script is incorrect.')
  assert(packageJson.dependencies.tailwindcss === '4.1.18', 'Tailwind is not pinned.')
  assert(agents.startsWith('# e2e-app\n'), 'Generated AGENTS.md name is incorrect.')
  assert(existsSync(join(target, '.git')), 'Git repository was not initialized.')
  assert(existsSync(join(target, 'bun.lock')), 'Bun lockfile is missing.')
  assert(existsSync(join(target, 'components.json')), 'shadcn config is missing.')
  assert(existsSync(join(target, 'src', 'lib', 'utils.ts')), 'shadcn utility is missing.')
  assert(existsSync(join(target, 'src', 'components', 'ui', 'button.tsx')), 'shadcn button is missing.')
  assert(
    (await gitValue(target, ['rev-list', '--count', 'HEAD'])) === '1',
    'Generated Git repository should have one commit.',
  )
  assert(
    (await gitValue(target, ['log', '-1', '--format=%s'])) ===
      'chore: initial project scaffold',
    'Initial commit message is incorrect.',
  )
  assert(
    (await gitValue(target, ['branch', '--show-current'])) === 'main',
    'Generated Git repository should use main.',
  )
  assert(
    (await gitValue(target, ['remote', 'get-url', 'origin'])) ===
      'https://github.com/example/e2e-app.git',
    'GitHub origin was not configured.',
  )

  const ghArgs = JSON.parse((await readFile(ghLogPath, 'utf8')).trim())
  for (const argument of [
    'repo',
    'create',
    'e2e-app',
    '--public',
    '--source',
    '.',
    '--remote',
    'origin',
    '--push',
  ]) {
    assert(ghArgs.includes(argument), `GitHub publish command is missing ${argument}.`)
  }

  await verifyProductionStart(target)
  console.log('Scaffold E2E passed.')
} finally {
  await rm(temporaryRoot, { force: true, recursive: true })
}
