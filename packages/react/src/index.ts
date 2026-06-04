'use client'

import * as React from 'react'
import { useUnit } from 'effector-react'
import { hydrate } from '@tanstack/query-core'
import type {
  DehydratedState,
  FetchStatus,
  HydrateOptions,
  MutateOptions,
  QueryStatus,
} from '@tanstack/query-core'
import { $queryClient } from '@effector-tanstack-query/core'
import type {
  InfiniteQueryResult,
  MutationResult,
  MutationStatus,
  QueriesResult,
  QueryResult,
} from '@effector-tanstack-query/core'

export interface HydrationBoundaryProps {
  /**
   * Snapshot produced by `dehydrate(queryClient)` on the server. Re-applied
   * to the scope's `QueryClient` cache so observers mounted under this tree
   * read prefetched data instead of triggering fresh network requests.
   */
  state?: DehydratedState
  /** Forwarded to `hydrate(...)` — see `@tanstack/query-core` docs. */
  options?: HydrateOptions
  children?: React.ReactNode
}

/**
 * Merges a server-prefetched `DehydratedState` into the scope's
 * `QueryClient` cache.
 *
 * Mirrors `<HydrationBoundary>` from `@tanstack/react-query`: hydration
 * runs in `useMemo` so the merge happens during the render phase (children
 * see a populated cache on their first render, no flash). The hook
 * resolves the QueryClient via `useUnit($queryClient)` instead of
 * `useQueryClient()` — meaning each fork scope can have its own client
 * without an additional `<QueryClientProvider>` in the tree.
 *
 * `hydrate` is idempotent: re-rendering with the same `state` reference
 * is a no-op. Pass new `state` references on navigation to merge fresh
 * snapshots.
 *
 * Note: this only handles the QueryClient cache layer. Effector store
 * snapshots (e.g. `serialize(scope)`) flow through your existing
 * `<Provider>` / `<EffectorNext values>` layer — orthogonal concerns.
 */
export function HydrationBoundary({
  state,
  options,
  children,
}: HydrationBoundaryProps): React.ReactElement {
  const queryClient = useUnit($queryClient)
  React.useMemo(() => {
    if (queryClient && state) hydrate(queryClient, state, options)
  }, [queryClient, state, options])
  return React.createElement(React.Fragment, null, children)
}

export interface UseQueryResult<TData, TError = Error> {
  data: TData | undefined
  error: TError | null
  status: QueryStatus
  isPending: boolean
  isFetching: boolean
  isSuccess: boolean
  isError: boolean
  isPlaceholderData: boolean
  fetchStatus: FetchStatus
  refresh: () => void
}

/**
 * Subscribes a React component to a query, automatically calling
 * `mounted()` on mount and `unmounted()` on cleanup.
 */
export function useQuery<TData, TError = Error>(
  query: QueryResult<TData, TError>,
): UseQueryResult<TData, TError> {
  const state = useUnit({
    data: query.$data,
    error: query.$error,
    status: query.$status,
    isPending: query.$isPending,
    isFetching: query.$isFetching,
    isSuccess: query.$isSuccess,
    isError: query.$isError,
    isPlaceholderData: query.$isPlaceholderData,
    fetchStatus: query.$fetchStatus,
  })

  const mount = useUnit(query.mounted)
  const unmount = useUnit(query.unmounted)
  const refresh = useUnit(query.refresh)

  React.useEffect(() => {
    mount()
    return () => unmount()
  }, [mount, unmount])

  return { ...state, refresh }
}

export interface UseMutationResult<TData, TError, TVariables> {
  data: TData | undefined
  error: TError | null
  status: MutationStatus
  variables: TVariables | undefined
  isPaused: boolean
  isPending: boolean
  isSuccess: boolean
  isError: boolean
  isIdle: boolean
  mutate: (variables: TVariables) => void
  /**
   * Trigger the mutation with per-call callbacks layered on top of the
   * observer-level ones (`onSuccess` / `onError` / `onSettled` in
   * `createMutation` options). Use this for component-local reactions
   * that don't fit module-level `sample` wiring — navigation after success,
   * one-shot toasts, etc.
   */
  mutateWith: (args: {
    variables: TVariables
    onSuccess?: MutateOptions<TData, TError, TVariables>['onSuccess']
    onError?: MutateOptions<TData, TError, TVariables>['onError']
    onSettled?: MutateOptions<TData, TError, TVariables>['onSettled']
  }) => void
  reset: () => void
}

/**
 * Subscribes a React component to a mutation, automatically calling
 * `start()` on mount and `unmounted()` on cleanup so the queryClient can
 * garbage-collect the mutation entry once no observers remain.
 */
export function useMutation<TData = unknown, TError = Error, TVariables = void>(
  mutation: MutationResult<TData, TError, TVariables>,
): UseMutationResult<TData, TError, TVariables> {
  const state = useUnit({
    data: mutation.$data,
    error: mutation.$error,
    status: mutation.$status,
    variables: mutation.$variables,
    isPaused: mutation.$isPaused,
    isPending: mutation.$isPending,
    isSuccess: mutation.$isSuccess,
    isError: mutation.$isError,
    isIdle: mutation.$isIdle,
  })

  const start = useUnit(mutation.start)
  const unmount = useUnit(mutation.unmounted)
  const mutate = useUnit(mutation.mutate)
  const mutateWith = useUnit(mutation.mutateWith)
  const reset = useUnit(mutation.reset)

  React.useEffect(() => {
    start()
    return () => unmount()
  }, [start, unmount])

  return { ...state, mutate, mutateWith, reset }
}

export interface UseInfiniteQueryResult<TData, TError> {
  data: TData | undefined
  error: TError | null
  status: QueryStatus
  isPending: boolean
  isFetching: boolean
  isSuccess: boolean
  isError: boolean
  isPlaceholderData: boolean
  fetchStatus: FetchStatus
  hasNextPage: boolean
  hasPreviousPage: boolean
  isFetchingNextPage: boolean
  isFetchingPreviousPage: boolean
  isFetchNextPageError: boolean
  isFetchPreviousPageError: boolean
  refresh: () => void
  fetchNextPage: () => void
  fetchPreviousPage: () => void
}

/**
 * Subscribes a React component to an infinite query, with auto mount/unmount
 * lifecycle and bound `fetchNextPage` / `fetchPreviousPage` callbacks.
 */
export function useInfiniteQuery<TData, TError = Error, TPageParam = unknown>(
  query: InfiniteQueryResult<TData, TError, TPageParam>,
): UseInfiniteQueryResult<TData, TError> {
  const state = useUnit({
    data: query.$data,
    error: query.$error,
    status: query.$status,
    isPending: query.$isPending,
    isFetching: query.$isFetching,
    isSuccess: query.$isSuccess,
    isError: query.$isError,
    isPlaceholderData: query.$isPlaceholderData,
    fetchStatus: query.$fetchStatus,
    hasNextPage: query.$hasNextPage,
    hasPreviousPage: query.$hasPreviousPage,
    isFetchingNextPage: query.$isFetchingNextPage,
    isFetchingPreviousPage: query.$isFetchingPreviousPage,
    isFetchNextPageError: query.$isFetchNextPageError,
    isFetchPreviousPageError: query.$isFetchPreviousPageError,
  })

  const mount = useUnit(query.mounted)
  const unmount = useUnit(query.unmounted)
  const refresh = useUnit(query.refresh)
  const fetchNextPage = useUnit(query.fetchNextPage)
  const fetchPreviousPage = useUnit(query.fetchPreviousPage)

  React.useEffect(() => {
    mount()
    return () => unmount()
  }, [mount, unmount])

  return { ...state, refresh, fetchNextPage, fetchPreviousPage }
}

// =============================================================================
// useQueries — parallel reads across a static tuple of factories OR a family
// produced by `createQueries({ source, query })`.
// =============================================================================

type UseQueriesTuple = ReadonlyArray<QueryResult<any, any>>

/**
 * Maps a tuple of `QueryResult<TData, TError>` to a tuple of
 * `UseQueryResult<TData, TError>`, preserving per-element types so
 * destructuring (`const [user, posts] = useQueries([...] as const)`)
 * yields fully-typed entries.
 */
export type UseQueriesTupleResult<T extends UseQueriesTuple> = {
  [K in keyof T]: T[K] extends QueryResult<infer D, infer E>
    ? UseQueryResult<D, E>
    : never
}

export function useQueries<const T extends UseQueriesTuple>(
  queries: T,
): UseQueriesTupleResult<T>
export function useQueries<TItem, TData, TError>(
  family: QueriesResult<TItem, TData, TError>,
): ReadonlyArray<UseQueryResult<TData, TError>>
export function useQueries(
  arg: UseQueriesTuple | QueriesResult<unknown, unknown, unknown>,
): UseQueriesTupleResult<UseQueriesTuple> | ReadonlyArray<UseQueryResult<unknown, unknown>> {
  if (Array.isArray(arg)) {
    return useQueriesTuple(arg)
  }
  return useQueriesFamily(arg as QueriesResult<unknown, unknown, unknown>)
}

function useQueriesTuple<T extends UseQueriesTuple>(
  queries: T,
): UseQueriesTupleResult<T> {
  // Twelve `useUnit` calls — count is FIXED, independent of N. The
  // array argument may grow / shrink between renders; effector-react
  // re-subscribes the underlying stores transparently.
  //
  // Rules-of-hooks constraint: the SHAPE of the call list must be
  // stable, not the length of each input array. We satisfy this with a
  // fixed sequence of 9 state-store calls + 3 event-bind calls.
  const datas              = useUnit(queries.map((q) => q.$data))
  const errors             = useUnit(queries.map((q) => q.$error))
  const statuses           = useUnit(queries.map((q) => q.$status))
  const isPendings         = useUnit(queries.map((q) => q.$isPending))
  const isFetchings        = useUnit(queries.map((q) => q.$isFetching))
  const isSuccesses        = useUnit(queries.map((q) => q.$isSuccess))
  const isErrors           = useUnit(queries.map((q) => q.$isError))
  const isPlaceholderDatas = useUnit(queries.map((q) => q.$isPlaceholderData))
  const fetchStatuses      = useUnit(queries.map((q) => q.$fetchStatus))

  const mounts    = useUnit(queries.map((q) => q.mounted))
  const unmounts  = useUnit(queries.map((q) => q.unmounted))
  const refreshes = useUnit(queries.map((q) => q.refresh))

  React.useEffect(() => {
    for (const m of mounts) m()
    return () => {
      for (const u of unmounts) u()
    }
    // The dep on length re-runs mount/unmount when the consumer swaps
    // out the factory set (rare; most consumers pass a stable `as const`
    // literal). Function refs from `useUnit` are stable per (unit, scope)
    // — depending on their array identity would re-fire every render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [queries.length])

  return queries.map((_, i) => ({
    data:              datas[i],
    error:             errors[i],
    status:            statuses[i],
    isPending:         isPendings[i],
    isFetching:        isFetchings[i],
    isSuccess:         isSuccesses[i],
    isError:           isErrors[i],
    isPlaceholderData: isPlaceholderDatas[i],
    fetchStatus:       fetchStatuses[i],
    refresh:           refreshes[i],
  })) as UseQueriesTupleResult<T>
}

function useQueriesFamily<TItem, TData, TError>(
  family: QueriesResult<TItem, TData, TError>,
): ReadonlyArray<UseQueryResult<TData, TError>> {
  const items = useUnit(family.$items)
  const mount = useUnit(family.mounted)
  const unmount = useUnit(family.unmounted)
  const refreshOne = useUnit(family.refreshOne)

  React.useEffect(() => {
    mount()
    return () => unmount()
  }, [mount, unmount])

  return items.map((it) => ({
    data:              it.data,
    error:             it.error,
    status:            it.status,
    isPending:         it.isPending,
    isFetching:        it.isFetching,
    isSuccess:         it.isSuccess,
    isError:           it.isError,
    isPlaceholderData: it.isPlaceholderData,
    fetchStatus:       it.fetchStatus,
    // Per-item refresh — routes through the family's `refreshOne(item)`
    // so the consumer doesn't have to thread the source manually.
    refresh:           () => refreshOne(it.source),
  }))
}

// Suspense data path: read from a per-scope observer.
//
// The scope mount chain runs in useEffect, which is skipped while a component
// is suspended — so on the very first render the scope's `$observer` may be
// null. To get synchronous access to the observer's promise during suspense,
// we construct a transient observer via the factory's hidden
// `__createObserver(qc, { queryKey, enabled })` helper. The transient observer
// reads from / writes to the same queryClient cache as the eventual scope
// observer (which is created when mountFx runs after useEffect commits).
//
// The mount/unmount effect is still wired up so that other consumers reading
// the same query through `useUnit` / `useQuery` see updates in scope state.

function useObserverRerender(
  observer: { subscribe: (cb: () => void) => () => void } | null,
): void {
  const [, forceRender] = React.useReducer((x: number) => x + 1, 0)
  React.useEffect(() => {
    if (!observer) return
    return observer.subscribe(forceRender)
  }, [observer])
}

interface SuspenseFactory<TObserver> {
  __createObserver(
    qc: import('@tanstack/query-core').QueryClient,
    init: { queryKey: unknown; enabled: boolean },
  ): TObserver
  __resolvedKey: import('effector').Store<unknown>
  __enabled: import('effector').Store<boolean>
}

export interface UseSuspenseQueryResult<TData, TError = Error> {
  /** Resolved query data — non-nullable inside the rendered subtree (Suspense
   * absorbed the pending state). */
  data: TData
  /** Always `null` past the Suspense gate; errors are thrown to the nearest
   * `<ErrorBoundary>`. Typed as `TError | null` for consistency with
   * `useQuery` so the same destructure works in both. */
  error: TError | null
  status: 'success'
  isPending: false
  isSuccess: true
  isError: false
  /** `true` while a background refetch is running. Use for refresh spinners. */
  isFetching: boolean
  isPlaceholderData: boolean
  fetchStatus: FetchStatus
  refresh: () => void
}

/**
 * Reads a query for use inside a `<Suspense>` boundary. While the query is
 * pending, throws an inflight promise (queryClient-deduplicated). On error,
 * throws the error — catch with `<ErrorBoundary>`. Returns the same shape as
 * `useQuery`, but with `data` narrowed to non-nullable `TData` since the
 * pending state is impossible past the Suspense gate.
 */
export function useSuspenseQuery<TData, TError = Error>(
  query: QueryResult<TData, TError>,
): UseSuspenseQueryResult<TData, TError> {
  // Auto-mount lifecycle so concurrent consumers (useUnit / useQuery) reading
  // the same query through the effector scope stay in sync.
  const mount = useUnit(query.mounted)
  const unmount = useUnit(query.unmounted)
  const refresh = useUnit(query.refresh)
  React.useEffect(() => {
    mount()
    return () => unmount()
  }, [mount, unmount])

  const observer = useSuspenseObserver(query)
  useObserverRerender(observer)

  // Store snapshot — always read so hook order is fixed across renders.
  // The observer path doesn't use it; the store-only path (server-RSC of
  // a scope rehydrated from `serialize`, where `$observer` and
  // `$queryClient` are both `null` because they're `serialize: 'ignore'`)
  // reads everything from here.
  const state = useUnit({
    data: query.$data,
    error: query.$error,
    status: query.$status,
    isFetching: query.$isFetching,
    isPlaceholderData: query.$isPlaceholderData,
    fetchStatus: query.$fetchStatus,
  })

  // Observer path: `getOptimisticResult` reads from `QueryCache`
  // synchronously and reflects fetches/refetches the moment the observer
  // notifies. Used whenever we have an in-scope observer
  // (post-`mounted()`) or a transient one built from `$queryClient`.
  if (observer) {
    const result = observer.getOptimisticResult(observer.options as any)

    if (result.status === 'error') throw result.error
    if (result.status === 'pending') {
      throw observer.fetchOptimistic(observer.options as any)
    }

    return {
      data: result.data as TData,
      error: result.error as TError | null,
      status: 'success',
      isPending: false,
      isSuccess: true,
      isError: false,
      isFetching: result.isFetching,
      isPlaceholderData: result.isPlaceholderData,
      fetchStatus: result.fetchStatus,
      refresh,
    }
  }

  // Store-only path: no observer materialisable. Trust `$status` —
  // populated by `prefetchQueries` before the scope was serialised. A
  // pending status here means there's no `QueryClient` and no prefetch
  // happened: can't deduplicate-throw a fetch promise, so surface the
  // misconfiguration as an error to `<ErrorBoundary>`.
  if (state.status === 'error') throw state.error
  if (state.status === 'pending') {
    throw new Error(
      '[@effector-tanstack-query/react] useSuspenseQuery: no QueryClient is set. ' +
        'Call setQueryClient(qc) or pass it to fork({ values: [[$queryClient, qc]] }).',
    )
  }

  return {
    data: state.data as TData,
    error: state.error as TError | null,
    status: 'success',
    isPending: false,
    isSuccess: true,
    isError: false,
    isFetching: state.isFetching,
    isPlaceholderData: state.isPlaceholderData,
    fetchStatus: state.fetchStatus,
    refresh,
  }
}

export interface UseSuspenseInfiniteQueryResult<TData, TError = Error> {
  data: TData
  error: TError | null
  status: 'success'
  isPending: false
  isSuccess: true
  isError: false
  isFetching: boolean
  isPlaceholderData: boolean
  fetchStatus: FetchStatus
  hasNextPage: boolean
  hasPreviousPage: boolean
  isFetchingNextPage: boolean
  isFetchingPreviousPage: boolean
  isFetchNextPageError: boolean
  isFetchPreviousPageError: boolean
  refresh: () => void
  fetchNextPage: () => void
  fetchPreviousPage: () => void
}

/**
 * Suspense variant of {@link useInfiniteQuery}. Same shape as `useInfiniteQuery`,
 * with `data` narrowed to non-nullable.
 */
export function useSuspenseInfiniteQuery<
  TData,
  TError = Error,
  TPageParam = unknown,
>(
  query: InfiniteQueryResult<TData, TError, TPageParam>,
): UseSuspenseInfiniteQueryResult<TData, TError> {
  const mount = useUnit(query.mounted)
  const unmount = useUnit(query.unmounted)
  const refresh = useUnit(query.refresh)
  const fetchNextPage = useUnit(query.fetchNextPage)
  const fetchPreviousPage = useUnit(query.fetchPreviousPage)
  React.useEffect(() => {
    mount()
    return () => unmount()
  }, [mount, unmount])

  const observer = useSuspenseObserver(query)
  useObserverRerender(observer)

  // See `useSuspenseQuery` for the observer-vs-stores dual path rationale.
  // Infinite queries carry pagination fields in separate effector stores
  // (`$hasNextPage`, `$isFetchingNextPage`, …), so the store snapshot has
  // to read those too.
  const state = useUnit({
    data: query.$data,
    error: query.$error,
    status: query.$status,
    isFetching: query.$isFetching,
    isPlaceholderData: query.$isPlaceholderData,
    fetchStatus: query.$fetchStatus,
    hasNextPage: query.$hasNextPage,
    hasPreviousPage: query.$hasPreviousPage,
    isFetchingNextPage: query.$isFetchingNextPage,
    isFetchingPreviousPage: query.$isFetchingPreviousPage,
    isFetchNextPageError: query.$isFetchNextPageError,
    isFetchPreviousPageError: query.$isFetchPreviousPageError,
  })

  if (observer) {
    const obs = observer
    const result = obs.getOptimisticResult(obs.options as any)

    if (result.status === 'error') throw result.error
    if (result.status === 'pending') {
      throw (
        obs as unknown as {
          fetchOptimistic: (options: typeof obs.options) => Promise<unknown>
        }
      ).fetchOptimistic(obs.options)
    }

    const r = result as typeof result & {
      hasNextPage: boolean
      hasPreviousPage: boolean
      isFetchingNextPage: boolean
      isFetchingPreviousPage: boolean
      isFetchNextPageError: boolean
      isFetchPreviousPageError: boolean
    }

    return {
      data: r.data as TData,
      error: r.error as TError | null,
      status: 'success',
      isPending: false,
      isSuccess: true,
      isError: false,
      isFetching: r.isFetching,
      isPlaceholderData: r.isPlaceholderData,
      fetchStatus: r.fetchStatus,
      hasNextPage: r.hasNextPage,
      hasPreviousPage: r.hasPreviousPage,
      isFetchingNextPage: r.isFetchingNextPage,
      isFetchingPreviousPage: r.isFetchingPreviousPage,
      isFetchNextPageError: r.isFetchNextPageError,
      isFetchPreviousPageError: r.isFetchPreviousPageError,
      refresh,
      fetchNextPage,
      fetchPreviousPage,
    }
  }

  // Store-only path (server-RSC of a hydrated scope).
  if (state.status === 'error') throw state.error
  if (state.status === 'pending') {
    throw new Error(
      '[@effector-tanstack-query/react] useSuspenseInfiniteQuery: no QueryClient is set. ' +
        'Call setQueryClient(qc) or pass it to fork({ values: [[$queryClient, qc]] }).',
    )
  }

  return {
    data: state.data as TData,
    error: state.error as TError | null,
    status: 'success',
    isPending: false,
    isSuccess: true,
    isError: false,
    isFetching: state.isFetching,
    isPlaceholderData: state.isPlaceholderData,
    fetchStatus: state.fetchStatus,
    hasNextPage: state.hasNextPage,
    hasPreviousPage: state.hasPreviousPage,
    isFetchingNextPage: state.isFetchingNextPage,
    isFetchingPreviousPage: state.isFetchingPreviousPage,
    isFetchNextPageError: state.isFetchNextPageError,
    isFetchPreviousPageError: state.isFetchPreviousPageError,
    refresh,
    fetchNextPage,
    fetchPreviousPage,
  }
}

/**
 * Resolves a per-scope observer for suspense usage. Prefers the scope's
 * `$observer` (set by mountFx); falls back to a transient observer
 * constructed via `__createObserver` so that the very first render — before
 * useEffect has fired — has a working observer. Both flavors read/write the
 * same queryClient cache, so the transient observer is a thin wrapper.
 */
function useSuspenseObserver<
  TQuery extends {
    $observer: import('effector').Store<TObserver | null>
    $queryClient: import('effector').Store<
      import('@tanstack/query-core').QueryClient | null
    >
  },
  TObserver extends {
    options: { queryKey: unknown }
    setOptions(options: any): void
    subscribe(cb: () => void): () => void
    getOptimisticResult(options: any): {
      status: 'pending' | 'success' | 'error'
      data: unknown
      error: unknown
      isFetching: boolean
      isPlaceholderData: boolean
      fetchStatus: FetchStatus
      // Infinite-query result fields — present at runtime when the underlying
      // observer is an InfiniteQueryObserver; the suspense hooks narrow as
      // needed. Typed as `any` here to keep the constraint loose.
      hasNextPage?: any
      hasPreviousPage?: any
      isFetchingNextPage?: any
      isFetchingPreviousPage?: any
      isFetchNextPageError?: any
      isFetchPreviousPageError?: any
    }
    fetchOptimistic(options: any): Promise<unknown>
  },
>(query: TQuery): TObserver | null {
  const factory = query as unknown as TQuery & SuspenseFactory<TObserver>
  const observerInScope = useUnit(query.$observer) as TObserver | null
  const qc = useUnit(query.$queryClient)
  const queryKey = useUnit(factory.__resolvedKey)
  const enabled = useUnit(factory.__enabled)

  // Memoize a transient observer keyed by qc, so it survives across renders
  // while the scope observer is null. Once observerInScope appears, we
  // switch — the transient one is unsubscribed and abandoned (it never
  // subscribed to queryCache, so there is nothing to leak).
  const transient = React.useMemo(() => {
    if (observerInScope || !qc) return null
    return factory.__createObserver(qc, { queryKey, enabled })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [observerInScope, qc, factory])

  // Keep the transient observer's options in sync with reactive key/enabled,
  // so re-suspending on key changes still works through it.
  React.useEffect(() => {
    if (!transient) return
    transient.setOptions({ ...transient.options, queryKey, enabled })
  }, [transient, queryKey, enabled])

  // Null is a legitimate return: server-RSC render of a scope built from
  // `serialize(scope)` has neither `$observer` nor `$queryClient` (both are
  // `serialize: 'ignore'` — instances can't ride through the RSC boundary).
  // Callers branch on `$status === 'success'` from the serialized stores;
  // they only error out when a pending state is unreachable without an
  // observer to throw `fetchOptimistic` on.
  return observerInScope ?? transient
}

// =============================================================================
// useSuspenseQueries — Suspense variant of `useQueries`. Same two overloads:
// static tuple of factories OR a family from `createQueries(...)`.
// =============================================================================

type UseSuspenseQueriesTuple = ReadonlyArray<QueryResult<any, any>>

export type UseSuspenseQueriesTupleResult<T extends UseSuspenseQueriesTuple> = {
  [K in keyof T]: T[K] extends QueryResult<infer D, infer E>
    ? UseSuspenseQueryResult<D, E>
    : never
}

export function useSuspenseQueries<const T extends UseSuspenseQueriesTuple>(
  queries: T,
): UseSuspenseQueriesTupleResult<T>
export function useSuspenseQueries<TItem, TData, TError>(
  family: QueriesResult<TItem, TData, TError>,
): ReadonlyArray<UseSuspenseQueryResult<TData, TError>>
export function useSuspenseQueries(
  arg: UseSuspenseQueriesTuple | QueriesResult<unknown, unknown, unknown>,
):
  | UseSuspenseQueriesTupleResult<UseSuspenseQueriesTuple>
  | ReadonlyArray<UseSuspenseQueryResult<unknown, unknown>> {
  if (Array.isArray(arg)) {
    return useSuspenseQueriesTuple(arg)
  }
  return useSuspenseQueriesFamily(
    arg as QueriesResult<unknown, unknown, unknown>,
  )
}

function useSuspenseQueriesTuple<T extends UseSuspenseQueriesTuple>(
  queries: T,
): UseSuspenseQueriesTupleResult<T> {
  // Mount lifecycle (same as `useQueriesTuple`).
  const mounts = useUnit(queries.map((q) => q.mounted))
  const unmounts = useUnit(queries.map((q) => q.unmounted))
  const refreshes = useUnit(queries.map((q) => q.refresh))
  React.useEffect(() => {
    for (const m of mounts) m()
    return () => {
      for (const u of unmounts) u()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [queries.length])

  // Per-query state from stores — fixed hook count.
  const datas = useUnit(queries.map((q) => q.$data))
  const errors = useUnit(queries.map((q) => q.$error))
  const statuses = useUnit(queries.map((q) => q.$status))
  const isFetchings = useUnit(queries.map((q) => q.$isFetching))
  const isPlaceholderDatas = useUnit(queries.map((q) => q.$isPlaceholderData))
  const fetchStatuses = useUnit(queries.map((q) => q.$fetchStatus))

  // Observer / qc / key info per query — same fixed-count pattern.
  const observersInScope = useUnit(queries.map((q) => q.$observer))
  const qcs = useUnit(queries.map((q) => q.$queryClient))
  const resolvedKeys = useUnit(
    queries.map((q) => (q as unknown as SuspenseFactory<unknown>).__resolvedKey),
  )
  const enabledStates = useUnit(
    queries.map((q) => (q as unknown as SuspenseFactory<unknown>).__enabled),
  )

  // Transient observers per slot (null when an in-scope observer
  // exists or no qc is available). One useMemo across all queries —
  // hook-count stable.
  const transients = React.useMemo(() => {
    return queries.map((q, i) => {
      if (observersInScope[i]) return null
      const qc = qcs[i]
      if (!qc) return null
      return (q as unknown as SuspenseFactory<any>).__createObserver(qc, {
        queryKey: resolvedKeys[i],
        enabled: enabledStates[i] as boolean,
      })
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [queries, ...observersInScope, ...qcs, ...resolvedKeys, ...enabledStates])

  type SuspendableObserver = {
    options: { queryKey: unknown }
    subscribe(cb: () => void): () => void
    fetchOptimistic(options: any): Promise<unknown>
    getOptimisticResult(options: any): {
      status: 'pending' | 'success' | 'error'
      data: unknown
      error: unknown
      isFetching: boolean
      isPlaceholderData: boolean
      fetchStatus: FetchStatus
    }
  }
  const observers = queries.map(
    (_, i) =>
      ((observersInScope[i] ?? transients[i]) ?? null) as
        | SuspendableObserver
        | null,
  )

  // Subscribe to every live observer in one effect so the consumer
  // re-renders when ANY of them notifies.
  const [, forceRender] = React.useReducer((x: number) => x + 1, 0)
  React.useEffect(() => {
    const unsubs = observers.map((obs) =>
      obs ? obs.subscribe(forceRender) : null,
    )
    return () => {
      for (const u of unsubs) u?.()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [queries.length, ...observers])

  // Per-slot live result — from observer if available (synchronous
  // QueryCache read), otherwise null and we fall back to the
  // effector-store snapshot. Mirrors the dual path in
  // `useSuspenseQuery` so SSR scopes (`$observer` + `$queryClient`
  // both null) keep working.
  const liveResults = observers.map((obs) =>
    obs ? obs.getOptimisticResult(obs.options) : null,
  )

  // Errors first — first error wins.
  for (let i = 0; i < queries.length; i++) {
    const live = liveResults[i]
    if (live) {
      if (live.status === 'error') throw live.error
    } else if (statuses[i] === 'error') {
      throw errors[i]
    }
  }

  // Then pending — collect every pending query's inflight promise into
  // a single `Promise.all` thrown to Suspense. The store-only path has
  // no observer to fetch with: that's a misconfiguration (no QC, no
  // prefetch), throw a clear error.
  const pendingPromises: Array<Promise<unknown>> = []
  for (let i = 0; i < queries.length; i++) {
    const live = liveResults[i]
    const obs = observers[i]
    if (live) {
      if (live.status === 'pending' && obs) {
        pendingPromises.push(obs.fetchOptimistic(obs.options))
      }
    } else if (statuses[i] === 'pending') {
      throw new Error(
        '[@effector-tanstack-query/react] useSuspenseQueries: no QueryClient is set. ' +
          'Call setQueryClient(qc) or pass it to fork({ values: [[$queryClient, qc]] }).',
      )
    }
  }
  if (pendingPromises.length > 0) throw Promise.all(pendingPromises)

  // All success — shape the result tuple. Prefer the observer's live
  // result when present (reflects in-flight refetches), fall back to
  // the store snapshot otherwise.
  return queries.map((_, i) => {
    const live = liveResults[i]
    return {
      data: (live ? live.data : datas[i]) as unknown,
      error: (live ? live.error : (errors[i] ?? null)) as unknown,
      status: 'success' as const,
      isPending: false as const,
      isSuccess: true as const,
      isError: false as const,
      isFetching: (live ? live.isFetching : isFetchings[i]) as boolean,
      isPlaceholderData: (live
        ? live.isPlaceholderData
        : isPlaceholderDatas[i]) as boolean,
      fetchStatus: (live ? live.fetchStatus : fetchStatuses[i]) as FetchStatus,
      refresh: refreshes[i] as () => void,
    }
  }) as UseSuspenseQueriesTupleResult<T>
}

interface FamilyInternals<TItem> {
  __queryFor: (item: TItem) => {
    queryKey: ReadonlyArray<unknown>
    queryFn?: unknown
  }
}

function useSuspenseQueriesFamily<TItem, TData, TError>(
  family: QueriesResult<TItem, TData, TError>,
): ReadonlyArray<UseSuspenseQueryResult<TData, TError>> {
  const mount = useUnit(family.mounted)
  const unmount = useUnit(family.unmounted)
  const refreshOne = useUnit(family.refreshOne)
  React.useEffect(() => {
    mount()
    return () => unmount()
  }, [mount, unmount])

  const items = useUnit(family.$items)
  const qc = useUnit(family.$queryClient)

  // Error wins over pending.
  for (const it of items) {
    if (it.status === 'error') throw it.error
  }

  const pending = items.filter((it) => it.status === 'pending')
  if (pending.length > 0) {
    if (!qc) {
      throw new Error(
        '[@effector-tanstack-query/react] useSuspenseQueries: no QueryClient is set. ' +
          'Call setQueryClient(qc) or pass it to fork({ values: [[$queryClient, qc]] }).',
      )
    }
    const queryFor = (family as unknown as FamilyInternals<TItem>).__queryFor
    throw Promise.all(
      pending.map((it) =>
        qc.fetchQuery(queryFor(it.source) as any).catch(() => undefined),
      ),
    )
  }

  return items.map((it) => ({
    data: it.data as TData,
    error: it.error,
    status: 'success' as const,
    isPending: false as const,
    isSuccess: true as const,
    isError: false as const,
    isFetching: it.isFetching,
    isPlaceholderData: it.isPlaceholderData,
    fetchStatus: it.fetchStatus,
    refresh: () => refreshOne(it.source),
  }))
}
