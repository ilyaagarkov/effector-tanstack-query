import { attach, createEvent, sample } from 'effector'
import { QueryObserver } from '@tanstack/query-core'
import type {
  DefaultError,
  QueryClient,
  QueryKey,
  QueryObserverOptions,
} from '@tanstack/query-core'
import { createBaseQuery, warnMissingName } from './createBaseQuery'
import {
  isEnabledFor,
  resolveQueryArguments,
  resolveQueryDefinition,
} from './resolve'
import type { ResolvedOptions } from './resolve'

// Resolved options may carry a callback `enabled`, which Query Core 5.0's
// observer options don't type (its observers treat any value but false as
// enabled). The adapter evaluates the callback itself where it needs to.
function toObserverOptions<TQueryFnData, TError, TData>(
  options: ResolvedOptions,
): QueryObserverOptions<TQueryFnData, TError, TData> {
  return options as unknown as QueryObserverOptions<TQueryFnData, TError, TData>
}
import type {
  CreateQueryOptions,
  CreateQueryFactoryOptions,
  OptionsSource,
  QueryArguments,
  EffectorQueryKey,
  QueryResult,
} from './types'

export function createQuery<
  TQueryFnData = unknown,
  TError = DefaultError,
  TData = TQueryFnData,
  const TQueryKey extends QueryKey = QueryKey,
  TSource extends OptionsSource = OptionsSource,
>(
  ...args: QueryArguments<
    CreateQueryFactoryOptions<TSource, TQueryFnData, TError, TData, TQueryKey>
  >
): QueryResult<TData, TError>
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
  ...args: QueryArguments<
    | CreateQueryOptions<TQueryFnData, TError, TData, TQueryKey>
    | CreateQueryFactoryOptions<any, TQueryFnData, TError, TData, any>
  >
): QueryResult<TData, TError> {
  const [explicitClient, options] = resolveQueryArguments(args)
  const { name } = options
  if (!name) warnMissingName('createQuery')
  const definition = resolveQueryDefinition(options)

  const base = createBaseQuery<
    TData,
    TError,
    ReturnType<QueryObserver<TQueryFnData, TError, TData>['getCurrentResult']>,
    QueryObserver<TQueryFnData, TError, TData>
  >(
    explicitClient,
    { definition, name },
    {
      createObserver: (qc, options) =>
        new QueryObserver<TQueryFnData, TError, TData>(
          qc,
          toObserverOptions(options),
        ),
    },
  )

  // Prefetch awaits cache loading without mounting an observer. Read the full
  // options snapshot through attach so factory closures use the current scope.
  // Unmounted result stores are initialized separately through mounted().
  const prefetch = createEvent<void>()
  const prefetchFx = attach({
    source: {
      qc: base.$queryClient,
      state: base.$state,
    },
    effect: ({ qc, state }) => {
      if (!qc) return
      // A factory that threw has no options to fetch: fail this prefetch
      // with its error instead of skipping silently.
      if (state.failure) throw state.failure.error
      if (!isEnabledFor(qc, state.options)) return
      return qc.fetchQuery(definition.prefetch(state.options))
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

  // Internal: used by useSuspenseQuery to construct a transient observer
  // when the suspense hook renders before mountFx has populated the scope's
  // $observer (mountFx runs from useEffect, which is skipped while
  // suspended). Not part of the public API; not in TS types.
  Object.defineProperty(result, '__createObserver', {
    enumerable: false,
    value: (qc: QueryClient, options: ResolvedOptions) =>
      new QueryObserver<TQueryFnData, TError, TData>(
        qc,
        toObserverOptions(definition.create(options)),
      ),
  })
  Object.defineProperty(result, '__options', {
    enumerable: false,
    value: base.$options,
  })
  // Internal: options or the factory failure, so Suspense can throw it.
  Object.defineProperty(result, '__state', {
    enumerable: false,
    value: base.$state,
  })

  return result
}
