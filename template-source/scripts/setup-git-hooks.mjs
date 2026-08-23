import { execFileSync } from 'node:child_process'
import { resolve } from 'node:path'

let repositoryRoot

try {
  repositoryRoot = execFileSync('git', ['rev-parse', '--show-toplevel'], {
    encoding: 'utf8',
  }).trim()
} catch {
  process.exit(0)
}

if (resolve(repositoryRoot) !== resolve(process.cwd())) {
  process.exit(0)
}

execFileSync('lefthook', ['install', '--reset-hooks-path'], {
  stdio: 'inherit',
})
