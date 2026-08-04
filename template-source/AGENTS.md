# PROJECT_NAME

A Bun-first TanStack Start application with Tailwind CSS, shadcn/ui, tests, and
quality checks.

## Tech stack

- React 19 and TypeScript
- TanStack Start and TanStack Router
- Tailwind CSS 4 and shadcn/ui
- Vite and Bun's test runner
- Biome and Ultracite

## Commands

- `bun run dev` — run the app
- `bun run build` — build the app
- `bun run start` — run the production build
- `bun run test` — run tests
- `bun run check` — check formatting and code quality
- `bun run fix` — fix formatting and code quality
- `bun run doctor` — run React Doctor

## Rules

- For any file search or grep in the current git-indexed directory, use fff tools.
- Prefer the simplest clean implementation that can be extended later.
- Keep each component in its own clean, segregated file.
- Always refer to me as King Julian.
- Avoid comments unless they are necessary.
- Use Context7 MCP when available and current library documentation is needed.
- Use Bun for installs, scripts, tests, and the production server.
- Use Tailwind utility classes for styling and keep shadcn/ui components in `src/components/ui`.
- Keep TanStack Start routes in `src/routes`.
- Do not edit `src/routeTree.gen.ts`; TanStack Router generates it.
- Run `bun run fix`, `bun run check`, `bun run test`, `bun run doctor`, and `bun run build` before finishing work.
- Explain plans, results, and model/system behaviour in simple, direct terms by default:
  - say what the thing does
  - say why it matters
  - use tiny concrete examples or pseudo-flow
  - clearly separate what is happening now from what we should try next
  - avoid dense jargon unless it is immediately explained
