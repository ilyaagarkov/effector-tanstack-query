import 'server-only'
import { QueryClient, dehydrate } from '@tanstack/query-core'
import { allSettled, fork, serialize } from 'effector'
import { $queryClient } from '@effector-tanstack-query/core'
import type { Scope } from 'effector'

// Minimal shape we actually need — accepts any QueryResult / InfiniteQueryResult
// without forcing the caller to widen its TData / TError type parameters.
interface PrefetchableQuery {
  prefetch: import('effector').EventCallable<void>
  mounted: import('effector').EventCallable<void>
}

/**
 * Create a fresh QueryClient + effector scope **per request**. Both are
 * wired together via fork({ values: [[$queryClient, qc]] }) so every
 * Observer in this scope reads from this request's cache — no cross-request
 * bleed even under concurrent SSR.
 */
export function makeRequestScope(): { queryClient: QueryClient; scope: Scope } {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false, staleTime: 60_000 },
    },
  })
  // We do NOT call queryClient.mount() on the server — no window/focus
  // events to subscribe to, and we don't want background refetch tasks.

  const scope = fork({ values: [[$queryClient, queryClient]] })

  return { queryClient, scope }
}

/**
 * Server-side prefetch helper:
 *
 *   1. Fire `query.prefetch` for each query in scope — this runs
 *      `qc.fetchQuery(...)` and **awaits** the result, so by the time
 *      `allSettled` resolves the cache has data.
 *   2. Fire `query.mounted` for each query — this creates the observer
 *      in scope and immediately dispatches the cached state into the
 *      effector stores (the observer reads from the now-populated cache,
 *      no second fetch).
 *   3. Snapshot both layers (`dehydrate` + `serialize`) so the client can
 *      hydrate with data on the very first render — no flash.
 */
export async function prefetch(
  scope: Scope,
  queryClient: QueryClient,
  queries: Array<PrefetchableQuery>,
): Promise<{
  dehydratedQueryClient: ReturnType<typeof dehydrate>
  serializedScope: ReturnType<typeof serialize>
}> {
  // Step 1: populate qc cache. allSettled awaits because prefetchFx returns
  // the fetch Promise.
  await Promise.all(
    queries.map((q) => allSettled(q.prefetch, { scope })),
  )

  // Step 2: mount the queries so the effector stores ($data, $status, …)
  // get the freshly-cached values dispatched into them. Mount is fast here
  // because the cache hit means no new network request.
  await Promise.all(
    queries.map((q) => allSettled(q.mounted, { scope })),
  )

  return {
    dehydratedQueryClient: dehydrate(queryClient),
    serializedScope: serialize(scope),
  }
}
