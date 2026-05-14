---
title: prefetchQueries
description: SSR helper that prefetches a batch of queries and populates both the QueryClient cache and the effector stores in a scope.
---

```ts
import { prefetchQueries } from '@effector-tanstack-query/core'

function prefetchQueries(
  queries: ReadonlyArray<PrefetchableQuery>,
  config: { scope: Scope },
): Promise<void>
```

`PrefetchableQuery` is the structural shape `{ prefetch: EventCallable<void>; mounted: EventCallable<void> }`. Both `QueryResult` (from `createQuery`) and `InfiniteQueryResult` (from `createInfiniteQuery`) satisfy it — pass them as-is.

## What it does

Two phases, both `await`ed:

1. **Cache fill** — for each query, `await allSettled(q.prefetch, { scope })`. This calls `queryClient.fetchQuery(...)` under the hood and waits for the queryFn to resolve. Queries are batched in parallel via `Promise.all`.
2. **Store fill** — for each query, `await allSettled(q.mounted, { scope })`. This creates the per-scope observer; its synchronous `getCurrentResult()` dispatch reads from the now-populated cache and writes into `$data`, `$status`, `$isFetching`, etc. Again batched in parallel.

The phases run sequentially because step 2 must see a populated cache to dispatch real data instead of a `pending` placeholder.

## Why both phases matter

If you only run `prefetch`:

- ✅ `dehydrate(queryClient)` returns a snapshot the browser can hydrate.
- ❌ `serialize(scope)` returns nothing useful — the effector stores were never written to, so they stay at defaults.
- ❌ Server-rendered HTML reads `$data` via `useUnit`, gets `undefined`, renders a loading state. After client hydration `useEffect` finally mounts the observer and the data appears — **flash of loading state on first paint**.

`prefetchQueries` exists so this footgun is impossible to write.

## Typical usage

```ts
import 'server-only'
import { QueryClient, dehydrate } from '@tanstack/query-core'
import { fork, serialize } from 'effector'
import { $queryClient, prefetchQueries } from '@effector-tanstack-query/core'

export async function ssrSnapshot(queries) {
  const queryClient = new QueryClient()
  const scope = fork({ values: [[$queryClient, queryClient]] })

  await prefetchQueries(queries, { scope })

  return {
    dehydratedQueryClient: dehydrate(queryClient),
    serializedScope: serialize(scope),
  }
}
```

Pair with [`<HydrationBoundary state={dehydratedQueryClient}>`](/effector-tanstack-query/react/hydration-boundary/) on the client to complete the round-trip. See the [SSR guide](/effector-tanstack-query/guides/ssr/) for the full Next.js App Router flow.

## With reactive keys

When a `queryKey` element is a `Store`, set the store inside the scope **before** calling `prefetchQueries`:

```ts
import { allSettled } from 'effector'

await allSettled(detailNameSet, { params: 'bulbasaur', scope })
await prefetchQueries([pokemonDetailQuery], { scope })
// queryFn ran against queryKey ['pokemon', 'bulbasaur']
```

## Notes

- **Scope is required.** `allSettled` cannot await unit triggers outside of a scope. If you only need fire-and-forget prefetching in a CSR app without a scope, call `query.prefetch()` directly.
- **`queryClient.mount()` is not needed on the server.** Skip it — no window/focus events to subscribe to, and you don't want background refetch tasks for a request that's about to end.
- **Reasonable `staleTime`** on the factory keeps the hydrated client cache fresh after page-load. With the default `0`, the observer refetches immediately after hydration; set it to your data's actual freshness window.
