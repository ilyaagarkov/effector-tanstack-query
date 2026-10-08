import { attach, createEvent, sample } from 'effector'
import { QueryObserver } from '@tanstack/query-core'
import type { QueryClient, QueryKey, DefaultError } from '@tanstack/query-core'
import { createBaseQuery, warnMissingName } from './createBaseQuery'
import { resolveQueryArguments, resolveQueryDefinition } from './resolve'
import type { ResolvedOptions } from './resolve'
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
        new QueryObserver<TQueryFnData, TError, TData>(qc, options),
    },
  )

  // Prefetch awaits cache loading without mounting an observer. Read the full
  // options snapshot through attach so factory closures use the current scope.
  // Unmounted result stores are initialized separately through mounted().
  const prefetch = createEvent<void>()
  const prefetchFx = attach({
    source: {
      qc: base.$queryClient,
      options: base.$options,
    },
    effect: ({ qc, options }) => {
      if (!qc || !options.enabled) return
      return qc.fetchQuery(definition.prefetch(options))
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
        definition.create(options),
      ),
  })
  Object.defineProperty(result, '__options', {
    enumerable: false,
    value: base.$options,
  })

  return result
}
