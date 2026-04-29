import * as React from 'react'
import { useUnit } from 'effector-react'
import type { FetchStatus, QueryStatus } from '@tanstack/query-core'
import type {
  InfiniteQueryResult,
  MutationResult,
  MutationStatus,
  QueryResult,
} from '@effector-tanstack-query/core'

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
  const reset = useUnit(mutation.reset)

  React.useEffect(() => {
    start()
    return () => unmount()
  }, [start, unmount])

  return { ...state, mutate, reset }
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

// Suspense data path: read from the observer directly (queryClient-backed)
// instead of through the effector scope. The scope mount chain runs in
// useEffect, which is skipped while a component is suspended — so on the very
// first render we need synchronous access to the observer's promise. The
// mount/unmount effect is still wired up so that other consumers reading the
// same query through `useUnit` / `useQuery` see updates in scope state.

// Subscribe to observer notifications via a forced re-render. observer.subscribe
// must run in useEffect (post-commit), so we rely on getOptimisticResult — which
// reads queryClient cache directly — to surface freshly-fetched data on the
// re-render that follows a Suspense resolution (where useEffect hasn't run yet).
function useObserverRerender(
  observer: { subscribe: (cb: () => void) => () => void },
): void {
  const [, forceRender] = React.useReducer((x: number) => x + 1, 0)
  React.useEffect(() => {
    return observer.subscribe(forceRender)
  }, [observer])
}

/**
 * Reads a query for use inside a `<Suspense>` boundary. While the query is
 * pending, throws an inflight promise (queryClient-deduplicated). On error,
 * throws the error — catch with `<ErrorBoundary>`. Returns resolved data.
 */
export function useSuspenseQuery<TData, TError = Error>(
  query: QueryResult<TData, TError>,
): TData {
  const { observer } = query

  // Auto-mount lifecycle so concurrent consumers (useUnit / useQuery) reading
  // the same query through the effector scope stay in sync.
  const mount = useUnit(query.mounted)
  const unmount = useUnit(query.unmounted)
  React.useEffect(() => {
    mount()
    return () => unmount()
  }, [mount, unmount])

  useObserverRerender(observer)

  const result = observer.getOptimisticResult(observer.options as any)

  if (result.status === 'error') throw result.error
  if (result.status === 'pending') {
    throw observer.fetchOptimistic(observer.options as any)
  }

  return result.data as TData
}

/**
 * Suspense variant of {@link useInfiniteQuery}. Throws the inflight promise
 * during pending and the error during failure; otherwise returns the
 * `InfiniteData` directly.
 */
export function useSuspenseInfiniteQuery<
  TData,
  TError = Error,
  TPageParam = unknown,
>(
  query: InfiniteQueryResult<TData, TError, TPageParam>,
): TData {
  const { observer } = query

  const mount = useUnit(query.mounted)
  const unmount = useUnit(query.unmounted)
  React.useEffect(() => {
    mount()
    return () => unmount()
  }, [mount, unmount])

  useObserverRerender(observer)

  const result = observer.getOptimisticResult(observer.options as any)

  if (result.status === 'error') throw result.error
  if (result.status === 'pending') {
    throw (observer as unknown as {
      fetchOptimistic: (
        options: typeof observer.options,
      ) => Promise<unknown>
    }).fetchOptimistic(observer.options)
  }

  return result.data as TData
}
