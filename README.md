# create-jules-kit

Generate a ready-to-run TanStack Start app with Bun, Tailwind CSS, shadcn/ui,
and built-in quality checks.

## Quick start

Requirements: Node.js 20+, Bun 1.2.20+, and Git.

```bash
bunx create-jules-kit my-app
cd my-app
bun run dev
```

The CLI creates `./my-app`, initializes Git, installs dependencies, and runs
the checks below. It does not create an initial commit.

## Generated app

Each project includes:

- React 19 and TypeScript
- TanStack Start with Vite
- Tailwind CSS 4 and shadcn/ui configuration
- Nitro's Bun preset for the production server
- Ultracite and Biome
- Bun's test runner
- React Doctor
- A pinned Bun lockfile
- A repeatable `AGENTS.md`

## Commands

```bash
bun run dev      # start the development server
bun run build    # create a production build
bun run start    # run the production build
bun run test     # run tests
bun run check    # run Ultracite and TypeScript checks
bun run fix      # fix formatting and code quality issues
bun run doctor   # run React Doctor
```

The production flow is:

```bash
bun run build
bun run start
```

The generated app uses Nitro's Bun output and does not include platform-specific
deployment configuration.

## CLI options

```text
create-jules-kit <project-name>
create-jules-kit <project-name> --target-dir <path>
create-jules-kit <project-name> --no-install
create-jules-kit <project-name> --dry-run
create-jules-kit --help
create-jules-kit --version
```

- `--target-dir <path>` creates the project at a specific path.
- `--no-install` skips dependency installation and validation.
- `--dry-run` prints the plan without creating files.

Project names must start with a lowercase letter and contain only lowercase
letters, numbers, and hyphens. Existing target directories are rejected.

## shadcn/ui

The generated project already includes `components.json` and the `cn` helper.
Add components with a pinned CLI version:

```bash
bunx --bun shadcn@4.16.0 add button
bun run fix
```

Components are added to `src/components/ui`.

## Developing the CLI

```bash
bun install
bun run check
bun run test
bun run build
bun run test:scaffold
npm pack --dry-run
```

The template source lives in `template-source`. After editing it, regenerate
the bundled template before building or publishing:

```bash
bun run template:build
```

CI checks that the generated template is reproducible and that a fresh project
can install, check, build, test, run React Doctor, and start its production
server.

## Releases

Releases are manual. Run the `Release` workflow in GitHub Actions, choose a
patch, minor, or major release, and configure [npm Trusted Publishing](https://docs.npmjs.com/trusted-publishers/)
for the workflow first.
