# PROJECT_NAME

A Bun-first TanStack Start app with Tailwind CSS, shadcn/ui, tests, and quality
checks.

## Start here

```bash
bun run dev
```

Edit `src/routes/index.tsx` to build the home page. Add routes under
`src/routes`; TanStack Router keeps `src/routeTree.gen.ts` up to date.

## Commands

```bash
bun run check
bun run fix
bun run test
bun run doctor
bun run build
bun run start
```

## UI

Tailwind CSS is wired through Vite. shadcn/ui is configured in
`components.json`; the starter includes a button under
`src/components/ui`. Add more components there and use `src/lib/utils.ts` for
class merging.

```bash
bunx --bun shadcn@4.16.0 add card
bun run fix
```

## CI

React Doctor runs automatically on pull requests through
`.github/workflows/react-doctor.yml`.
