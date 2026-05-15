import { attach, createEvent, sample } from 'effector'
import { QueryObserver } from '@tanstack/query-core'
import type { QueryClient } from '@tanstack/query-core'
import { createBaseQuery, warnMissingName } from './createBaseQuery'
import { resolveReactiveRefetchInterval } from './resolve'
import type {
  CreateQueryOptions,
  EffectorQueryKey,
  QueryResult,
} from './types'

export function createQuery<
  TQueryFnData = unknown,
  TError = Error,
  TData = TQueryFnData,
  const TQueryKey extends EffectorQueryKey = EffectorQueryKey,
>(
  options: CreateQueryOptions<TQueryFnData, TError, TData, TQueryKey>,
): QueryResult<TData, TError>
export function createQuery<
  TQueryFnData = unknown,
  TError = Error,
  TData = TQueryFnData,
  const TQueryKey extends EffectorQueryKey = EffectorQueryKey,
>(
  queryClient: QueryClient,
  options: CreateQueryOptions<TQueryFnData, TError, TData, TQueryKey>,
): QueryResult<TData, TError>
export function createQuery<
  TQueryFnData = unknown,
  TError = Error,
  TData = TQueryFnData,
  const TQueryKey extends EffectorQueryKey = EffectorQueryKey,
>(
  arg1:
    | QueryClient
    | CreateQueryOptions<TQueryFnData, TError, TData, TQueryKey>,
  arg2?: CreateQueryOptions<TQueryFnData, TError, TData, TQueryKey>,
): QueryResult<TData, TError> {
  const [explicitClient, options] = parseQueryArgs<
    TQueryFnData,
    TError,
    TData,
    TQueryKey
  >(arg1, arg2)
  const { queryKey, enabled, name, ...restOptions } = options

  if (!name) warnMissingName('createQuery')

  // If `refetchInterval` is a Store, pull it out for reactive wiring in
  // createBaseQuery — otherwise leave it in restOptions for the observer
  // constructor (handles plain values and function forms unchanged).
  const reactiveRefetchInterval = resolveReactiveRefetchInterval(
    (restOptions as { refetchInterval?: unknown }).refetchInterval,
  )
  if (reactiveRefetchInterval) {
    delete (restOptions as { refetchInterval?: unknown }).refetchInterval
  }

  const base = createBaseQuery<
    TData,
    TError,
    ReturnType<QueryObserver<TQueryFnData, TError, TData>['getCurrentResult']>,
    QueryObserver<TQueryFnData, TError, TData>
  >(
    explicitClient,
    { queryKey, enabled, name, reactiveRefetchInterval },
    {
      createObserver: (qc, { queryKey: key, enabled: isEnabled }) =>
        // Cast: restOptions's `refetchInterval` may still type as
        // `Store | number | false | fn`; the Store form is deleted at runtime
        // above, but TS can't narrow that here.
        new QueryObserver<TQueryFnData, TError, TData>(qc, {
          ...restOptions,
          queryKey: key,
          enabled: isEnabled,
        } as any),
    },
  )

  // Prefetch event: drives `queryClient.fetchQuery` directly (no Observer)
  // and **awaits** the result, so `allSettled(query.prefetch, { scope })` on
  // the server returns only after the cache has the data. Unlike `mounted`,
  // which kicks off a background subscription and resolves immediately, this
  // is the right primitive for SSR / route loaders. The current resolved key
  // + enabled is read from the scope via attach — reactive keys work.
  const prefetch = createEvent<void>()
  const prefetchFx = attach({
    source: {
      qc: base.$queryClient,
      key: base.$resolvedKey,
      enabled: base.$enabled,
    },
    effect: ({ qc, key, enabled }) => {
      if (!qc || !enabled) return
      return qc.fetchQuery({
        ...restOptions,
        queryKey: key,
      } as any)
    },
  })
  sample({ clock: prefetch, target: prefetchFx })

  // Lazy `observer` field for backward compatibility — returns the
  // default-scope observer (non-fork). Tests and advanced consumers that read
  // `query.observer` after `query.mounted()` see the live observer. For
  // fork-aware consumers, use `query.$observer` via `useUnit`.
  const result: QueryResult<TData, TError> = {
    $data: base.$data,
    $error: base.$error,
    $status: base.$status,
    $isPending: base.$isPending,
    $isFetching: base.$isFetching,
    $isSuccess: base.$isSuccess,
    $isError: base.$isError,
    $isPlaceholderData: base.$isPlaceholderData,
    $fetchStatus: base.$fetchStatus,
    $observer: base.$observer as unknown as QueryResult<
      TData,
      TError
    >['$observer'],
    $queryClient: base.$queryClient,
    refresh: base.refresh,
    prefetch,
    mounted: base.mounted,
    unmounted: base.unmounted,
  }

  // Internal: used by useSuspenseQuery to construct a transient observer
  // when the suspense hook renders before mountFx has populated the scope's
  // $observer (mountFx runs from useEffect, which is skipped while
  // suspended). Not part of the public API; not in TS types.
  Object.defineProperty(result, '__createObserver', {
    enumerable: false,
    value: (qc: QueryClient, init: { queryKey: any; enabled: boolean }) =>
      new QueryObserver<TQueryFnData, TError, TData>(qc, {
        ...restOptions,
        queryKey: init.queryKey,
        enabled: init.enabled,
      } as any),
  })
  Object.defineProperty(result, '__resolvedKey', {
    enumerable: false,
    value: base.$resolvedKey,
  })
  Object.defineProperty(result, '__enabled', {
    enumerable: false,
    value: base.$enabled,
  })

  return result
}

function parseQueryArgs<
  TQueryFnData,
  TError,
  TData,
  TQueryKey extends EffectorQueryKey,
>(
  arg1:
    | QueryClient
    | CreateQueryOptions<TQueryFnData, TError, TData, TQueryKey>,
  arg2?: CreateQueryOptions<TQueryFnData, TError, TData, TQueryKey>,
): [
  QueryClient | null,
  CreateQueryOptions<TQueryFnData, TError, TData, TQueryKey>,
] {
  if (arg2 !== undefined) {
    return [arg1 as QueryClient, arg2]
  }
  return [
    null,
    arg1 as CreateQueryOptions<TQueryFnData, TError, TData, TQueryKey>,
  ]
}
