'use client'

import * as React from 'react'
import { useProvidedScope, useUnit } from 'effector-react'
import type { Store } from 'effector'
import { hydrate } from '@tanstack/query-core'
import type {
  DehydratedState,
  FetchStatus,
  HydrateOptions,
  MutateOptions,
  MutationFilters,
  QueryClient,
  QueryFilters,
  QueryObserverOptions,
  QueryStatus,
} from '@tanstack/query-core'

// Re-exported for convenience so consumers can type filter arguments without a
// direct `@tanstack/query-core` import.
export type { QueryFilters, MutationFilters } from '@tanstack/query-core'
import { $queryClient } from '@effector-tanstack-query/core'
import type {
  InfiniteQueryResult,
  MutationResult,
  MutationStatus,
  QueriesResult,
  QueryResult,
} from '@effector-tanstack-query/core'
import {
  readRow,
  storeRow,
  trackedResult,
  useStoreRows,
  useTrackedRows,
  watchStores,
} from './tracked'
import type { ResultHookOptions, Row, StoreRow } from './tracked'

export type { NotifyOnChangeProps, ResultHookOptions } from './tracked'

const QUERY_FIELDS = [
  'data',
  'error',
  'status',
  'isPending',
  'isFetching',
  'isSuccess',
  'isError',
  'isPlaceholderData',
  'fetchStatus',
] as const

const INFINITE_QUERY_FIELDS = [
  ...QUERY_FIELDS,
  'hasNextPage',
  'hasPreviousPage',
  'isFetchingNextPage',
  'isFetchingPreviousPage',
  'isFetchNextPageError',
  'isFetchPreviousPageError',
] as const

const MUTATION_FIELDS = [
  'data',
  'error',
  'status',
  'variables',
  'isPaused',
  'isPending',
  'isSuccess',
  'isError',
  'isIdle',
] as const

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
 *
 * Re-renders only when a result field the component read changes — see
 * {@link ResultHookOptions} to re-render on every field instead.
 */
export function useQuery<TData, TError = Error>(
  query: QueryResult<TData, TError>,
  options?: ResultHookOptions,
): UseQueryResult<TData, TError> {
  const { snapshot, track } = useStoreRows(
    [storeRow(query, QUERY_FIELDS)],
    options?.notifyOnChangeProps,
  )

  const mount = useUnit(query.mounted)
  const unmount = useUnit(query.unmounted)
  const refresh = useUnit(query.refresh)

  React.useEffect(() => {
    mount()
    return () => unmount()
  }, [mount, unmount])

  return trackedResult(
    QUERY_FIELDS,
    (field) => snapshot.rows[0]![field],
    (field) => track(0, field),
    { refresh },
  )
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
  options?: ResultHookOptions,
): UseMutationResult<TData, TError, TVariables> {
  const { snapshot, track } = useStoreRows(
    [storeRow(mutation, MUTATION_FIELDS)],
    options?.notifyOnChangeProps,
  )

  const start = useUnit(mutation.start)
  const unmount = useUnit(mutation.unmounted)
  const mutate = useUnit(mutation.mutate)
  const mutateWith = useUnit(mutation.mutateWith)
  const reset = useUnit(mutation.reset)

  React.useEffect(() => {
    start()
    return () => unmount()
  }, [start, unmount])

  return trackedResult(
    MUTATION_FIELDS,
    (field) => snapshot.rows[0]![field],
    (field) => track(0, field),
    { mutate, mutateWith, reset },
  )
}

// =============================================================================
// useIsFetching / useIsMutating — global in-flight counters for the scope's
// QueryClient. Thin React-subscription wrappers over the QueryClient's own
// `isFetching()` / `isMutating()` — the counting is done by tanstack, not here.
// =============================================================================

/**
 * Number of queries currently fetching in the scope's `QueryClient`. Use for
 * global indicators — top-bar spinners, tray badges, etc.
 *
 * Pass `QueryFilters` to scope the count (e.g. `{ queryKey: ['user'] }`).
 * Filters are applied by value on every notification, so passing a fresh
 * object literal each render is fine — no `useMemo` needed.
 *
 * Resolves the client via `useUnit($queryClient)`, so each fork scope counts
 * its own in-flight queries. Returns `0` when no client is set (e.g. an
 * RSC/SSR pass with no scope client) instead of throwing.
 */
export function useIsFetching(filters?: QueryFilters): number {
  const qc = useUnit($queryClient)
  // Keep filters out of the subscribe dependency so a fresh literal each render
  // doesn't re-subscribe; getSnapshot reads the latest via the ref.
  const filtersRef = React.useRef(filters)
  filtersRef.current = filters

  return React.useSyncExternalStore(
    React.useCallback(
      (notify) => qc?.getQueryCache().subscribe(notify) ?? (() => {}),
      [qc],
    ),
    () => qc?.isFetching(filtersRef.current) ?? 0,
    () => 0,
  )
}

/**
 * Number of mutations currently running in the scope's `QueryClient`. Mirrors
 * {@link useIsFetching} for mutations.
 *
 * Pass `MutationFilters` to scope the count (e.g. `{ mutationKey: ['createUser'] }`).
 */
export function useIsMutating(filters?: MutationFilters): number {
  const qc = useUnit($queryClient)
  const filtersRef = React.useRef(filters)
  filtersRef.current = filters

  return React.useSyncExternalStore(
    React.useCallback(
      (notify) => qc?.getMutationCache().subscribe(notify) ?? (() => {}),
      [qc],
    ),
    () => qc?.isMutating(filtersRef.current) ?? 0,
    () => 0,
  )
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
  options?: ResultHookOptions,
): UseInfiniteQueryResult<TData, TError> {
  const { snapshot, track } = useStoreRows(
    [storeRow(query, INFINITE_QUERY_FIELDS)],
    options?.notifyOnChangeProps,
  )

  const mount = useUnit(query.mounted)
  const unmount = useUnit(query.unmounted)
  const refresh = useUnit(query.refresh)
  const fetchNextPage = useUnit(query.fetchNextPage)
  const fetchPreviousPage = useUnit(query.fetchPreviousPage)

  React.useEffect(() => {
    mount()
    return () => unmount()
  }, [mount, unmount])

  return trackedResult(
    INFINITE_QUERY_FIELDS,
    (field) => snapshot.rows[0]![field],
    (field) => track(0, field),
    { refresh, fetchNextPage, fetchPreviousPage },
  )
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

/**
 * Tracking is per item and per field: reading `results[0].data` re-renders
 * on that query's data only. A different tuple, or a family source adding
 * or removing items, always re-renders.
 */
export function useQueries<const T extends UseQueriesTuple>(
  queries: T,
  options?: ResultHookOptions,
): UseQueriesTupleResult<T>
export function useQueries<TItem, TData, TError>(
  family: QueriesResult<TItem, TData, TError>,
  options?: ResultHookOptions,
): ReadonlyArray<UseQueryResult<TData, TError>>
export function useQueries(
  arg: UseQueriesTuple | QueriesResult<unknown, unknown, unknown>,
  options?: ResultHookOptions,
): UseQueriesTupleResult<UseQueriesTuple> | ReadonlyArray<UseQueryResult<unknown, unknown>> {
  if (Array.isArray(arg)) {
    return useQueriesTuple(arg, options)
  }
  return useQueriesFamily(
    arg as QueriesResult<unknown, unknown, unknown>,
    options,
  )
}

function useQueriesTuple<T extends UseQueriesTuple>(
  queries: T,
  options: ResultHookOptions | undefined,
): UseQueriesTupleResult<T> {
  // One tracked subscription over every item's stores; the array may grow
  // or shrink between renders without changing the hook count.
  const { snapshot, track } = useStoreRows(
    queries.map((q) => storeRow(q, QUERY_FIELDS)),
    options?.notifyOnChangeProps,
  )

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

  return queries.map((_, i) =>
    trackedResult(
      QUERY_FIELDS,
      (field) => snapshot.rows[i]?.[field],
      (field) => track(i, field),
      { refresh: refreshes[i] },
    ),
  ) as UseQueriesTupleResult<T>
}

/** Family items are the rows; an item with a new source is a new entity. */
function useFamilyRows(
  family: QueriesResult<any, any, any>,
  mode: ResultHookOptions['notifyOnChangeProps'],
  always?: ReadonlyArray<string>,
) {
  const scope = useProvidedScope()
  return useTrackedRows({
    deps: [scope, family.$items],
    subscribe: (notify) => watchStores([family.$items], scope, notify),
    read: () => readRow({ items: family.$items }, scope).items as Row[],
    mode,
    always,
    sameRow: (a, b) => Object.is(a.source, b.source),
  })
}

function useQueriesFamily<TItem, TData, TError>(
  family: QueriesResult<TItem, TData, TError>,
  options: ResultHookOptions | undefined,
): ReadonlyArray<UseQueryResult<TData, TError>> {
  const { snapshot, track } = useFamilyRows(
    family,
    options?.notifyOnChangeProps,
  )
  const items = snapshot.rows as ReadonlyArray<Row & { source: TItem }>
  const mount = useUnit(family.mounted)
  const unmount = useUnit(family.unmounted)
  const refreshOne = useUnit(family.refreshOne)

  React.useEffect(() => {
    mount()
    return () => unmount()
  }, [mount, unmount])

  return items.map((it, i) =>
    trackedResult(
      QUERY_FIELDS,
      (field) => (snapshot.rows[i] ?? it)[field],
      (field) => track(i, field),
      // Per-item refresh — routes through the family's `refreshOne(item)`
      // so the consumer doesn't have to thread the source manually.
      { refresh: () => refreshOne(it.source) },
    ),
  )
}

// Suspense data path: read from a per-scope observer.
//
// The scope mount chain runs in useEffect, which is skipped while a component
// is suspended — so on the very first render the scope's `$observer` may be
// null. To get synchronous access to the observer's promise during suspense,
// we construct a transient observer via the factory's hidden
// `__createObserver(qc, options)` helper. The transient observer
// reads from / writes to the same queryClient cache as the eventual scope
// observer (which is created when mountFx runs after useEffect commits).
//
// The mount/unmount effect is still wired up so that other consumers reading
// the same query through `useUnit` / `useQuery` see updates in scope state.

interface RenderObserver {
  subscribe(cb: () => void): () => void
  getCurrentResult(): object
}

const SUSPENSE_FIELDS = [
  'data',
  'error',
  'status',
  'isSuccess',
  'isError',
  'isFetching',
  'isPlaceholderData',
  'fetchStatus',
] as const

const SUSPENSE_INFINITE_FIELDS = [
  ...SUSPENSE_FIELDS,
  'hasNextPage',
  'hasPreviousPage',
  'isFetchingNextPage',
  'isFetchingPreviousPage',
  'isFetchNextPageError',
  'isFetchPreviousPageError',
] as const

// The gate reads `status` to suspend or throw, so it always re-renders —
// whatever the component reads.
const SUSPENSE_GATE = ['status']

/**
 * Whether the Suspense gate throws a query's error to the boundary: only
 * when there is no data to keep showing — `@tanstack/react-query`'s
 * default. A failed refetch with data renders on, with `status: 'error'`.
 */
function throwsError(result: object): boolean {
  const { status, data } = result as { status?: unknown; data?: unknown }
  return status === 'error' && data === undefined
}

/** Past the gate: `error` is `null` unless the query is in error. */
function readSuspenseField(values: Row, field: string): unknown {
  return field === 'error' ? (values.error ?? null) : values[field]
}

/**
 * Tracked rows for the suspense hooks. A row comes from its observer when
 * there is one — the observer notifies as soon as the cache changes — and
 * from the scope's stores otherwise (server render of a serialized scope).
 */
function useSuspenseRows(
  stores: ReadonlyArray<StoreRow>,
  observers: ReadonlyArray<RenderObserver | null>,
  fields: ReadonlyArray<string>,
  mode: ResultHookOptions['notifyOnChangeProps'],
) {
  const scope = useProvidedScope()
  const storeList = stores.flatMap((row) => Object.values(row))
  return useTrackedRows({
    deps: [scope, ...observers, ...storeList],
    subscribe: (notify) => {
      const unsubscribes = observers.map((obs) => obs?.subscribe(notify))
      const unwatch = watchStores(storeList, scope, notify)
      return () => {
        unwatch()
        for (const unsubscribe of unsubscribes) unsubscribe?.()
      }
    },
    read: () =>
      stores.map((row, i) => {
        const obs = observers[i]
        if (!obs) return readRow(row, scope)
        const result = obs.getCurrentResult() as Row
        const picked: Row = {}
        for (const field of fields) picked[field] = result[field]
        return picked
      }),
    mode,
    always: SUSPENSE_GATE,
  })
}

/** Past the gate a query is never pending. */
const SUSPENSE_SETTLED = { isPending: false } as const

type SuspenseOptions = QueryObserverOptions<any, any, any, any, any>
interface SuspenseFactory<TObserver> {
  __createObserver(
    qc: QueryClient,
    options: SuspenseOptions,
  ): TObserver
  /** Current options, or the exception thrown by a factory's `query`. */
  __state: Store<
    | { options: SuspenseOptions; failure: null }
    | { options: null; failure: { error: unknown } }
  >
}

/**
 * Past the Suspense gate a query has data. It is either successful or its
 * latest refetch failed — the error is thrown to the boundary only when
 * there is no data to show. Narrow on `isError` / `status`.
 */
export type SuspenseResultStatus<TError> =
  | { status: 'success'; isSuccess: true; isError: false; error: null }
  | { status: 'error'; isSuccess: false; isError: true; error: TError }

export type UseSuspenseQueryResult<TData, TError = Error> =
  SuspenseResultStatus<TError> & {
    /** Resolved query data — non-nullable inside the rendered subtree
     * (Suspense absorbed the pending state). */
    data: TData
    isPending: false
    /** `true` while a background refetch is running. Use for refresh spinners. */
    isFetching: boolean
    isPlaceholderData: boolean
    fetchStatus: FetchStatus
    refresh: () => void
  }

// Next's protocol for "this subtree can't render on the server, hand it to the
// client": an Error whose `digest` is this exact string. Next's error handler
// checks only that field (`isBailoutToCSRError`), skips logging it, and keeps
// React's normal recovery — the `<Suspense>` fallback goes into the HTML and
// the boundary is re-rendered in the browser. It is what `next/dynamic` with
// `ssr: false` throws.
const BAILOUT_TO_CSR = 'BAILOUT_TO_CLIENT_SIDE_RENDERING'

/**
 * The suspense hooks' "no QueryClient anywhere, no prefetched data" case.
 *
 * There is no third option here: a hook can only return data or throw, and the
 * two things worth throwing both need a client (a fetch promise) or are what
 * we're doing (an error). A never-resolving promise is not an option — it
 * keeps the SSR stream open forever.
 *
 * On the **server** that is a legitimate setup: a query meant to run in the
 * browser only. Nothing is fetched here, and the bail-out digest makes the
 * hand-off explicit instead of an application error in the logs. Outside Next
 * the field is inert and the error behaves as before.
 *
 * On the **client** the same state is a real misconfiguration — nothing will
 * ever fetch — so it stays loud and explains the fix.
 */
function noQueryClientError(hook: string): Error {
  if (typeof window === 'undefined') {
    const error = new Error(
      `Bail out to client-side rendering: [@effector-tanstack-query/react] ${hook} has no QueryClient during the server render, so the query runs on the client. To render it on the server instead, prefetch it with prefetchQueries before serializing the scope.`,
    )
    ;(error as Error & { digest?: string }).digest = BAILOUT_TO_CSR
    return error
  }
  return new Error(
    `[@effector-tanstack-query/react] ${hook}: no QueryClient is set. Call setQueryClient(qc) or pass it to fork({ values: [[$queryClient, qc]] }).`,
  )
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
  options?: ResultHookOptions,
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

  // Store snapshot — always subscribed so hook order is fixed across renders.
  // The observer path doesn't read it; the store-only path (server-RSC of
  // a scope rehydrated from `serialize`, where `$observer` and
  // `$queryClient` are both `null` because they're `serialize: 'ignore'`)
  // reads everything from here.
  const { snapshot, track } = useSuspenseRows(
    [storeRow(query, SUSPENSE_FIELDS)],
    [observer],
    SUSPENSE_FIELDS,
    options?.notifyOnChangeProps,
  )

  // Observer path: `getOptimisticResult` reads from `QueryCache`
  // synchronously and reflects fetches/refetches the moment the observer
  // notifies. Used whenever we have an in-scope observer
  // (post-`mounted()`) or a transient one built from `$queryClient`.
  let values: Row
  if (observer) {
    const result = observer.getOptimisticResult(observer.options as any)

    if (throwsError(result)) throw result.error
    if (result.status === 'pending') {
      throw observer.fetchOptimistic(observer.options as any)
    }
    values = result as unknown as Row
  } else {
    // Store-only path: no observer materialisable. Trust `$status` —
    // populated by `prefetchQueries` before the scope was serialised. A
    // pending status here means there's no `QueryClient` and no prefetch
    // happened: can't deduplicate-throw a fetch promise, so surface the
    // misconfiguration as an error to `<ErrorBoundary>`.
    const state = snapshot.rows[0]!
    if (throwsError(state)) throw state.error
    if (state.status === 'pending') {
      throw noQueryClientError('useSuspenseQuery')
    }
    values = state
  }

  return trackedResult(
    SUSPENSE_FIELDS,
    (field) => readSuspenseField(values, field),
    (field) => track(0, field),
    { ...SUSPENSE_SETTLED, refresh },
  )
}

export type UseSuspenseInfiniteQueryResult<TData, TError = Error> =
  SuspenseResultStatus<TError> & {
  data: TData
  isPending: false
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
  options?: ResultHookOptions,
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

  // See `useSuspenseQuery` for the observer-vs-stores dual path rationale.
  // Infinite queries carry pagination fields in separate effector stores
  // (`$hasNextPage`, `$isFetchingNextPage`, …), so the store row has to
  // read those too.
  const { snapshot, track } = useSuspenseRows(
    [storeRow(query, SUSPENSE_INFINITE_FIELDS)],
    [observer],
    SUSPENSE_INFINITE_FIELDS,
    options?.notifyOnChangeProps,
  )

  let values: Row
  if (observer) {
    const obs = observer
    const result = obs.getOptimisticResult(obs.options as any)

    if (throwsError(result)) throw result.error
    if (result.status === 'pending') {
      throw (
        obs as unknown as {
          fetchOptimistic: (options: typeof obs.options) => Promise<unknown>
        }
      ).fetchOptimistic(obs.options)
    }
    values = result as unknown as Row
  } else {
    // Store-only path (server-RSC of a hydrated scope).
    const state = snapshot.rows[0]!
    if (throwsError(state)) throw state.error
    if (state.status === 'pending') {
      throw noQueryClientError('useSuspenseInfiniteQuery')
    }
    values = state
  }

  return trackedResult(
    SUSPENSE_INFINITE_FIELDS,
    (field) => readSuspenseField(values, field),
    (field) => track(0, field),
    { ...SUSPENSE_SETTLED, refresh, fetchNextPage, fetchPreviousPage },
  )
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
    $observer: Store<TObserver | null>
    $queryClient: Store<QueryClient | null>
  },
  TObserver extends {
    options: { queryKey: unknown }
    setOptions(options: any): void
    subscribe(cb: () => void): () => void
    getCurrentResult(): object
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
  const state = useUnit(factory.__state)

  // Effects cannot update a transient while rendering is suspended.
  // Recreate it from the current scoped options when that snapshot changes.
  const transient = React.useMemo(() => {
    if (observerInScope || !qc || state.failure) return null
    return factory.__createObserver(qc, state.options)
  }, [observerInScope, qc, factory, state])

  // A factory that threw for the current parameters fails the render for the
  // error boundary, like a throwing options factory does in react-query.
  if (state.failure) throw state.failure.error

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
  options?: ResultHookOptions,
): UseSuspenseQueriesTupleResult<T>
export function useSuspenseQueries<TItem, TData, TError>(
  family: QueriesResult<TItem, TData, TError>,
  options?: ResultHookOptions,
): ReadonlyArray<UseSuspenseQueryResult<TData, TError>>
export function useSuspenseQueries(
  arg: UseSuspenseQueriesTuple | QueriesResult<unknown, unknown, unknown>,
  options?: ResultHookOptions,
):
  | UseSuspenseQueriesTupleResult<UseSuspenseQueriesTuple>
  | ReadonlyArray<UseSuspenseQueryResult<unknown, unknown>> {
  if (Array.isArray(arg)) {
    return useSuspenseQueriesTuple(arg, options)
  }
  return useSuspenseQueriesFamily(
    arg as QueriesResult<unknown, unknown, unknown>,
    options,
  )
}

function useSuspenseQueriesTuple<T extends UseSuspenseQueriesTuple>(
  queries: T,
  options: ResultHookOptions | undefined,
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

  const observersInScope = useUnit(queries.map((q) => q.$observer))
  const qcs = useUnit(queries.map((q) => q.$queryClient))
  const states = useUnit(
    queries.map((q) => (q as unknown as SuspenseFactory<unknown>).__state),
  )
  // Keep hook count fixed; each transient uses its model's scoped options.
  const transients = React.useMemo(() => {
    return queries.map((q, i) => {
      if (observersInScope[i]) return null
      const qc = qcs[i]
      const state = states[i]!
      if (!qc || state.failure) return null
      return (q as unknown as SuspenseFactory<any>).__createObserver(
        qc,
        state.options,
      )
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [queries, ...observersInScope, ...qcs, ...states])

  // See useSuspenseObserver: a factory exception goes to the error boundary.
  const failed = states.find((state) => state.failure !== null)
  if (failed?.failure) throw failed.failure.error

  type SuspendableObserver = {
    options: { queryKey: unknown }
    subscribe(cb: () => void): () => void
    getCurrentResult(): object
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

  // One tracked subscription over every live observer plus the stores
  // (store-only slots on a serialized server scope).
  const { snapshot, track } = useSuspenseRows(
    queries.map((q) => storeRow(q, SUSPENSE_FIELDS)),
    observers,
    SUSPENSE_FIELDS,
    options?.notifyOnChangeProps,
  )
  const rows = snapshot.rows

  // Per-slot live result — from observer if available (synchronous
  // QueryCache read), otherwise null and we fall back to the
  // effector-store snapshot. Mirrors the dual path in
  // `useSuspenseQuery` so SSR scopes (`$observer` + `$queryClient`
  // both null) keep working.
  const liveResults = observers.map((obs) =>
    obs ? obs.getOptimisticResult(obs.options) : null,
  )

  // Errors without data first — first one wins. A query whose refetch failed
  // with data renders on (see `throwsError`).
  for (let i = 0; i < queries.length; i++) {
    const live = liveResults[i]
    if (live) {
      if (throwsError(live)) throw live.error
    } else if (throwsError(rows[i]!)) {
      throw rows[i]!.error
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
    } else if (rows[i]!.status === 'pending') {
      throw noQueryClientError('useSuspenseQueries')
    }
  }
  if (pendingPromises.length > 0) throw Promise.all(pendingPromises)

  // All success — shape the result tuple. Prefer the observer's live
  // result when present (reflects in-flight refetches), fall back to
  // the store snapshot otherwise.
  return queries.map((_, i) => {
    const values = (liveResults[i] ?? rows[i]!) as Row
    return trackedResult(
      SUSPENSE_FIELDS,
      (field) => readSuspenseField(values, field),
      (field) => track(i, field),
      { ...SUSPENSE_SETTLED, refresh: refreshes[i] },
    )
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
  options: ResultHookOptions | undefined,
): ReadonlyArray<UseSuspenseQueryResult<TData, TError>> {
  const mount = useUnit(family.mounted)
  const unmount = useUnit(family.unmounted)
  const refreshOne = useUnit(family.refreshOne)
  React.useEffect(() => {
    mount()
    return () => unmount()
  }, [mount, unmount])

  const { snapshot, track } = useFamilyRows(
    family,
    options?.notifyOnChangeProps,
    SUSPENSE_GATE,
  )
  const items = snapshot.rows as ReadonlyArray<Row & { source: TItem }>
  const qc = useUnit(family.$queryClient)

  // An error without data wins over pending.
  for (const it of items) {
    if (throwsError(it)) throw it.error
  }

  const pending = items.filter((it) => it.status === 'pending')
  if (pending.length > 0) {
    if (!qc) {
      throw noQueryClientError('useSuspenseQueries')
    }
    const queryFor = (family as unknown as FamilyInternals<TItem>).__queryFor
    throw Promise.all(
      pending.map((it) =>
        qc.fetchQuery(queryFor(it.source) as any).catch(() => undefined),
      ),
    )
  }

  return items.map((it, i) =>
    trackedResult(
      SUSPENSE_FIELDS,
      (field) => readSuspenseField(snapshot.rows[i] ?? it, field),
      (field) => track(i, field),
      { ...SUSPENSE_SETTLED, refresh: () => refreshOne(it.source) },
    ),
  )
}
