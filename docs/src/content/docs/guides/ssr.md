---
title: SSR
description: Round-trip queries across server and client via dehydrate/hydrate plus serialize/fork.
---

SSR works by transferring **two** layers of state from server to client:

1. **`QueryClient` cache** — handled by `dehydrate(queryClient)` / `hydrate(queryClient, ...)` from `@tanstack/query-core`.
2. **Effector scope** — handled by `serialize(scope)` / `fork({ values })` from effector.

You need both for a clean hydration with no flash and no extra refetch.

## Server

```ts
import { QueryClient, dehydrate } from '@tanstack/query-core'
import { fork, allSettled, serialize } from 'effector'

export async function renderPage() {
  const queryClient = new QueryClient()
  queryClient.mount()

  const scope = fork()

  // Mount queries — fetches happen in this scope
  await allSettled(userQuery.mounted, { scope })
  // ...wait for everything you want to ship

  // Serialize both layers
  const dehydratedQc = dehydrate(queryClient)
  const serializedScope = serialize(scope)

  // Inject into HTML, e.g.:
  const html = `
    <div id="root">${renderToString(...)}</div>
    <script>window.__QC__ = ${JSON.stringify(dehydratedQc)};</script>
    <script>window.__SCOPE__ = ${JSON.stringify(serializedScope)};</script>
  `
  return html
}
```

## Client

```ts
import { QueryClient, hydrate } from '@tanstack/query-core'
import { fork, allSettled } from 'effector'

const queryClient = new QueryClient()
queryClient.mount()
hydrate(queryClient, window.__QC__)

const scope = fork({ values: window.__SCOPE__ })

// Mount the query in the hydrated scope —
// observer reads from cache, no refetch when staleTime keeps it fresh
await allSettled(userQuery.mounted, { scope })

// Render React tree with <Provider value={scope}>...
```

## Why both layers

If you only do `dehydrate(queryClient)` + `hydrate(queryClient, ...)`:
- ✅ Future refetches and invalidations work correctly.
- ❌ But on the very first render the effector stores in the new scope are still empty (until `mounted()` propagates a fresh result via the observer subscription) — causes a flash.

If you only do `serialize(scope)` + `fork({ values })`:
- ✅ React render hydrates with no flash.
- ❌ But the queryClient cache is empty, so any subsequent fetch / invalidate behaves like a fresh load.

Together they're equivalent to react-query's `<HydrationBoundary>`.

## You must pass `name`

Effector stores serialize via **stable IDs** (SIDs). Without a `name` on `createQuery` / `createMutation` / `createInfiniteQuery`, the internal stores have no SID and are silently dropped from `serialize(scope)` — your client-side scope receives nothing.

```ts
const userQuery = createQuery(queryClient, {
  name: 'user', // ← required for SSR-via-scope
  queryKey: ['user', $userId],
  queryFn: fetchUser,
})
```

A development warning fires the first time you create a query without a `name`. See [Naming & SIDs](/effector-tanstack-query/guides/naming-and-sids/) for the full story.

## staleTime considerations

If `staleTime: 0` (the default), the observer on the client refetches immediately after hydration even with cached data. To use the SSR-shipped data without an immediate refetch:

```ts
createQuery(queryClient, {
  name: 'user',
  queryKey: ['user'],
  queryFn: fetchUser,
  staleTime: 60_000, // or Infinity, or whatever your server-side data freshness allows
})
```
