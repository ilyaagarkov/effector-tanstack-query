---
title: SSR
description: Round-trip queries across server and client via dehydrate/hydrate plus serialize/fork — with HydrationBoundary on the client.
---

SSR works by transferring **two** layers of state from server to client:

1. **`QueryClient` cache** — handled by `dehydrate(queryClient)` on the server, `<HydrationBoundary state={...}>` on the client.
2. **Effector scope** — handled by `serialize(scope)` on the server, `fork({ values })` (or `<EffectorNext values>` in Next.js) on the client.

You need both for a clean hydration with no flash and no extra refetch.

## Server

Create a fresh `QueryClient` **per request** and inject it through the `$queryClient` store via `fork({ values })`. Each request gets its own scope-isolated observer — nothing leaks between requests.

Use **`query.prefetch`**, not `query.mounted`, to fill the cache on the server. `prefetch` calls `queryClient.fetchQuery(...)` under the hood and **awaits** the result, so by the time `allSettled` resolves the cache has data. `mounted` only kicks off a background subscription via the observer — it returns before the fetch completes.

```ts
import { QueryClient, dehydrate } from '@tanstack/query-core'
import { fork, allSettled, serialize } from 'effector'
import { $queryClient } from '@effector-tanstack-query/core'

export async function renderPage() {
  const queryClient = new QueryClient()
  // queryClient.mount() is intentionally NOT called on the server.

  const scope = fork({ values: [[$queryClient, queryClient]] })

  // 1) Prefetch: awaits the queryFn → cache is populated.
  await allSettled(userQuery.prefetch, { scope })

  // 2) Mount: observer reads from the now-populated cache and dispatches
  //    the data into the effector stores ($data, $status, ...). No new
  //    fetch is issued because the cache is fresh.
  await allSettled(userQuery.mounted, { scope })

  // 3) Snapshot both layers and ship them to the client.
  return {
    dehydratedQueryClient: dehydrate(queryClient),
    serializedScope: serialize(scope),
  }
}
```

> No explicit `unmounted` after the response is built: the per-request `queryClient` and `scope` are local to the function, and the returned snapshots only carry plain serializable data — nothing keeps the live observers / subscriptions alive after the response is sent.

## Client

Wrap your tree in **two** providers — one per layer:

```tsx
import { Provider } from 'effector-react'
import { QueryClient } from '@tanstack/query-core'
import { fork } from 'effector'
import { HydrationBoundary } from '@effector-tanstack-query/react'
import { $queryClient } from '@effector-tanstack-query/core'

const queryClient = new QueryClient()
queryClient.mount()

const scope = fork({
  values: {
    ...serializedScope,                  // from server
    [$queryClient.sid!]: queryClient,    // inject the client into scope
  },
})

ReactDOM.hydrateRoot(
  document.getElementById('root'),
  <Provider value={scope}>
    <HydrationBoundary state={dehydratedQueryClient}>
      <App />
    </HydrationBoundary>
  </Provider>,
)
```

`<HydrationBoundary>` reads the QueryClient from the scope (`useUnit($queryClient)`) and calls `hydrate(qc, state)` inside `useMemo` — so by the time `<App />` renders, the cache is populated and observers find data instead of triggering fresh fetches. See [the API reference](/effector-tanstack-query/react/hydration-boundary/) for details.

## Next.js (App Router)

[`@effector/next`](https://github.com/effector/next) handles the singleton client scope across App Router navigations. Combine it with `<HydrationBoundary>` and you get a clean per-page hydration:

```tsx
// app/layout.tsx (server)
import { Providers } from '@/lib/providers'

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
```

```tsx
// src/lib/providers.tsx (client)
'use client'
import { allSettled } from 'effector'
import { EffectorNext, getClientScope } from '@effector/next'
import { QueryClient } from '@tanstack/query-core'
import { $queryClient, setQueryClient } from '@effector-tanstack-query/core'

// Top-level await: runs once per browser session, BEFORE any render.
// On the server, getClientScope() is null — the block is skipped.
if (typeof window !== 'undefined') {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { staleTime: 60_000 } },
  })
  queryClient.mount()
  setQueryClient(queryClient)
  await allSettled($queryClient, {
    params: queryClient,
    scope: getClientScope()!,
  })
}

export function Providers({ children }: { children: React.ReactNode }) {
  return <EffectorNext>{children}</EffectorNext>
}
```

```tsx
// app/page.tsx (server component)
import { allSettled, fork, serialize } from 'effector'
import { QueryClient, dehydrate } from '@tanstack/query-core'
import { $queryClient } from '@effector-tanstack-query/core'
import { PageHydration } from '@/lib/hydration-provider'
import { listQuery, pokemonQuery } from '@/model/queries'

export default async function Home() {
  const queryClient = new QueryClient()
  const scope = fork({ values: [[$queryClient, queryClient]] })

  await Promise.all([
    allSettled(listQuery.prefetch, { scope }),
    allSettled(pokemonQuery.prefetch, { scope }),
  ])
  await Promise.all([
    allSettled(listQuery.mounted, { scope }),
    allSettled(pokemonQuery.mounted, { scope }),
  ])

  return (
    <PageHydration
      dehydratedQueryClient={dehydrate(queryClient)}
      serializedScope={serialize(scope)}
    >
      <PageBody />
    </PageHydration>
  )
}
```

```tsx
// src/lib/hydration-provider.tsx (client)
'use client'
import { EffectorNext } from '@effector/next'
import { HydrationBoundary } from '@effector-tanstack-query/react'
import type { DehydratedState } from '@tanstack/query-core'

export function PageHydration({
  children,
  dehydratedQueryClient,
  serializedScope,
}: {
  children: React.ReactNode
  dehydratedQueryClient: DehydratedState
  serializedScope: Record<string, unknown>
}) {
  return (
    <HydrationBoundary state={dehydratedQueryClient}>
      <EffectorNext values={serializedScope}>{children}</EffectorNext>
    </HydrationBoundary>
  )
}
```

How the pieces fit:

- **Layout's `<EffectorNext>`** owns a singleton client scope, alive for the whole browser session.
- **Top-level `await allSettled($queryClient, ...)`** injects the singleton `QueryClient` into that scope once, before any render.
- **Per page, `<PageHydration>`** runs both hydration steps:
  - `<HydrationBoundary state={dehydratedQueryClient}>` merges the server's query cache into the singleton qc.
  - `<EffectorNext values={serializedScope}>` merges the server's effector store snapshots into the singleton scope.
- The singleton scope means navigating between routes preserves any client-side effector state (selected filters, accumulators, …); the singleton qc means the cache survives navigation and dedupes across pages.

A complete working example lives in [`examples/ssr`](https://github.com/ilyaagarkov/effector-tanstack-query/tree/master/examples/ssr).

## Why both layers

If you only do `dehydrate(queryClient)` + `<HydrationBoundary>`:

- ✅ Future refetches and invalidations work correctly.
- ❌ But on the very first render the effector stores in the new scope are still empty (until `mounted()` propagates a fresh result via the observer subscription) — causes a flash.

If you only do `serialize(scope)` + `fork({ values })`:

- ✅ React render hydrates with no flash.
- ❌ But the queryClient cache is empty, so any subsequent fetch / invalidate behaves like a fresh load.

Together they're equivalent to react-query's `<HydrationBoundary>` + `<QueryClientProvider>` combo.

## You must pass `name`

Effector stores serialize via **stable IDs** (SIDs). Without a `name` on `createQuery` / `createMutation` / `createInfiniteQuery`, the internal stores have no SID and are silently dropped from `serialize(scope)` — your client-side scope receives nothing.

```ts
const userQuery = createQuery({
  name: 'user', // ← required for SSR-via-scope
  queryKey: ['user', $userId],
  queryFn: fetchUser,
})
```

A development warning fires the first time you create a query without a `name`. See [Naming & SIDs](/effector-tanstack-query/guides/naming-and-sids/) for the full story.

## staleTime considerations

If `staleTime: 0` (the default), the observer on the client refetches immediately after hydration even with cached data. To use the SSR-shipped data without an immediate refetch:

```ts
createQuery({
  name: 'user',
  queryKey: ['user'],
  queryFn: fetchUser,
  staleTime: 60_000, // or Infinity, or whatever your server-side data freshness allows
})
```
