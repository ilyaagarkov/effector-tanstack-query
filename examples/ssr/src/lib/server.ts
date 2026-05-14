import 'server-only'
import { QueryClient, dehydrate } from '@tanstack/query-core'
import { fork, serialize } from 'effector'
import {
  $queryClient,
  prefetchQueries,
  type PrefetchableQuery,
} from '@effector-tanstack-query/core'
import type { Scope } from 'effector'

/**
 * Build a fresh QueryClient + effector scope **per request** for the server
 * render of one page. Both are throwaway: only their serialized snapshots
 * (`dehydrate(qc)` + `serialize(scope)`) are shipped to the browser, where
 * `<PageHydration>` merges them into the singleton client scope owned by
 * `<Providers>` in the layout.
 *
 * Wiring: `fork({ values: [[$queryClient, qc]] })` makes every observer in
 * this scope read from this request's cache — no cross-request bleed under
 * concurrent SSR.
 */
export function makeRequestScope(): { queryClient: QueryClient; scope: Scope } {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, staleTime: 60_000 } },
  })
  // We do NOT call queryClient.mount() on the server — no window/focus
  // events to subscribe to, and we don't want background refetch tasks.

  const scope = fork({ values: [[$queryClient, queryClient]] })

  return { queryClient, scope }
}

/**
 * Server-side prefetch helper:
 *   1. `prefetchQueries(queries, { scope })` — runs both `prefetch` and
 *      `mounted` for every query, in the right order. Cache + effector
 *      stores are populated by the time it resolves.
 *   2. Snapshot both layers (`dehydrate` + `serialize`) so the client can
 *      hydrate with data on the very first render — no flash.
 */
export async function prefetch(
  scope: Scope,
  queryClient: QueryClient,
  queries: ReadonlyArray<PrefetchableQuery>,
): Promise<{
  dehydratedQueryClient: ReturnType<typeof dehydrate>
  serializedScope: ReturnType<typeof serialize>
}> {
  await prefetchQueries(queries, { scope })

  return {
    dehydratedQueryClient: dehydrate(queryClient),
    serializedScope: serialize(scope),
  }
}
