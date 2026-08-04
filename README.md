# create-jules-kit

Create a Bun-first TanStack Start application with Ultracite, React Doctor,
tests, and a repeatable `AGENTS.md`.

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

The generator creates a new directory, initializes Git, and does not create an
initial commit.

```text
create-jules-kit <project-name>
create-jules-kit <project-name> --target-dir <path>
create-jules-kit <project-name> --no-install
```

The CLI requires Node 20+, Bun, and Git. Existing target directories are
rejected.
