import { attach, createEvent, createStore, sample, scopeBind } from 'effector'
import { InfiniteQueryObserver } from '@tanstack/query-core'
import type {
  DefaultError,
  InfiniteData,
  QueryClient,
  QueryKey,
} from '@tanstack/query-core'
import { createBaseQuery, sidConfig, warnMissingName } from './createBaseQuery'
import { resolveQueryArguments, resolveQueryDefinition } from './resolve'
import type { InfiniteOptions } from './optionsCompat'
import type {
  CreateInfiniteQueryOptions,
  CreateInfiniteQueryFactoryOptions,
  OptionsSource,
  QueryArguments,
  EffectorQueryKey,
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
  TError = DefaultError,
  TPageParam = unknown,
  TData = InfiniteData<TQueryFnData, TPageParam>,
  const TQueryKey extends QueryKey = QueryKey,
  TSource extends OptionsSource = OptionsSource,
>(
  ...args: QueryArguments<
    CreateInfiniteQueryFactoryOptions<
      TSource,
      TQueryFnData,
      TError,
      TPageParam,
      TData,
      TQueryKey
    >
  >
): InfiniteQueryResult<TData, TError, TPageParam>
export function createInfiniteQuery<
  TQueryFnData = unknown,
  TError = Error,
  TPageParam = unknown,
  TData = InfiniteData<TQueryFnData, TPageParam>,
  const TQueryKey extends EffectorQueryKey = EffectorQueryKey,
>(
  options: CreateInfiniteQueryOptions<
    TQueryFnData,
    TError,
    TPageParam,
    TData,
    TQueryKey
  >,
): InfiniteQueryResult<TData, TError, TPageParam>
export function createInfiniteQuery<
  TQueryFnData = unknown,
  TError = Error,
  TPageParam = unknown,
  TData = InfiniteData<TQueryFnData, TPageParam>,
  const TQueryKey extends EffectorQueryKey = EffectorQueryKey,
>(
  queryClient: QueryClient,
  options: CreateInfiniteQueryOptions<
    TQueryFnData,
    TError,
    TPageParam,
    TData,
    TQueryKey
  >,
): InfiniteQueryResult<TData, TError, TPageParam>
export function createInfiniteQuery<
  TQueryFnData = unknown,
  TError = Error,
  TPageParam = unknown,
  TData = InfiniteData<TQueryFnData, TPageParam>,
  const TQueryKey extends EffectorQueryKey = EffectorQueryKey,
>(
  ...args: QueryArguments<
    | CreateInfiniteQueryOptions<
        TQueryFnData,
        TError,
        TPageParam,
        TData,
        TQueryKey
      >
    | CreateInfiniteQueryFactoryOptions<
        any,
        TQueryFnData,
        TError,
        TPageParam,
        TData,
        any
      >
  >
): InfiniteQueryResult<TData, TError, TPageParam> {
  const [explicitClient, options] = resolveQueryArguments(args)
  const { name } = options
  if (!name) warnMissingName('createInfiniteQuery')
  type NativeOptions = InfiniteOptions<
    TQueryFnData,
    TError,
    TData,
    any,
    TPageParam
  >
  const definition = resolveQueryDefinition<NativeOptions>(options)
  type Options = ReturnType<typeof definition.$options.getState>

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
    },
    Options
  >(
    explicitClient,
    { definition, name },
    {
      createObserver: (qc, options) =>
        new InfiniteQueryObserver<
          TQueryFnData,
          TError,
          TData,
          QueryKey,
          TPageParam
        >(qc, options as any),
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

  // Prefetch uses current scoped options, including the initial page parameter
  // and page callbacks, to load the cache without mounting an observer.
  const prefetch = createEvent<void>()
  const prefetchFx = attach({
    source: {
      qc: base.$queryClient,
      options: base.$options,
    },
    effect: ({ qc, options }) => {
      if (!qc || !options.enabled) return
      return qc.fetchInfiniteQuery(definition.prefetch(options))
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
    finished: base.finished,
  }

  Object.defineProperty(result, '__createObserver', {
    enumerable: false,
    value: (qc: QueryClient, options: Options) =>
      new InfiniteQueryObserver<
        TQueryFnData,
        TError,
        TData,
        QueryKey,
        TPageParam
      >(qc, definition.create(options) as any),
  })
  Object.defineProperty(result, '__options', {
    enumerable: false,
    value: base.$options,
  })

  return result
}
