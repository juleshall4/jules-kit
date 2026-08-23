import { spawn } from 'node:child_process'

const child = spawn(process.execPath, ['run', 'doctor'], {
  env: process.env,
  stdio: 'inherit',
})

child.on('error', (error) => {
  console.error(error.message)
  process.exitCode = 1
})

child.on('close', (code, signal) => {
  process.exitCode = signal ? 1 : (code ?? 1)
})
