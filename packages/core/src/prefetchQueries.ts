import { allSettled } from 'effector'
import type { EventCallable, Scope } from 'effector'

/**
 * Structural shape of any factory result that exposes the two SSR
 * lifecycle events. Both `QueryResult` and `InfiniteQueryResult` satisfy
 * this without forcing the caller to widen their `TData` / `TError` type
 * parameters.
 */
export interface PrefetchableQuery {
  prefetch: EventCallable<void>
  mounted: EventCallable<void>
}

export interface PrefetchQueriesConfig {
  /** Scope to run the lifecycle events in. Required — `allSettled` cannot
   * await unit triggers outside of a scope. */
  scope: Scope
}

/**
 * Server-side helper that fills **both** SSR layers for a set of queries:
 *
 *   1. `await allSettled(q.prefetch, { scope })` for each query — awaits
 *      `queryClient.fetchQuery(...)` so by the time the promise resolves
 *      the cache holds the data.
 *   2. `await allSettled(q.mounted, { scope })` for each query — creates
 *      the per-scope observer; its synchronous `getCurrentResult()`
 *      dispatch reads from the now-populated cache and writes into the
 *      effector stores (`$data`, `$status`, …). This is what makes
 *      `serialize(scope)` ship populated stores, which in turn lets the
 *      server-rendered HTML show data on first paint.
 *
 * Skipping step 2 (calling only `prefetch`) leaves the effector stores at
 * their defaults — `serialize(scope)` returns nothing useful, the
 * server-rendered HTML shows loading, and the user sees a flash on
 * hydration. This helper exists so that bug is impossible to write.
 *
 * Both phases run in parallel within themselves (`Promise.all`) but
 * sequentially across phases (`mounted` must see a populated cache).
 *
 * Snapshot the layers yourself afterwards — `dehydrate(queryClient)` for
 * the cache and `serialize(scope)` for the stores — and ship both to the
 * client (e.g. via `<HydrationBoundary state={...}>` + `<EffectorNext
 * values={...}>` or `fork({ values: ... })`).
 *
 * @example
 * ```ts
 * const queryClient = new QueryClient()
 * const scope = fork({ values: [[$queryClient, queryClient]] })
 *
 * await prefetchQueries([listQuery, pokemonQuery], { scope })
 *
 * return {
 *   dehydratedQueryClient: dehydrate(queryClient),
 *   serializedScope: serialize(scope),
 * }
 * ```
 */
export async function prefetchQueries(
  queries: ReadonlyArray<PrefetchableQuery>,
  config: PrefetchQueriesConfig,
): Promise<void> {
  const { scope } = config
  await Promise.all(queries.map((q) => allSettled(q.prefetch, { scope })))
  await Promise.all(queries.map((q) => allSettled(q.mounted, { scope })))
}
