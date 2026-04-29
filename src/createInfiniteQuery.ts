import { createEffect, createEvent, createStore, sample, scopeBind } from 'effector'
import { InfiniteQueryObserver } from '@tanstack/query-core'
import type {
  InfiniteData,
  QueryClient,
  QueryKey,
} from '@tanstack/query-core'
import { createBaseQuery, sidConfig, warnMissingName } from './createBaseQuery'
import type { CreateInfiniteQueryOptions, InfiniteQueryResult } from './types'

type Observer<TQueryFnData, TError, TData, TPageParam> = InfiniteQueryObserver<
  TQueryFnData,
  TError,
  TData,
  QueryKey,
  TPageParam
>

type ObserverResult<TQueryFnData, TError, TData, TPageParam> = ReturnType<
  Observer<TQueryFnData, TError, TData, TPageParam>['getCurrentResult']
>

export function createInfiniteQuery<
  TQueryFnData = unknown,
  TError = Error,
  TPageParam = unknown,
  TData = InfiniteData<TQueryFnData, TPageParam>,
>(
  queryClient: QueryClient,
  options: CreateInfiniteQueryOptions<TQueryFnData, TError, TPageParam, TData>,
): InfiniteQueryResult<TData, TError, TPageParam> {
  const { queryKey, enabled, name, ...restOptions } = options

  if (!name) warnMissingName('createInfiniteQuery')

  const base = createBaseQuery<
    TData,
    TError,
    ObserverResult<TQueryFnData, TError, TData, TPageParam>,
    Observer<TQueryFnData, TError, TData, TPageParam>,
    {
      $hasNextPage: ReturnType<typeof createStore<boolean>>
      $hasPreviousPage: ReturnType<typeof createStore<boolean>>
      $isFetchingNextPage: ReturnType<typeof createStore<boolean>>
      $isFetchingPreviousPage: ReturnType<typeof createStore<boolean>>
      $isFetchNextPageError: ReturnType<typeof createStore<boolean>>
      $isFetchPreviousPageError: ReturnType<typeof createStore<boolean>>
      fetchNextPage: ReturnType<typeof createEvent<void>>
      fetchPreviousPage: ReturnType<typeof createEvent<void>>
    }
  >(
    queryClient,
    { queryKey, enabled, name },
    {
      createObserver: ({ queryKey: key, enabled: isEnabled }) =>
        new InfiniteQueryObserver<
          TQueryFnData,
          TError,
          TData,
          QueryKey,
          TPageParam
        >(queryClient, {
          ...restOptions,
          queryKey: key,
          enabled: isEnabled,
        } as any),
      setupExtras: (observer) => {
        const hasNextPageUpdated = createEvent<boolean>()
        const hasPreviousPageUpdated = createEvent<boolean>()
        const isFetchingNextPageUpdated = createEvent<boolean>()
        const isFetchingPreviousPageUpdated = createEvent<boolean>()
        const isFetchNextPageErrorUpdated = createEvent<boolean>()
        const isFetchPreviousPageErrorUpdated = createEvent<boolean>()

        const $hasNextPage = createStore(false, {
          ...sidConfig(name, '$hasNextPage'),
        }).on(hasNextPageUpdated, (_, v) => v)
        const $hasPreviousPage = createStore(false, {
          ...sidConfig(name, '$hasPreviousPage'),
        }).on(hasPreviousPageUpdated, (_, v) => v)
        const $isFetchingNextPage = createStore(false, {
          ...sidConfig(name, '$isFetchingNextPage'),
        }).on(isFetchingNextPageUpdated, (_, v) => v)
        const $isFetchingPreviousPage = createStore(false, {
          ...sidConfig(name, '$isFetchingPreviousPage'),
        }).on(isFetchingPreviousPageUpdated, (_, v) => v)
        const $isFetchNextPageError = createStore(false, {
          ...sidConfig(name, '$isFetchNextPageError'),
        }).on(isFetchNextPageErrorUpdated, (_, v) => v)
        const $isFetchPreviousPageError = createStore(false, {
          ...sidConfig(name, '$isFetchPreviousPageError'),
        }).on(isFetchPreviousPageErrorUpdated, (_, v) => v)

        const fetchNextPage = createEvent<void>()
        const fetchNextPageFx = createEffect(() => {
          observer.fetchNextPage()
        })
        sample({ clock: fetchNextPage, target: fetchNextPageFx })

        const fetchPreviousPage = createEvent<void>()
        const fetchPreviousPageFx = createEffect(() => {
          observer.fetchPreviousPage()
        })
        sample({ clock: fetchPreviousPage, target: fetchPreviousPageFx })

        return {
          stores: {
            $hasNextPage,
            $hasPreviousPage,
            $isFetchingNextPage,
            $isFetchingPreviousPage,
            $isFetchNextPageError,
            $isFetchPreviousPageError,
            fetchNextPage,
            fetchPreviousPage,
          },
          bindDispatcher: () => {
            const dispatchHasNextPage = scopeBind(hasNextPageUpdated, {
              safe: true,
            })
            const dispatchHasPreviousPage = scopeBind(hasPreviousPageUpdated, {
              safe: true,
            })
            const dispatchIsFetchingNextPage = scopeBind(
              isFetchingNextPageUpdated,
              { safe: true },
            )
            const dispatchIsFetchingPreviousPage = scopeBind(
              isFetchingPreviousPageUpdated,
              { safe: true },
            )
            const dispatchIsFetchNextPageError = scopeBind(
              isFetchNextPageErrorUpdated,
              { safe: true },
            )
            const dispatchIsFetchPreviousPageError = scopeBind(
              isFetchPreviousPageErrorUpdated,
              { safe: true },
            )

            return (result) => {
              dispatchHasNextPage(result.hasNextPage)
              dispatchHasPreviousPage(result.hasPreviousPage)
              dispatchIsFetchingNextPage(result.isFetchingNextPage)
              dispatchIsFetchingPreviousPage(result.isFetchingPreviousPage)
              dispatchIsFetchNextPageError(result.isFetchNextPageError)
              dispatchIsFetchPreviousPageError(result.isFetchPreviousPageError)
            }
          },
        }
      },
    },
  )

  return {
    $data: base.$data,
    $error: base.$error,
    $status: base.$status,
    $isPending: base.$isPending,
    $isFetching: base.$isFetching,
    $isSuccess: base.$isSuccess,
    $isError: base.$isError,
    $isPlaceholderData: base.$isPlaceholderData,
    $fetchStatus: base.$fetchStatus,
    $hasNextPage: base.$hasNextPage,
    $hasPreviousPage: base.$hasPreviousPage,
    $isFetchingNextPage: base.$isFetchingNextPage,
    $isFetchingPreviousPage: base.$isFetchingPreviousPage,
    $isFetchNextPageError: base.$isFetchNextPageError,
    $isFetchPreviousPageError: base.$isFetchPreviousPageError,
    fetchNextPage: base.fetchNextPage,
    fetchPreviousPage: base.fetchPreviousPage,
    refresh: base.refresh,
    mounted: base.mounted,
    unmounted: base.unmounted,
    observer: base.observer,
  }
}
