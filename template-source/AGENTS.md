# Project instructions

- Use Bun for installs, scripts, tests, and the production server.
- Run `bun run check`, `bun run build`, `bun run test`, and `bun run doctor` before finishing work.
- Use Ultracite for formatting and linting; do not add Prettier or ESLint unless explicitly requested.
- TanStack Start routes live in `src/routes`.
- Do not edit `src/routeTree.gen.ts`; TanStack Router generates it.
- Keep server-only code out of browser modules and keep browser-only APIs out of server code.
- Prefer the existing project conventions and the smallest change that solves the task.
