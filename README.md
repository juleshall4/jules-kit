# create-jules-kit

Generate personal, opinionated TanStack Start setup with Bun, Tailwind CSS,
shadcn/ui, and quality checks.

## Usage

Requires Node.js 20+, Bun 1.2.20+, Git, and an authenticated GitHub CLI.

Authenticate GitHub once before using the generator:

```bash
gh auth login
gh auth refresh -h github.com -s workflow
```

The `workflow` scope is required because each generated project includes the
React Doctor GitHub Actions workflow.

```bash
# From this repository
bun install
bun run build
npm link

# From the directory where you want the new app
create-jules-kit my-app
cd my-app
bun run dev
```

This uses the local CLI; no npm publish is required. The target folder is
created first, then the CLI initializes Git, installs dependencies, runs the
checks, creates one commit on `main`, creates a public GitHub repository, and
pushes it to `origin`.

If the GitHub repository already exists or publishing fails, the local project
is kept in place for inspection.

This is a personal setup of the tools I like to use and the conventions I like
to start projects with. It is intentionally opinionated rather than a neutral
starter for everyone.

## What it installs

- React 19 and TypeScript
- TanStack Start and TanStack Router
- Vite and Nitro with the Bun preset
- Tailwind CSS 4 and shadcn/ui
- Bun's test runner
- Ultracite, Biome, and React Doctor
- React Doctor GitHub Actions workflow for pull requests and Lefthook commit and push checks
- A starter shadcn button, with its class and icon helpers used in the home route
- Pinned dependencies and a Bun lockfile

## Options

```text
create-jules-kit <project-name> [--target-dir <path>]
                             [--no-install] [--dry-run]
create-jules-kit --help | --version
```

Existing target directories are rejected. Project names use lowercase letters,
numbers, and hyphens. The GitHub repository uses the same name as the project.

## Development

```bash
bun install
bun run check && bun run test && bun run build
bun run test:scaffold
```

After editing `template-source`, run `bun run template:build`.
