import { attach, combine, createEvent, createStore, sample } from 'effector'
import type { Store } from 'effector'
import { QueryObserver } from '@tanstack/query-core'
import type {
  QueryClient,
  QueryKey,
  QueryObserverOptions,
} from '@tanstack/query-core'
import { createBaseQuery, warnMissingName } from './createBaseQuery'
import {
  resolveEnabled,
  resolveKey,
  resolveReactiveRefetchInterval,
} from './resolve'
import type {
  CreateQueryOptions,
  EffectorQueryKey,
  QueryResult,
  ResolvedQueryKey,
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

  const $resolvedKey = resolveKey(queryKey)
  const $enabled = resolveEnabled(enabled)
  const $refetchInterval =
    reactiveRefetchInterval ??
    createStore<number | false | undefined>(undefined, { skipVoid: false })
  const $observerOptions = combine(
    {
      queryKey: $resolvedKey,
      enabled: $enabled,
      refetchInterval: $refetchInterval,
    },
    ({ queryKey: key, enabled: isEnabled, refetchInterval }) =>
      ({
        ...restOptions,
        queryKey: key,
        enabled: isEnabled,
        ...(reactiveRefetchInterval ? { refetchInterval } : {}),
      }) as QueryObserverOptions<
        TQueryFnData,
        TError,
        TData,
        TQueryFnData,
        ResolvedQueryKey<TQueryKey>
      >,
  )

  return createQueryFromObserverOptions(
    explicitClient,
    name,
    $observerOptions,
  )
}

/** Internal seam shared by static and factory-based query definitions. */
export function createQueryFromObserverOptions<
  TQueryFnData,
  TError,
  TData,
  TQueryKey extends QueryKey,
>(
  explicitClient: QueryClient | null,
  name: string | undefined,
  $observerOptions: Store<
    QueryObserverOptions<
      TQueryFnData,
      TError,
      TData,
      TQueryFnData,
      TQueryKey
    >
  >,
): QueryResult<TData, TError> {
  const base = createBaseQuery<
    TData,
    TError,
    ReturnType<
      QueryObserver<
        TQueryFnData,
        TError,
        TData,
        TQueryFnData,
        TQueryKey
      >['getCurrentResult']
    >,
    QueryObserver<TQueryFnData, TError, TData, TQueryFnData, TQueryKey>
  >(
    explicitClient,
    { name, observerOptions: $observerOptions },
    {
      createObserver: (qc, { observerOptions }) =>
        new QueryObserver<
          TQueryFnData,
          TError,
          TData,
          TQueryFnData,
          TQueryKey
        >(qc, observerOptions as any),
      applyObserverOptions: (observer, observerOptions) => {
        observer.setOptions(observerOptions as any)
      },
    },
  )

  // Prefetch event: drives `queryClient.fetchQuery` directly (no Observer)
  // and **awaits** the result, so `allSettled(query.prefetch, { scope })` on
  // the server returns only after the cache has the data. Unlike `mounted`,
  // which kicks off a background subscription and resolves immediately, this
  // is the right primitive for SSR / route loaders. The current observer
  // options are read from the scope via attach — reactive factories work too.
  const prefetch = createEvent<void>()
  const prefetchFx = attach({
    source: {
      qc: base.$queryClient,
      observerOptions: $observerOptions,
    },
    effect: ({ qc, observerOptions }) => {
      if (!qc || observerOptions.enabled === false) return
      return qc.fetchQuery(observerOptions as any)
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
    finished: base.finished,
  }

  // Internals used by useSuspenseQuery to construct a transient observer
  // before mountFx has populated the scope's $observer. The complete-options
  // pair supports factory-based queries; the key/enabled pair remains as a
  // compatibility path for older query flavors. Not part of the public API.
  Object.defineProperty(result, '__createObserver', {
    enumerable: false,
    value: (qc: QueryClient, init: { queryKey: any; enabled: boolean }) =>
      new QueryObserver<TQueryFnData, TError, TData>(qc, {
        ...$observerOptions.getState(),
        queryKey: init.queryKey,
        enabled: init.enabled,
      } as any),
  })
  Object.defineProperty(result, '__createObserverFromOptions', {
    enumerable: false,
    value: (qc: QueryClient, observerOptions: unknown) =>
      new QueryObserver<TQueryFnData, TError, TData>(qc, observerOptions as any),
  })
  Object.defineProperty(result, '__observerOptions', {
    enumerable: false,
    value: $observerOptions,
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
