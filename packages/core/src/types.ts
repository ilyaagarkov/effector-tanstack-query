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

/**
 * Resolves a single `EffectorQueryKey` element to its runtime value type:
 * `Store<T>` → `T`, everything else is left as-is. Used by `ResolvedQueryKey`
 * so `queryFn`'s context can present `queryKey` with stores already unwrapped.
 */
export type ResolveQueryKeyElement<T> = T extends Store<infer U> ? U : T

/**
 * Tuple-aware mapping that walks an `EffectorQueryKey` and replaces each
 * `Store<T>` with `T`, preserving tuple shape (length, readonly-ness, element
 * positions). Drives the `TQueryKey` generic of `CreateQueryOptions` so the
 * `queryFn({ queryKey })` parameter is typed with the resolved values:
 *
 * ```ts
 * const $name = createStore<string>('pikachu')
 * createQuery({
 *   queryKey: ['pokemon', $name],
 *   queryFn: ({ queryKey }) => fetchByName(queryKey[1]),
 *   //                                     ^ string — no cast needed
 * })
 * ```
 */
export type ResolvedQueryKey<T extends ReadonlyArray<unknown>> = {
  readonly [K in keyof T]: ResolveQueryKeyElement<T[K]>
}

export interface CreateQueryOptions<
  TQueryFnData = unknown,
  TError = Error,
  TData = TQueryFnData,
  TQueryKey extends EffectorQueryKey = EffectorQueryKey,
> extends Omit<
  QueryObserverOptions<
    TQueryFnData,
    TError,
    TData,
    TQueryFnData,
    ResolvedQueryKey<TQueryKey>
  >,
  'queryKey' | 'enabled' | 'refetchInterval'
> {
  queryKey: TQueryKey
  enabled?: StoreOrValue<boolean>
  /**
   * Polling interval in milliseconds, `false` to disable, or a Store for
   * runtime toggling — `Store<number | false>`. When a Store is passed, the
   * observer's `refetchInterval` is automatically kept in sync via
   * `setOptions` on every store change. The function form (`(query) => …`)
   * from TanStack Query is also still supported.
   */
  refetchInterval?:
    | QueryObserverOptions<
        TQueryFnData,
        TError,
        TData,
        TQueryFnData,
        ResolvedQueryKey<TQueryKey>
      >['refetchInterval']
    | Store<number | false | undefined>
  /**
   * Stable name used to derive SIDs for the internal effector stores so that
   * `serialize(scope)` / `fork({ values })` round-trip works for SSR. Without
   * a name, the queryClient's `dehydrate`/`hydrate` path still works, but
   * scope-only serialization will silently drop these stores.
   */
  name?: string
}

/** A single Store or a shape of Stores consumed by an options factory. */
export type QueryOptionsSource =
  | Store<unknown>
  | Readonly<Record<string, Store<unknown>>>

/** Resolve every Store in a {@link QueryOptionsSource} to its plain value. */
export type QueryOptionsSourceValue<TSource extends QueryOptionsSource> =
  TSource extends Store<infer TValue>
    ? TValue
    : {
        -readonly [TKey in keyof TSource]: TSource[TKey] extends Store<
          infer TValue
        >
          ? TValue
          : never
      }

export interface CreateQueryFromOptionsOptions<
  TSource extends QueryOptionsSource,
  TQueryFnData = unknown,
  TError = Error,
  TData = TQueryFnData,
  TQueryKey extends QueryKey = QueryKey,
> {
  /** Reactive parameters passed to `queryOptions` as resolved plain values. */
  source: TSource
  /**
   * A standard TanStack Query Options factory. It is re-evaluated whenever
   * `source` changes and the complete returned options object is applied to
   * the observer.
   */
  queryOptions: (
    source: QueryOptionsSourceValue<TSource>,
  ) => QueryObserverOptions<
    TQueryFnData,
    TError,
    TData,
    TQueryFnData,
    TQueryKey
  >
  /**
   * Optional consumer-level reactive gate. `false` overrides the factory's
   * `enabled`; `true` preserves it.
   */
  enabled?: StoreOrValue<boolean>
  /** See {@link CreateQueryOptions.name}. */
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
  /**
   * Lifecycle events for `sample`-driven reactions to fetch completion.
   *
   * - `success` fires with the (post-`select`) data on every newly-finished
   *   successful fetch — fresh fetch, refetch, reactive key change, or a
   *   cross-scope `setQueryData`.
   * - `failure` fires with the error on every failed fetch.
   *
   * Neither fires for the baseline state observed on `mounted()` (e.g.
   * SSR-hydrated cache data) — the events track *new* fetches, not the
   * initial observation. Each fork scope tracks its own baseline.
   *
   * @example
   * sample({ clock: userQuery.finished.success, target: loadSettings })
   * sample({
   *   clock: userQuery.finished.failure,
   *   fn: (err) => `Failed: ${err.message}`,
   *   target: showToast,
   * })
   */
  finished: {
    success: Event<TData>
    failure: Event<TError>
  }
}

export interface CreateInfiniteQueryOptions<
  TQueryFnData = unknown,
  TError = Error,
  TPageParam = unknown,
  TData = InfiniteData<TQueryFnData, TPageParam>,
  TQueryKey extends EffectorQueryKey = EffectorQueryKey,
> extends Omit<
  InfiniteQueryObserverOptions<
    TQueryFnData,
    TError,
    TData,
    ResolvedQueryKey<TQueryKey>,
    TPageParam
  >,
  'queryKey' | 'enabled' | 'refetchInterval'
> {
  queryKey: TQueryKey
  enabled?: StoreOrValue<boolean>
  /** See {@link CreateQueryOptions.refetchInterval}. */
  refetchInterval?:
    | InfiniteQueryObserverOptions<
        TQueryFnData,
        TError,
        TData,
        ResolvedQueryKey<TQueryKey>,
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
  /** See {@link QueryResult.finished}. */
  finished: {
    success: Event<TData>
    failure: Event<TError>
  }
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

/**
 * Per-item snapshot inside a `createQueries` family. Parallel to the
 * factory's `source` array — one entry per item, in source order.
 */
export interface QueryItemState<TItem, TData, TError = Error> {
  /** The source item this entry was derived from. */
  source: TItem
  data: TData | undefined
  error: TError | null
  status: QueryStatus
  isPending: boolean
  isFetching: boolean
  isSuccess: boolean
  isError: boolean
  isPlaceholderData: boolean
  fetchStatus: FetchStatus
}

/**
 * Per-item query options produced by `createQueries({ query })`. A pure
 * function of one source item — no effector stores, no closures over
 * mutable state. Reactivity comes from the source store; whenever it
 * updates, this callback re-runs to compute fresh options.
 *
 * `enabled` is a plain boolean (not a `Store`) for the same reason —
 * it's derived from the item, so reactivity is already covered.
 */
export interface CreateQueriesItemOptions<
  TQueryFnData,
  TError,
  TData,
  TQueryKey extends ReadonlyArray<unknown>,
> extends Omit<
    QueryObserverOptions<TQueryFnData, TError, TData, TQueryFnData, TQueryKey>,
    'queryKey' | 'enabled'
  > {
  queryKey: TQueryKey
  enabled?: boolean
}

export interface CreateQueriesOptions<
  TItem,
  TQueryFnData = unknown,
  TError = Error,
  TData = TQueryFnData,
  TQueryKey extends ReadonlyArray<unknown> = ReadonlyArray<unknown>,
> {
  /**
   * Stable name used to derive the SID of the result `$items` store so
   * `serialize(scope)` round-trips it for SSR. Without a name, the
   * QueryClient cache still hydrates via `dehydrate`/`hydrate`, but the
   * `$items` snapshot is silently dropped from `serialize(scope)`.
   */
  name?: string
  /**
   * Reactive list of items. Each item becomes one parallel query in the
   * family. Adding / removing items updates the family (spawn / dispose
   * observer). Order is preserved in `$items`.
   *
   * Duplicates in `source` deduplicate observers (same `queryKey` hash)
   * but produce separate `$items` entries — one per occurrence.
   */
  source: Store<ReadonlyArray<TItem>>
  /**
   * Per-item options builder. MUST be pure — same item in, same options
   * out. Reactivity is driven by the source store; this callback fires
   * synchronously when source updates.
   */
  query: (
    item: TItem,
  ) => CreateQueriesItemOptions<TQueryFnData, TError, TData, TQueryKey>
  /** Shared QueryObserver defaults applied on top of `query(item)`. */
  staleTime?: number
  gcTime?: number
  retry?: QueryObserverOptions<TQueryFnData, TError, TData>['retry']
  retryDelay?: QueryObserverOptions<TQueryFnData, TError, TData>['retryDelay']
  refetchOnMount?: QueryObserverOptions<
    TQueryFnData,
    TError,
    TData
  >['refetchOnMount']
  refetchOnReconnect?: QueryObserverOptions<
    TQueryFnData,
    TError,
    TData
  >['refetchOnReconnect']
  refetchOnWindowFocus?: QueryObserverOptions<
    TQueryFnData,
    TError,
    TData
  >['refetchOnWindowFocus']
  networkMode?: QueryObserverOptions<
    TQueryFnData,
    TError,
    TData
  >['networkMode']
}

/**
 * Result of `createQueries(...)`. A reactive "family" of parallel
 * queries indexed by a source store. Composes naturally with
 * `useUnit($items)` for non-Suspense usage and with
 * `useQueries(family)` / `useSuspenseQueries(family)` for React-style
 * consumption.
 */
export interface QueriesResult<TItem, TData = unknown, TError = Error> {
  /** Per-item snapshots, parallel to `source`. */
  $items: Store<ReadonlyArray<QueryItemState<TItem, TData, TError>>>
  /** Just the `data` field of `$items` — shortcut for common UIs. */
  $data: Store<ReadonlyArray<TData | undefined>>
  /** `true` while **any** query in the family is pending. */
  $isPending: Store<boolean>
  /** `true` only when **every** query in the family has succeeded. */
  $isSuccess: Store<boolean>
  /** `true` if **any** query in the family is currently fetching. */
  $isFetching: Store<boolean>
  /** `true` if **any** query in the family errored. */
  $isError: Store<boolean>
  /**
   * Triggers a parallel `fetchQuery` for every current source item.
   * SSR-friendly — `await allSettled(family.prefetch, { scope })`
   * returns after every queryFn has resolved (or failed).
   */
  prefetch: EventCallable<void>
  /**
   * Increment the per-scope refcount and ensure every observer is
   * subscribed to the QueryClient. Call from `useEffect` (or its
   * effector equivalent). The matching `unmounted()` decrements; when
   * the count hits zero, observers unsubscribe.
   */
  mounted: EventCallable<void>
  unmounted: EventCallable<void>
  /** Invalidates every query in the family — re-fetches in background. */
  refresh: EventCallable<void>
  /** Invalidates one specific item's query. */
  refreshOne: EventCallable<TItem>
  /** See {@link QueryResult.$queryClient}. */
  $queryClient: Store<QueryClient | null>
  /**
   * Discriminator that lets `useQueries` / `useSuspenseQueries` and
   * other helpers distinguish a family from a tuple of factories at
   * runtime. Not part of the public API.
   */
  readonly __family: true
}
