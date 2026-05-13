import type { Event, EventCallable, Store } from 'effector'
import type {
  FetchStatus,
  InfiniteData,
  InfiniteQueryObserver,
  InfiniteQueryObserverOptions,
  MutateOptions,
  MutationObserver,
  MutationObserverOptions,
  QueryClient,
  QueryKey,
  QueryObserver,
  QueryObserverOptions,
  QueryStatus,
} from '@tanstack/query-core'

export type StoreOrValue<T> = Store<T> | T

/**
 * A query key where each element can be a plain value or an effector Store.
 * When any Store changes, the query is automatically re-executed with the new key.
 *
 * @example
 * const $userId = createStore(1)
 * queryKey: ['user', $userId, 'details']
 */
export type EffectorQueryKey = ReadonlyArray<
  StoreOrValue<string | number | bigint | boolean | null | undefined | object>
>

export interface CreateQueryOptions<
  TQueryFnData = unknown,
  TError = Error,
  TData = TQueryFnData,
> extends Omit<
  QueryObserverOptions<TQueryFnData, TError, TData>,
  'queryKey' | 'enabled' | 'refetchInterval'
> {
  queryKey: EffectorQueryKey
  enabled?: StoreOrValue<boolean>
  /**
   * Polling interval in milliseconds, `false` to disable, or a Store for
   * runtime toggling — `Store<number | false>`. When a Store is passed, the
   * observer's `refetchInterval` is automatically kept in sync via
   * `setOptions` on every store change. The function form (`(query) => …`)
   * from TanStack Query is also still supported.
   */
  refetchInterval?:
    | QueryObserverOptions<TQueryFnData, TError, TData>['refetchInterval']
    | Store<number | false | undefined>
  /**
   * Stable name used to derive SIDs for the internal effector stores so that
   * `serialize(scope)` / `fork({ values })` round-trip works for SSR. Without
   * a name, the queryClient's `dehydrate`/`hydrate` path still works, but
   * scope-only serialization will silently drop these stores.
   */
  name?: string
}

export interface QueryResult<TData, TError = Error> {
  /** The resolved query data, or `undefined` while loading */
  $data: Store<TData | undefined>
  /** The query error, or `null` if there is none */
  $error: Store<TError | null>
  /** The query status: `'pending'` | `'success'` | `'error'` */
  $status: Store<QueryStatus>
  /** `true` while there is no cached data and the query is fetching */
  $isPending: Store<boolean>
  /** `true` while the query is fetching in the background */
  $isFetching: Store<boolean>
  /** `true` when the query has successfully fetched data */
  $isSuccess: Store<boolean>
  /** `true` when the query has failed */
  $isError: Store<boolean>
  /** `true` when the displayed data is placeholder data (not yet fetched for current key) */
  $isPlaceholderData: Store<boolean>
  /** The fetch status: `'fetching'` | `'paused'` | `'idle'` */
  $fetchStatus: Store<FetchStatus>
  /** Invalidates the query and triggers a background refetch */
  refresh: EventCallable<void>
  /**
   * Fetches the query via `queryClient.fetchQuery` and **awaits** the result.
   * Unlike `mounted`, this is meant for server-side prefetching / route
   * loaders where you need the cache populated before responding to the
   * request — `await allSettled(query.prefetch, { scope })` returns only
   * after the queryFn has resolved. Skips automatically when `enabled` is
   * `false`.
   *
   * @example
   * await allSettled(query.prefetch, { scope })
   * // queryClient cache + scope are now ready to be dehydrated/serialized.
   */
  prefetch: EventCallable<void>
  /**
   * Initializes the query subscription. Must be called (or used with allSettled)
   * before the query starts fetching.
   *
   * @example Without fork
   * query.mounted()
   *
   * @example With fork (test isolation)
   * const scope = fork()
   * await allSettled(query.mounted, { scope })
   */
  mounted: EventCallable<void>
  /**
   * Tears down the query subscription and cancels any in-flight request.
   * Call this when the consumer is destroyed (e.g. component unmount).
   */
  unmounted: EventCallable<void>
  /**
   * Per-scope observer store. Each fork scope has its own Observer instance,
   * created lazily on `mounted()` and bound to that scope's QueryClient.
   * Read scope-aware via `useUnit($observer)`. For tests, prefer
   * `scope.getState($observer)` over reading the default scope state.
   */
  $observer: Store<QueryObserver<TData, TError> | null>
  /**
   * The QueryClient store this query is bound to. Frozen if a client was
   * passed explicitly to the factory; otherwise points at the global
   * `$queryClient` and honors `fork({ values: [[$queryClient, qc]] })`.
   */
  $queryClient: Store<QueryClient | null>
}

export interface CreateInfiniteQueryOptions<
  TQueryFnData = unknown,
  TError = Error,
  TPageParam = unknown,
  TData = InfiniteData<TQueryFnData, TPageParam>,
> extends Omit<
  InfiniteQueryObserverOptions<
    TQueryFnData,
    TError,
    TData,
    ReadonlyArray<unknown>,
    TPageParam
  >,
  'queryKey' | 'enabled' | 'refetchInterval'
> {
  queryKey: EffectorQueryKey
  enabled?: StoreOrValue<boolean>
  /** See {@link CreateQueryOptions.refetchInterval}. */
  refetchInterval?:
    | InfiniteQueryObserverOptions<
        TQueryFnData,
        TError,
        TData,
        ReadonlyArray<unknown>,
        TPageParam
      >['refetchInterval']
    | Store<number | false | undefined>
  /** See {@link CreateQueryOptions.name}. */
  name?: string
}

export interface InfiniteQueryResult<
  TData,
  TError = Error,
  TPageParam = unknown,
> {
  /**
   * The selected/displayed data. Defaults to `InfiniteData<TQueryFnData, TPageParam>`
   * but narrows to whatever `select` returns when provided.
   */
  $data: Store<TData | undefined>
  $error: Store<TError | null>
  $status: Store<QueryStatus>
  $isPending: Store<boolean>
  $isFetching: Store<boolean>
  $isSuccess: Store<boolean>
  $isError: Store<boolean>
  $isPlaceholderData: Store<boolean>
  $fetchStatus: Store<FetchStatus>
  $hasNextPage: Store<boolean>
  $hasPreviousPage: Store<boolean>
  $isFetchingNextPage: Store<boolean>
  $isFetchingPreviousPage: Store<boolean>
  $isFetchNextPageError: Store<boolean>
  $isFetchPreviousPageError: Store<boolean>
  fetchNextPage: EventCallable<void>
  fetchPreviousPage: EventCallable<void>
  refresh: EventCallable<void>
  /** See {@link QueryResult.prefetch}. Uses `fetchInfiniteQuery` under the hood. */
  prefetch: EventCallable<void>
  mounted: EventCallable<void>
  unmounted: EventCallable<void>
  /** See {@link QueryResult.$observer}. */
  $observer: Store<
    InfiniteQueryObserver<any, TError, TData, QueryKey, TPageParam> | null
  >
  /** See {@link QueryResult.$queryClient}. */
  $queryClient: Store<QueryClient | null>
}

export type CreateMutationOptions<
  TData = unknown,
  TError = Error,
  TVariables = void,
  TOnMutateResult = unknown,
> = MutationObserverOptions<TData, TError, TVariables, TOnMutateResult> & {
  /** See {@link CreateQueryOptions.name}. */
  name?: string
}

export type MutationStatus = 'idle' | 'pending' | 'success' | 'error'

export interface MutationResult<
  TData = unknown,
  TError = Error,
  TVariables = void,
> {
  /** The mutation result data, or `undefined` before success */
  $data: Store<TData | undefined>
  /** The mutation error, or `null` if there is none */
  $error: Store<TError | null>
  /** The mutation status: `'idle'` | `'pending'` | `'success'` | `'error'` */
  $status: Store<MutationStatus>
  /** The variables passed to the last `mutate` call */
  $variables: Store<TVariables | undefined>
  /** `true` while the mutation is paused (e.g. offline) and cannot run */
  $isPaused: Store<boolean>
  /** `true` while the mutation is executing */
  $isPending: Store<boolean>
  /** `true` when the mutation has succeeded */
  $isSuccess: Store<boolean>
  /** `true` when the mutation has failed */
  $isError: Store<boolean>
  /** `true` when the mutation has not yet been triggered */
  $isIdle: Store<boolean>
  /** Per-scope MutationObserver. Created on `start()`. See {@link QueryResult.$observer}. */
  $observer: Store<MutationObserver<TData, TError, TVariables, any> | null>
  /** See {@link QueryResult.$queryClient}. */
  $queryClient: Store<QueryClient | null>
  /** Triggers the mutation with the given variables */
  mutate: EventCallable<TVariables>
  /**
   * Triggers the mutation with per-call callbacks layered on top of the
   * observer-level ones. Use when you need component-local reactions
   * (e.g. navigate after success) without module-level `sample` wiring.
   */
  mutateWith: EventCallable<{
    variables: TVariables
    onSuccess?: MutateOptions<TData, TError, TVariables>['onSuccess']
    onError?: MutateOptions<TData, TError, TVariables>['onError']
    onSettled?: MutateOptions<TData, TError, TVariables>['onSettled']
  }>
  /** Resets the mutation state back to idle */
  reset: EventCallable<void>
  /**
   * Initializes the mutation observer subscription.
   * Must be called before mutate to ensure stores receive updates.
   */
  start: EventCallable<void>
  /**
   * Tears down the observer subscription. Call this when the consumer is
   * destroyed (e.g. component unmount) so the queryClient can gc the
   * mutation entry.
   */
  unmounted: EventCallable<void>
  /**
   * Sample-friendly events for module-level reactions to mutation outcome.
   * Payloads include both the original `params` and the `result` / `error`,
   * matching effector effect `done` / `fail` shape.
   */
  finished: {
    success: Event<{ params: TVariables; result: TData }>
    failure: Event<{ params: TVariables; error: TError }>
  }
}
