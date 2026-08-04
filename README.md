# create-jules-kit

Generate a ready-to-run TanStack Start app with Bun, Tailwind CSS, shadcn/ui,
and quality checks.

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

Generated projects include React 19, TypeScript, TanStack Start, TanStack
Router, Vite, Tailwind CSS 4, shadcn/ui, Nitro's Bun preset, Ultracite, Biome,
Bun tests, React Doctor, a Bun lockfile, and `AGENTS.md`.

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
