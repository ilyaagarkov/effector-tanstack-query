# CSR examples — effector-tanstack-query

Vite + React app demonstrating common usage patterns.

```bash
pnpm install
pnpm --filter @effector-tanstack-query/example-csr msw:init   # one-time
pnpm --filter @effector-tanstack-query/example-csr dev
```

Open http://localhost:5173.

## What's inside

- **Basic query** — `createQuery` + `useQuery`.
- **Reactive key (pagination)** — `Store` inside `queryKey`.
- **Dependent queries** — `enabled: otherQuery.$isSuccess` + derived key.
- **placeholderData** — `keepPreviousData` + `$isPlaceholderData`.
- **Polling** — `refetchInterval` driven by a `Store`.
- **Infinite query** — `createInfiniteQuery` + `fetchNextPage`.
- **Suspense** — `useSuspenseQuery` with `<ErrorBoundary>`.
- **Mutation + invalidate** — `attach({ source: $queryClient })` for fork-safe invalidation.
- **Optimistic update** — optimistic state in an effector `Store` (no cache surgery, no `onMutate` rollback gymnastics).
- **mutateWith** — per-call callbacks for component-local reactions.

## API

- **PokéAPI** (`pokeapi.co`) — read-only, no auth.
- **MSW** intercepts `/api/favorites` for the mutation examples.

The mock POST handler rejects ~20% of calls — useful to see how `$error`
and the optimistic-update rollback behave.
