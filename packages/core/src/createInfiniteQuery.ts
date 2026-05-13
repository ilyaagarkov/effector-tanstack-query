import { attach, createEvent, createStore, sample, scopeBind } from 'effector'
import { InfiniteQueryObserver } from '@tanstack/query-core'
import type {
  InfiniteData,
  QueryClient,
  QueryKey,
} from '@tanstack/query-core'
import { createBaseQuery, sidConfig, warnMissingName } from './createBaseQuery'
import { resolveReactiveRefetchInterval } from './resolve'
import type {
  CreateInfiniteQueryOptions,
  InfiniteQueryResult,
} from './types'

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
  options: CreateInfiniteQueryOptions<TQueryFnData, TError, TPageParam, TData>,
): InfiniteQueryResult<TData, TError, TPageParam>
export function createInfiniteQuery<
  TQueryFnData = unknown,
  TError = Error,
  TPageParam = unknown,
  TData = InfiniteData<TQueryFnData, TPageParam>,
>(
  queryClient: QueryClient,
  options: CreateInfiniteQueryOptions<TQueryFnData, TError, TPageParam, TData>,
): InfiniteQueryResult<TData, TError, TPageParam>
export function createInfiniteQuery<
  TQueryFnData = unknown,
  TError = Error,
  TPageParam = unknown,
  TData = InfiniteData<TQueryFnData, TPageParam>,
>(
  arg1:
    | QueryClient
    | CreateInfiniteQueryOptions<TQueryFnData, TError, TPageParam, TData>,
  arg2?: CreateInfiniteQueryOptions<TQueryFnData, TError, TPageParam, TData>,
): InfiniteQueryResult<TData, TError, TPageParam> {
  const [explicitClient, options] = parseInfiniteArgs<
    TQueryFnData,
    TError,
    TPageParam,
    TData
  >(arg1, arg2)
  const { queryKey, enabled, name, ...restOptions } = options

  if (!name) warnMissingName('createInfiniteQuery')

  const reactiveRefetchInterval = resolveReactiveRefetchInterval(
    (restOptions as { refetchInterval?: unknown }).refetchInterval,
  )
  if (reactiveRefetchInterval) {
    delete (restOptions as { refetchInterval?: unknown }).refetchInterval
  }

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
    explicitClient,
    { queryKey, enabled, name, reactiveRefetchInterval },
    {
      createObserver: (qc, { queryKey: key, enabled: isEnabled }) =>
        new InfiniteQueryObserver<
          TQueryFnData,
          TError,
          TData,
          QueryKey,
          TPageParam
        >(qc, {
          ...restOptions,
          queryKey: key,
          enabled: isEnabled,
        } as any),
      setupExtras: () => {
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
        const fetchPreviousPage = createEvent<void>()

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
          // Wire fetchNextPage / fetchPreviousPage as scope-aware effects via
          // attach over $observer — same pattern as the rest of createBaseQuery.
          setupEffects: ({ $observer }) => {
            const fetchNextPageFx = attach({
              source: $observer,
              effect: (observer) => {
                if (!observer) return
                observer.fetchNextPage()
              },
            })
            sample({ clock: fetchNextPage, target: fetchNextPageFx })

            const fetchPreviousPageFx = attach({
              source: $observer,
              effect: (observer) => {
                if (!observer) return
                observer.fetchPreviousPage()
              },
            })
            sample({ clock: fetchPreviousPage, target: fetchPreviousPageFx })
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

  // See createQuery.prefetch — same contract, but uses fetchInfiniteQuery so
  // the first page is fetched + cached on the server.
  const prefetch = createEvent<void>()
  const prefetchFx = attach({
    source: {
      qc: base.$queryClient,
      key: base.$resolvedKey,
      enabled: base.$enabled,
    },
    effect: ({ qc, key, enabled }) => {
      if (!qc || !enabled) return
      return qc.fetchInfiniteQuery({
        ...restOptions,
        queryKey: key,
      } as any)
    },
  })
  sample({ clock: prefetch, target: prefetchFx })

  const result: InfiniteQueryResult<TData, TError, TPageParam> = {
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
    $observer: base.$observer,
    $queryClient: base.$queryClient,
    fetchNextPage: base.fetchNextPage,
    fetchPreviousPage: base.fetchPreviousPage,
    refresh: base.refresh,
    prefetch,
    mounted: base.mounted,
    unmounted: base.unmounted,
  }

  Object.defineProperty(result, '__createObserver', {
    enumerable: false,
    value: (qc: QueryClient, init: { queryKey: any; enabled: boolean }) =>
      new InfiniteQueryObserver<
        TQueryFnData,
        TError,
        TData,
        QueryKey,
        TPageParam
      >(qc, {
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

function parseInfiniteArgs<TQueryFnData, TError, TPageParam, TData>(
  arg1:
    | QueryClient
    | CreateInfiniteQueryOptions<TQueryFnData, TError, TPageParam, TData>,
  arg2?: CreateInfiniteQueryOptions<TQueryFnData, TError, TPageParam, TData>,
): [
  QueryClient | null,
  CreateInfiniteQueryOptions<TQueryFnData, TError, TPageParam, TData>,
] {
  if (arg2 !== undefined) {
    return [arg1 as QueryClient, arg2]
  }
  return [
    null,
    arg1 as CreateInfiniteQueryOptions<TQueryFnData, TError, TPageParam, TData>,
  ]
}
