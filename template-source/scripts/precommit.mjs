import { spawn } from 'node:child_process'
import { stripVTControlCharacters } from 'node:util'

const checks = [
  {
    args: ['run', 'check'],
    command: 'bun',
    name: 'Ultracite',
  },
  {
    args: ['run', 'check:react'],
    command: 'bun',
    name: 'React Doctor',
  },
]

const run = (command, args) =>
  new Promise((resolve) => {
    const child = spawn(command, args, {
      env: process.env,
      stdio: ['inherit', 'pipe', 'pipe'],
    })
    let output = ''

    child.stdout.on('data', (chunk) => {
      process.stdout.write(chunk)
      output += chunk
    })
    child.stderr.on('data', (chunk) => {
      process.stderr.write(chunk)
      output += chunk
    })
    child.on('error', (error) => {
      output += `\n${error.message}\n`
      resolve({ code: 1, output })
    })
    child.on('close', (code) => {
      resolve({ code: code ?? 1, output })
    })
  })

const clipboardCommands = {
  darwin: [['pbcopy', []]],
  linux: [
    ['wl-copy', []],
    ['xclip', ['-selection', 'clipboard']],
  ],
  win32: [['clip', []]],
}

const copyToClipboard = async (
  value,
  commands = clipboardCommands[process.platform] ?? [],
) => {
  const [commandAndArgs, ...remainingCommands] = commands

  if (!commandAndArgs) {
    return false
  }

  const [command, args] = commandAndArgs
  const copied = await new Promise((resolve) => {
    const child = spawn(command, args, {
      stdio: ['pipe', 'ignore', 'ignore'],
    })
    child.on('error', () => resolve(false))
    child.on('close', (code) => resolve(code === 0))
    child.stdin.end(value)
  })

  return copied || copyToClipboard(value, remainingCommands)
}

const formatCommand = ({ args, command }) =>
  [command, ...args].map((part) => JSON.stringify(part)).join(' ')

const buildPrompt = (
  check,
  output,
) => `The pre-commit check "${check.name}" failed.

Please diagnose and fix the failure without weakening or bypassing the check. Preserve the intended behaviour, run the same command after fixing, and report what changed.

Command:
${formatCommand(check)}

Output:
\`\`\`
${stripVTControlCharacters(output).trim()}
\`\`\`
`

const runChecks = async ([check, ...remainingChecks]) => {
  if (!check) {
    return
  }

  const result = await run(check.command, check.args)
  if (result.code === 0) {
    await runChecks(remainingChecks)
    return
  }

  const prompt = buildPrompt(check, result.output)
  if (await copyToClipboard(prompt)) {
    console.error('\nA diagnostic prompt was copied to your clipboard.')
  } else {
    console.error(`\nCould not copy the diagnostic prompt:\n\n${prompt}`)
  }
  process.exit(result.code)
}

await runChecks(checks)
