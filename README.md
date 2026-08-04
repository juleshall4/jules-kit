# create-jules-kit

Generate my personal, opinionated TanStack Start setup with Bun, Tailwind CSS,
shadcn/ui, and quality checks.

## Usage

Requires Node.js 20+, Bun 1.2.20+, and Git.

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
created first, then the CLI initializes Git, installs dependencies, and runs the
checks. It does not create an initial commit.

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
- shadcn helpers: `clsx`, `tailwind-merge`, `class-variance-authority`, and Lucide
- Pinned dependencies and a Bun lockfile

It also adds a repeatable `AGENTS.md` structured as:

- repository name and short description
- tech stack
- useful commands
- personal rules for searching, file structure, comments, documentation, Bun,
  and finishing checks

## Options

```text
create-jules-kit <project-name> [--target-dir <path>]
                             [--no-install] [--dry-run]
create-jules-kit --help | --version
```

Existing target directories are rejected. Project names use lowercase letters,
numbers, and hyphens.

## Development

```bash
bun install
bun run check && bun run test && bun run build
bun run test:scaffold
```

After editing `template-source`, run `bun run template:build`.
