# create-jules-kit

Create a Bun-first TanStack Start application with Tailwind CSS, shadcn/ui,
Ultracite, React Doctor, tests, and a repeatable `AGENTS.md`.

```bash
bunx create-jules-kit my-app
cd my-app
bun run dev
```

The generated app also provides:

```bash
bun run check
bun run fix
bun run test
bun run doctor
bun run build
bun run start
```

The generated app includes Tailwind CSS through Vite and a shadcn/ui
`components.json` setup with the `cn` helper in `src/lib/utils.ts`.

This v1 intentionally uses Bun's test runner for `bun run test`; Vitest is not
installed.

The generator creates a new directory, initializes Git, and does not create an
initial commit.

```text
create-jules-kit <project-name>
create-jules-kit <project-name> --target-dir <path>
create-jules-kit <project-name> --no-install
create-jules-kit <project-name> --dry-run
```

The CLI requires Node 20+, Bun 1.2.20+, and Git. Existing target directories
are rejected. `--dry-run` prints the planned scaffold without creating files.

When editing `template-source`, run `bun run template:build` to regenerate the
bundled template manifest before building or publishing.

## Release

Run the manual `Release` workflow from GitHub Actions and choose `patch`,
`minor`, or `major`. It runs the full checks, bumps the version, generates a
changelog entry, publishes the package, then commits and tags the release.

Configure npm Trusted Publishing for this repository and the
`.github/workflows/release.yml` workflow before using it:
[npm Trusted Publishing](https://docs.npmjs.com/trusted-publishers/).
