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

  const result = observer.getOptimisticResult(observer.options as any)

  if (result.status === 'error') throw result.error
  if (result.status === 'pending') {
    throw observer.fetchOptimistic(observer.options as any)
  }

  // Read all secondary fields from the observer result, not the effector
  // stores: stores are only populated after mountFx fires from useEffect,
  // which on the very first successful render hasn't run yet. The observer
  // result is always live and consistent.
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

  const result = observer.getOptimisticResult(observer.options as any)

  if (result.status === 'error') throw result.error
  if (result.status === 'pending') {
    throw (
      observer as unknown as {
        fetchOptimistic: (
          options: typeof observer.options,
        ) => Promise<unknown>
      }
    ).fetchOptimistic(observer.options)
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
>(query: TQuery): TObserver {
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

  const observer = observerInScope ?? transient
  if (!observer) {
    throw new Error(
      '[@effector-tanstack-query/react] useSuspenseQuery: no QueryClient is set. ' +
        'Call setQueryClient(qc) or pass it to fork({ values: [[$queryClient, qc]] }).',
    )
  }
  return observer
}
