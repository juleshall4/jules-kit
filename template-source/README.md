# PROJECT_NAME

A minimal Bun-first TanStack Start app with Tailwind CSS, shadcn/ui, Ultracite,
Bun tests, and React Doctor.

```bash
bun install
bun run dev
```

Edit `src/routes/index.tsx` to get started. Add route files under `src/routes`;
TanStack Router updates `src/routeTree.gen.ts` for you.

Tailwind is configured through Vite. shadcn/ui is configured through
`components.json`; add editable components under `src/components/ui` and use
`src/lib/utils.ts` for class merging. Use a pinned shadcn CLI version to add
components, then run `bun run fix`.

Useful checks:

```bash
bun run check
bun run fix
bun run test
bun run doctor
bun run build
```
