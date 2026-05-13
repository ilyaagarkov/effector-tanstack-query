import { attach, createEvent, createStore, sample } from 'effector'
import type { EventCallable, Store } from 'effector'
import type {
  InvalidateQueryFilters,
  QueryClient,
} from '@tanstack/query-core'
import { $queryClient } from './queryClient'
import { resolveKey } from './resolve'
import type { EffectorQueryKey } from './types'

export interface CreateInvalidateOptions {
  /**
   * Key (or key prefix) to invalidate. Supports the same reactive shape as
   * `createQuery.queryKey` — drop a `Store` anywhere in the array and the
   * invalidate event will resolve it on every call, so dynamic keys "just
   * work".
   */
  queryKey: EffectorQueryKey
  /**
   * Forwarded to `queryClient.invalidateQueries({ exact })`. With `exact: true`
   * only queries whose key *exactly* matches are invalidated; otherwise the
   * key is treated as a prefix.
   */
  exact?: boolean
  /**
   * Forwarded to `queryClient.invalidateQueries({ refetchType })`. Controls
   * which observers refetch immediately after invalidation. Defaults to
   * `'active'` (TanStack Query's own default).
   */
  refetchType?: 'active' | 'inactive' | 'all' | 'none'
  /**
   * Forwarded to `queryClient.invalidateQueries({ type })`. Filters which
   * queries match — `'active'`, `'inactive'`, `'all'`.
   */
  type?: 'active' | 'inactive' | 'all'
}

/**
 * Builds an effector event that invalidates a query (or a key prefix) on the
 * resolved `QueryClient`. Useful when you want to invalidate a query
 * declaratively from a `sample` (e.g. on a mutation's `finished.success`)
 * without writing a one-off `attach` every time.
 *
 * @example Static key
 * const invalidateFavorites = createInvalidate({ queryKey: ['favorites'] })
 * sample({ clock: addFavorite.finished.success, target: invalidateFavorites })
 *
 * @example Reactive key — uses current $userId at invocation time
 * const invalidateUser = createInvalidate({ queryKey: ['user', $userId] })
 *
 * @example Explicit client (same back-compat overload as the other factories)
 * const invalidateFavorites = createInvalidate(queryClient, { queryKey: ['favorites'] })
 */
export function createInvalidate(
  options: CreateInvalidateOptions,
): EventCallable<void>
export function createInvalidate(
  queryClient: QueryClient,
  options: CreateInvalidateOptions,
): EventCallable<void>
export function createInvalidate(
  arg1: QueryClient | CreateInvalidateOptions,
  arg2?: CreateInvalidateOptions,
): EventCallable<void> {
  const [explicitClient, options] = parseArgs(arg1, arg2)
  const { queryKey, exact, refetchType, type } = options

  // Same locking semantics as the other factories: explicit client freezes
  // the store, default flows through global $queryClient (and respects
  // fork({ values: [[$queryClient, qc]] }) for per-scope isolation).
  const $effectiveClient: Store<QueryClient | null> = explicitClient
    ? createStore(explicitClient as QueryClient | null, {
        serialize: 'ignore',
      })
    : $queryClient

  const $resolvedKey = resolveKey(queryKey)

  const invalidate = createEvent<void>()

  const invalidateFx = attach({
    source: { qc: $effectiveClient, key: $resolvedKey },
    effect: ({ qc, key }) => {
      if (!qc) return
      const filters: InvalidateQueryFilters = { queryKey: key }
      if (exact !== undefined) filters.exact = exact
      if (refetchType !== undefined) filters.refetchType = refetchType
      if (type !== undefined) filters.type = type
      return qc.invalidateQueries(filters)
    },
  })

  sample({ clock: invalidate, target: invalidateFx })

  return invalidate
}

function parseArgs(
  arg1: QueryClient | CreateInvalidateOptions,
  arg2?: CreateInvalidateOptions,
): [QueryClient | null, CreateInvalidateOptions] {
  if (arg2 !== undefined) return [arg1 as QueryClient, arg2]
  return [null, arg1 as CreateInvalidateOptions]
}
