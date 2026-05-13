import { QueryObserver } from '@tanstack/query-core'
import type { QueryClient } from '@tanstack/query-core'
import { createBaseQuery, warnMissingName } from './createBaseQuery'
import type { CreateQueryOptions, QueryResult } from './types'

export function createQuery<
  TQueryFnData = unknown,
  TError = Error,
  TData = TQueryFnData,
>(
  options: CreateQueryOptions<TQueryFnData, TError, TData>,
): QueryResult<TData, TError>
export function createQuery<
  TQueryFnData = unknown,
  TError = Error,
  TData = TQueryFnData,
>(
  queryClient: QueryClient,
  options: CreateQueryOptions<TQueryFnData, TError, TData>,
): QueryResult<TData, TError>
export function createQuery<
  TQueryFnData = unknown,
  TError = Error,
  TData = TQueryFnData,
>(
  arg1:
    | QueryClient
    | CreateQueryOptions<TQueryFnData, TError, TData>,
  arg2?: CreateQueryOptions<TQueryFnData, TError, TData>,
): QueryResult<TData, TError> {
  const [explicitClient, options] = parseQueryArgs<TQueryFnData, TError, TData>(
    arg1,
    arg2,
  )
  const { queryKey, enabled, name, ...restOptions } = options

  if (!name) warnMissingName('createQuery')

  const base = createBaseQuery<
    TData,
    TError,
    ReturnType<QueryObserver<TQueryFnData, TError, TData>['getCurrentResult']>,
    QueryObserver<TQueryFnData, TError, TData>
  >(
    explicitClient,
    { queryKey, enabled, name },
    {
      createObserver: (qc, { queryKey: key, enabled: isEnabled }) =>
        new QueryObserver<TQueryFnData, TError, TData>(qc, {
          ...restOptions,
          queryKey: key,
          enabled: isEnabled,
        }),
    },
  )

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

function parseQueryArgs<TQueryFnData, TError, TData>(
  arg1:
    | QueryClient
    | CreateQueryOptions<TQueryFnData, TError, TData>,
  arg2?: CreateQueryOptions<TQueryFnData, TError, TData>,
): [QueryClient | null, CreateQueryOptions<TQueryFnData, TError, TData>] {
  if (arg2 !== undefined) {
    return [arg1 as QueryClient, arg2]
  }
  return [null, arg1 as CreateQueryOptions<TQueryFnData, TError, TData>]
}
