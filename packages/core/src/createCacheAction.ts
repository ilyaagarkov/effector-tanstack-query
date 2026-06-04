import { attach, createEvent, createStore, sample } from 'effector'
import type { EventCallable, Store } from 'effector'
import type { QueryClient, QueryFilters, QueryKey } from '@tanstack/query-core'
import { $queryClient } from './queryClient'
import { resolveKey } from './resolve'
import type { EffectorQueryKey } from './types'

/**
 * Options shared by `createCancel` / `createRemove` / `createReset`.
 *
 * Structurally a `QueryFilters` (from `@tanstack/query-core`) with the
 * `queryKey` field widened to the reactive `EffectorQueryKey` shape — drop a
 * `Store` anywhere in the array and the action resolves it on every call.
 *
 * `queryKey` is **optional**: omit it to target *all* queries, mirroring
 * `queryClient.cancelQueries()` / `removeQueries()` / `resetQueries()` with no
 * filters.
 */
export interface CacheActionOptions extends Omit<QueryFilters, 'queryKey'> {
  /**
   * Key (or key prefix) to act on. Supports the same reactive shape as
   * `createQuery.queryKey`. Omit to match every query in the cache.
   */
  queryKey?: EffectorQueryKey
}

/** Distinct named aliases so each factory documents its own option type. */
export type CreateCancelOptions = CacheActionOptions
export type CreateRemoveOptions = CacheActionOptions
export type CreateResetOptions = CacheActionOptions

/**
 * The QueryClient method a given action drives. Receives the resolved filters
 * (with `queryKey` already merged in when present). May be sync (`removeQueries`
 * returns `void`) or async (`cancelQueries` / `resetQueries` return a Promise).
 */
type CacheActionRunner = (qc: QueryClient, filters: QueryFilters) => unknown

/**
 * Shared builder. Returns a `void` event that, when fired, runs `action`
 * against the resolved `QueryClient` with the resolved filters. Mirrors
 * `createInvalidate`'s locking + reactive-key + per-scope semantics exactly.
 */
function buildCacheAction(
  action: CacheActionRunner,
  explicitClient: QueryClient | null,
  options: CacheActionOptions,
): EventCallable<void> {
  const { queryKey, ...restFilters } = options

  // Same locking semantics as the other factories: explicit client freezes the
  // store, default flows through global $queryClient (and respects
  // fork({ values: [[$queryClient, qc]] }) for per-scope isolation).
  const $effectiveClient: Store<QueryClient | null> = explicitClient
    ? createStore(explicitClient as QueryClient | null, {
        serialize: 'ignore',
      })
    : $queryClient

  // No queryKey → a store of `undefined`, so the effect omits the field and the
  // action matches all queries.
  const $resolvedKey: Store<QueryKey | undefined> = queryKey
    ? resolveKey(queryKey)
    : createStore<QueryKey | undefined>(undefined, { skipVoid: false })

  const run = createEvent<void>()

  const runFx = attach({
    source: { qc: $effectiveClient, key: $resolvedKey },
    effect: ({ qc, key }) => {
      if (!qc) return
      const filters: QueryFilters = { ...restFilters }
      if (key !== undefined) filters.queryKey = key
      return action(qc, filters)
    },
  })

  sample({ clock: run, target: runFx })

  return run
}

function parseArgs(
  arg1: QueryClient | CacheActionOptions,
  arg2?: CacheActionOptions,
): [QueryClient | null, CacheActionOptions] {
  if (arg2 !== undefined) return [arg1 as QueryClient, arg2]
  return [null, arg1 as CacheActionOptions]
}

/**
 * Builds a `sample`-friendly event that **cancels** in-flight queries on the
 * resolved `QueryClient` (without removing cached data). Wraps
 * `queryClient.cancelQueries` — async, so `await allSettled(cancel, { scope })`
 * waits for cancellation to settle.
 *
 * @example Cancel a user's queries on logout
 * const cancelUserQueries = createCancel({ queryKey: ['user', $userId] })
 * sample({ clock: logoutClicked, target: cancelUserQueries })
 *
 * @example Explicit client (same back-compat overload as createInvalidate)
 * const cancelAll = createCancel(queryClient, {})
 */
export function createCancel(options: CacheActionOptions): EventCallable<void>
export function createCancel(
  queryClient: QueryClient,
  options: CacheActionOptions,
): EventCallable<void>
export function createCancel(
  arg1: QueryClient | CacheActionOptions,
  arg2?: CacheActionOptions,
): EventCallable<void> {
  const [explicitClient, options] = parseArgs(arg1, arg2)
  return buildCacheAction(
    (qc, filters) => qc.cancelQueries(filters),
    explicitClient,
    options,
  )
}

/**
 * Builds a `sample`-friendly event that **removes** matching entries from the
 * cache entirely. Wraps `queryClient.removeQueries` — synchronous (no Promise).
 * The next mount of a removed query starts from a pending state.
 *
 * @example Drop stale cache on navigation
 * const removeStale = createRemove({ queryKey: ['stale-cache'] })
 * sample({ clock: navigated, target: removeStale })
 */
export function createRemove(options: CacheActionOptions): EventCallable<void>
export function createRemove(
  queryClient: QueryClient,
  options: CacheActionOptions,
): EventCallable<void>
export function createRemove(
  arg1: QueryClient | CacheActionOptions,
  arg2?: CacheActionOptions,
): EventCallable<void> {
  const [explicitClient, options] = parseArgs(arg1, arg2)
  return buildCacheAction(
    (qc, filters) => qc.removeQueries(filters),
    explicitClient,
    options,
  )
}

/**
 * Builds a `sample`-friendly event that **resets** matching queries back to
 * their initial state and refetches any active observers. Wraps
 * `queryClient.resetQueries` — async, so `await allSettled(reset, { scope })`
 * waits for the refetch to settle.
 *
 * @example Reset search results when the filters are cleared
 * const resetSearch = createReset({ queryKey: ['search'] })
 * sample({ clock: filtersCleared, target: resetSearch })
 */
export function createReset(options: CacheActionOptions): EventCallable<void>
export function createReset(
  queryClient: QueryClient,
  options: CacheActionOptions,
): EventCallable<void>
export function createReset(
  arg1: QueryClient | CacheActionOptions,
  arg2?: CacheActionOptions,
): EventCallable<void> {
  const [explicitClient, options] = parseArgs(arg1, arg2)
  return buildCacheAction(
    (qc, filters) => qc.resetQueries(filters),
    explicitClient,
    options,
  )
}
