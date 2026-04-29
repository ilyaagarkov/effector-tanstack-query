import { QueryObserver } from '@tanstack/query-core'
import type { QueryClient } from '@tanstack/query-core'
import { createBaseQuery, warnMissingName } from './createBaseQuery'
import type { CreateQueryOptions, QueryResult } from './types'

export function createQuery<
  TQueryFnData = unknown,
  TError = Error,
  TData = TQueryFnData,
>(
  queryClient: QueryClient,
  options: CreateQueryOptions<TQueryFnData, TError, TData>,
): QueryResult<TData, TError> {
  const { queryKey, enabled, name, ...restOptions } = options

  if (!name) warnMissingName('createQuery')

  const {
    $data,
    $error,
    $status,
    $isPending,
    $isFetching,
    $isSuccess,
    $isError,
    $isPlaceholderData,
    $fetchStatus,
    refresh,
    mounted,
    unmounted,
    observer,
  } = createBaseQuery<
    TData,
    TError,
    ReturnType<QueryObserver<TQueryFnData, TError, TData>['getCurrentResult']>,
    QueryObserver<TQueryFnData, TError, TData>
  >(
    queryClient,
    { queryKey, enabled, name },
    {
      createObserver: ({ queryKey: key, enabled: isEnabled }) =>
        new QueryObserver<TQueryFnData, TError, TData>(queryClient, {
          ...restOptions,
          queryKey: key,
          enabled: isEnabled,
        }),
    },
  )

  return {
    $data,
    $error,
    $status,
    $isPending,
    $isFetching,
    $isSuccess,
    $isError,
    $isPlaceholderData,
    $fetchStatus,
    refresh,
    mounted,
    unmounted,
    observer: observer as unknown as QueryObserver<TData, TError>,
  }
}
