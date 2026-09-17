import { combine, is } from 'effector'
import type { Store } from 'effector'
import type {
  QueryClient,
  QueryKey,
  QueryObserverOptions,
} from '@tanstack/query-core'
import { warnMissingName } from './createBaseQuery'
import { createQueryFromObserverOptions } from './createQuery'
import { resolveEnabled } from './resolve'
import type {
  CreateQueryFromOptionsOptions,
  QueryOptionsSource,
  QueryOptionsSourceValue,
  QueryResult,
} from './types'

export function createQueryFromOptions<
  const TSource extends QueryOptionsSource,
  TQueryFnData = unknown,
  TError = Error,
  TData = TQueryFnData,
  const TQueryKey extends QueryKey = QueryKey,
>(
  options: CreateQueryFromOptionsOptions<
    TSource,
    TQueryFnData,
    TError,
    TData,
    TQueryKey
  >,
): QueryResult<TData, TError>
export function createQueryFromOptions<
  const TSource extends QueryOptionsSource,
  TQueryFnData = unknown,
  TError = Error,
  TData = TQueryFnData,
  const TQueryKey extends QueryKey = QueryKey,
>(
  queryClient: QueryClient,
  options: CreateQueryFromOptionsOptions<
    TSource,
    TQueryFnData,
    TError,
    TData,
    TQueryKey
  >,
): QueryResult<TData, TError>
export function createQueryFromOptions<
  const TSource extends QueryOptionsSource,
  TQueryFnData = unknown,
  TError = Error,
  TData = TQueryFnData,
  const TQueryKey extends QueryKey = QueryKey,
>(
  arg1:
    | QueryClient
    | CreateQueryFromOptionsOptions<
        TSource,
        TQueryFnData,
        TError,
        TData,
        TQueryKey
      >,
  arg2?: CreateQueryFromOptionsOptions<
    TSource,
    TQueryFnData,
    TError,
    TData,
    TQueryKey
  >,
): QueryResult<TData, TError> {
  const [explicitClient, options] = parseArgs(arg1, arg2)
  const { name, source, queryOptions, enabled } = options

  if (!name) warnMissingName('createQueryFromOptions')

  const $source = resolveSource(source)
  const $consumerEnabled = resolveEnabled(enabled)
  const $observerOptions = combine(
    { source: $source, consumerEnabled: $consumerEnabled },
    ({ source: resolvedSource, consumerEnabled }) => {
      const factoryOptions = queryOptions(resolvedSource)
      return {
        ...factoryOptions,
        enabled: consumerEnabled ? factoryOptions.enabled : false,
      }
    },
  ) as Store<
    QueryObserverOptions<
      TQueryFnData,
      TError,
      TData,
      TQueryFnData,
      TQueryKey
    >
  >

  return createQueryFromObserverOptions(
    explicitClient,
    name,
    $observerOptions,
  )
}

function resolveSource<TSource extends QueryOptionsSource>(
  source: TSource,
): Store<QueryOptionsSourceValue<TSource>> {
  return (is.store(source) ? source : combine(source)) as Store<
    QueryOptionsSourceValue<TSource>
  >
}

function parseArgs<
  TSource extends QueryOptionsSource,
  TQueryFnData,
  TError,
  TData,
  TQueryKey extends QueryKey,
>(
  arg1:
    | QueryClient
    | CreateQueryFromOptionsOptions<
        TSource,
        TQueryFnData,
        TError,
        TData,
        TQueryKey
      >,
  arg2?: CreateQueryFromOptionsOptions<
    TSource,
    TQueryFnData,
    TError,
    TData,
    TQueryKey
  >,
): [
  QueryClient | null,
  CreateQueryFromOptionsOptions<
    TSource,
    TQueryFnData,
    TError,
    TData,
    TQueryKey
  >,
] {
  if (arg2 !== undefined) {
    return [arg1 as QueryClient, arg2]
  }
  return [
    null,
    arg1 as CreateQueryFromOptionsOptions<
      TSource,
      TQueryFnData,
      TError,
      TData,
      TQueryKey
    >,
  ]
}
