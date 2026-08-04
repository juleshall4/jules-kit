import { createServer } from 'node:net'
import { existsSync } from 'node:fs'
import { execFile, spawn } from 'node:child_process'
import { mkdtemp, readFile, rm } from 'node:fs/promises'
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

function run(command, args, cwd) {
  return new Promise((resolvePromise, reject) => {
    const child = spawn(command, args, {
      cwd,
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

async function hasInitialCommit(target) {
  try {
    await execFileAsync('git', ['-C', target, 'rev-parse', '--verify', 'HEAD'])
    return true
  } catch {
    return false
  }
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

try {
  await run(process.execPath, [cliPath, 'e2e-app', '--target-dir', target], root)

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
  assert(!(await hasInitialCommit(target)), 'Generated Git repository has an initial commit.')

  await verifyProductionStart(target)
  console.log('Scaffold E2E passed.')
} finally {
  await rm(temporaryRoot, { force: true, recursive: true })
}
