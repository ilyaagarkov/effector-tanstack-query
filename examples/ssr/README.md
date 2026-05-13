# SSR example — effector-tanstack-query

Next.js App Router app demonstrating per-request scope isolation:

- Server renders the page with a **fresh QueryClient + effector scope per
  request** (`fork({ values: [[$queryClient, qc]] })`).
- Both layers are serialized to the client (`dehydrate(qc)` for the cache,
  `serialize(scope)` for the effector stores).
- Client reconstructs both atomically — first paint already has data,
  reactive interactions then drive the client-side QueryClient.

```bash
pnpm install
pnpm --filter @effector-tanstack-query/example-ssr build
pnpm --filter @effector-tanstack-query/example-ssr start
```

Or for dev:

```bash
pnpm --filter @effector-tanstack-query/example-ssr dev
```

Open http://localhost:3000. View source — the initial HTML already
contains the rendered list / pokemon data. Open DevTools → Network on
first reload: no client-side fetch to PokéAPI.

## Files of interest

- `src/lib/server.ts` — `makeRequestScope()` + `prefetch()`. Runs only on
  the server side.
- `src/lib/hydration-provider.tsx` — client component that re-builds the
  scope from the SSR payload using `fork({ values })`.
- `src/model/queries.ts` — the queries themselves. Identical to client-
  only usage — no SSR-specific code in the model.
- `app/page.tsx` — server component: prefetches and serializes.
- `app/page.client.tsx` — client component: subscribes via `useQuery`,
  responds to user interactions.

## Why no `queryClient.mount()` on the server

`mount()` registers focus / online event listeners on the global `window`.
The server has no window — calling it would either no-op or throw. We
mount the client-side `QueryClient` inside `HydrationProvider` instead.
