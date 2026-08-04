import { execFileSync } from 'node:child_process'
import { readFile, writeFile } from 'node:fs/promises'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const packagePath = join(root, 'package.json')
const changelogPath = join(root, 'CHANGELOG.md')
const packageJson = JSON.parse(await readFile(packagePath, 'utf8'))
const version = packageJson.version
const marker = '## [Unreleased]'
const versionHeading = `## [${version}]`

let previousTag
try {
  previousTag = execFileSync('git', ['describe', '--tags', '--abbrev=0'], {
    cwd: root,
    encoding: 'utf8',
  }).trim()
} catch {
  previousTag = undefined
}

const logArgs = ['log', '-n', '30', '--pretty=format:%s']
if (previousTag) {
  logArgs.push(`${previousTag}..HEAD`)
}

const commits = execFileSync('git', logArgs, {
  cwd: root,
  encoding: 'utf8',
})
  .split('\n')
  .map((commit) => commit.trim())
  .filter(Boolean)
  .map((commit) => `- ${commit}`)

const changelog = await readFile(changelogPath, 'utf8')
if (!changelog.includes(marker)) {
  throw new Error(`Changelog is missing the ${marker} section.`)
}
if (changelog.includes(versionHeading)) {
  throw new Error(`Changelog already contains ${versionHeading}.`)
}

const entry = [
  versionHeading,
  `Date: ${new Date().toISOString().slice(0, 10)}`,
  '',
  ...(commits.length > 0 ? commits : ['- Maintenance updates.']),
  '',
].join('\n')

await writeFile(changelogPath, changelog.replace(marker, `${marker}\n\n${entry}`))
console.log(`Added changelog entry for ${version}.`)
