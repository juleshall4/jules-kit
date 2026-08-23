import { createRequire } from 'node:module'
import { readFile, writeFile } from 'node:fs/promises'
import { dirname, join, resolve } from 'node:path'
import { spawn } from 'node:child_process'
import { fileURLToPath } from 'node:url'

const require = createRequire(import.meta.url)
const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const source = join(root, 'template-source')
const sourceManifest = join(source, 'template.json')
const starterManifest = join(source, 'starter.json')
const bundledManifest = join(root, 'templates', 'template.json')

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

function resolveTanStackCliBin() {
  const packageJsonPath = require.resolve('@tanstack/cli/package.json')
  const packageJson = require(packageJsonPath)
  const bin = typeof packageJson.bin === 'string' ? packageJson.bin : packageJson.bin.tanstack

  if (!bin) {
    throw new Error('Could not resolve the TanStack CLI executable.')
  }

  return resolve(dirname(packageJsonPath), bin)
}

async function normalizeManifest(path) {
  const manifest = JSON.parse(await readFile(path, 'utf8'))
  if (!manifest.files) {
    throw new Error(`Template manifest has no files: ${path}`)
  }

  delete manifest.files['./template-info.json']
  delete manifest.files['./template.json']
  await writeFile(path, `${JSON.stringify(manifest, null, 2)}\n`)
}

await run('bun', ['install', '--frozen-lockfile'], source, {
  ...process.env,
  LEFTHOOK: '0',
})
await run('bun', ['run', 'fix'], source)
await run(process.execPath, [resolveTanStackCliBin(), 'template', 'init'], source)
await run('bun', ['run', 'fix'], source)
await normalizeManifest(sourceManifest)
await normalizeManifest(starterManifest)
await run('bun', ['run', 'fix'], source)
await writeFile(bundledManifest, await readFile(sourceManifest))

console.log(`Bundled template written to ${bundledManifest}`)
