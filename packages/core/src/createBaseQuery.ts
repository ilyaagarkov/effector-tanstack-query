import {
  combine,
  createEffect,
  createEvent,
  createStore,
  sample,
  scopeBind,
} from 'effector'
import type { EventCallable, Store } from 'effector'
import type {
  FetchStatus,
  QueryClient,
  QueryKey,
  QueryStatus,
} from '@tanstack/query-core'
import { resolveEnabled, resolveKey } from './resolve'
import type { EffectorQueryKey, StoreOrValue } from './types'

/**
 * The minimal shape of an observer that createBaseQuery knows how to drive.
 * Both QueryObserver and InfiniteQueryObserver satisfy this.
 */
export interface BaseObserverLike<TResult> {
  options: { queryKey: QueryKey; _defaulted?: boolean; queryHash?: string }
  setOptions(options: any): void
  subscribe(listener: (result: TResult) => void): () => void
  getCurrentResult(): TResult
  destroy(): void
}

/**
 * The subset of observer result fields that createBaseQuery wires up
 * into stores common to all query flavors.
 */
export interface BaseObserverResult<TData, TError> {
  data: TData | undefined
  error: TError | null
  status: QueryStatus
  isFetching: boolean
  fetchStatus: FetchStatus
  isPlaceholderData: boolean
}

export interface BaseQueryStores<TData, TError> {
  $data: Store<TData | undefined>
  $error: Store<TError | null>
  $status: Store<QueryStatus>
  $isPending: Store<boolean>
  $isFetching: Store<boolean>
  $isSuccess: Store<boolean>
  $isError: Store<boolean>
  $isPlaceholderData: Store<boolean>
  $fetchStatus: Store<FetchStatus>
  refresh: EventCallable<void>
  mounted: EventCallable<void>
  unmounted: EventCallable<void>
}

export interface BaseQueryOptions {
  queryKey: EffectorQueryKey
  enabled?: StoreOrValue<boolean>
  name?: string
}

const SID_PREFIX = '@tanstack/query-effector'

const warnedNames = new Set<string>()

export function warnMissingName(role: string): void {
  if (typeof process === 'undefined' || process.env.NODE_ENV === 'production') {
    return
  }
  if (warnedNames.has(role)) return
  warnedNames.add(role)
  // eslint-disable-next-line no-console
  console.warn(
    `[@tanstack/query-effector] ${role} created without a "name" — internal stores will be excluded from serialize(scope). ` +
      `Pass a unique "name" to enable SSR via fork({ values: serialize(scope) }).`,
  )
}

export function sidConfig(
  name: string | undefined,
  role: string,
): { sid: string; name: string } | {} {
  if (!name) return {}
  return {
    sid: `${SID_PREFIX}.${name}.${role}`,
    name: `${name}.${role}`,
  }
}

export interface ExtrasSetup<TResult, TExtraStores> {
  /** Extra stores/events merged into the final result object. */
  stores: TExtraStores
  /**
   * Invoked inside the mountFx effect. Must scope-bind any extra events
   * and return a function that dispatches extra fields from the observer
   * result. The returned dispatcher is called on every subscription
   * notification alongside the base dispatcher.
   */
  bindDispatcher: () => (result: TResult) => void
}

export interface CreateBaseQueryConfig<
  TData,
  TError,
  TResult extends BaseObserverResult<TData, TError>,
  TObserver extends BaseObserverLike<TResult>,
  TExtraStores,
> {
  /** Build the observer once with an initial key/enabled snapshot. */
  createObserver: (initial: { queryKey: QueryKey; enabled: boolean }) => TObserver
  /**
   * Hook for query flavors that need additional stores/events (e.g. infinite
   * query's hasNextPage, fetchNextPage). Receives the observer for wiring
   * extra effects such as fetchNextPage.
   */
  setupExtras?: (observer: TObserver) => ExtrasSetup<TResult, TExtraStores>
}

export function createBaseQuery<
  TData,
  TError,
  TResult extends BaseObserverResult<TData, TError>,
  TObserver extends BaseObserverLike<TResult>,
  TExtraStores = {},
>(
  queryClient: QueryClient,
  options: BaseQueryOptions,
  config: CreateBaseQueryConfig<TData, TError, TResult, TObserver, TExtraStores>,
): BaseQueryStores<TData, TError> & { observer: TObserver } & TExtraStores {
  const { name } = options
  const $resolvedKey = resolveKey(options.queryKey)
  const $enabled = resolveEnabled(options.enabled)

  const dataUpdated = createEvent<TData | undefined>()
  const errorUpdated = createEvent<TError | null>()
  const statusUpdated = createEvent<QueryStatus>()
  const isFetchingUpdated = createEvent<boolean>()
  const fetchStatusUpdated = createEvent<FetchStatus>()
  const isPlaceholderDataUpdated = createEvent<boolean>()

  const $data = createStore<TData | undefined>(undefined, {
    skipVoid: false,
    ...sidConfig(name, '$data'),
  }).on(dataUpdated, (_, v) => v)
  const $error = createStore<TError | null>(null, {
    skipVoid: false,
    ...sidConfig(name, '$error'),
  }).on(errorUpdated, (_, v) => v)
  const $status = createStore<QueryStatus>('pending', {
    ...sidConfig(name, '$status'),
  }).on(statusUpdated, (_, v) => v)
  const $isFetching = createStore(false, {
    ...sidConfig(name, '$isFetching'),
  }).on(isFetchingUpdated, (_, v) => v)
  const $fetchStatus = createStore<FetchStatus>('idle', {
    ...sidConfig(name, '$fetchStatus'),
  }).on(fetchStatusUpdated, (_, v) => v)
  const $isPlaceholderData = createStore(false, {
    ...sidConfig(name, '$isPlaceholderData'),
  }).on(isPlaceholderDataUpdated, (_, v) => v)

  // Derived stores via .map don't accept sid in their config — effector's
  // serialize() captures source-store values, and derived stores recompute
  // automatically on the client after fork({ values }).
  const $isPending = $status.map((s) => s === 'pending')
  const $isSuccess = $status.map((s) => s === 'success')
  const $isError = $status.map((s) => s === 'error')

  const observer = config.createObserver({
    queryKey: $resolvedKey.getState(),
    enabled: $enabled.getState(),
  })

  const extras = config.setupExtras?.(observer)

  let unsubscribeObserver: (() => void) | undefined

  // Runs once per mount. scopeBind({ safe: true }) reliably captures the fork
  // scope here because this effect is triggered directly from allSettled(mounted).
  // The bound dispatchers are captured in the observer callback's closure and
  // reused for all subsequent notifications (including after key/enabled changes).
  const mountFx = createEffect(
    ({ key, enabled }: { key: QueryKey; enabled: boolean }) => {
      const dispatchData = scopeBind(dataUpdated, { safe: true })
      const dispatchError = scopeBind(errorUpdated, { safe: true })
      const dispatchStatus = scopeBind(statusUpdated, { safe: true })
      const dispatchIsFetching = scopeBind(isFetchingUpdated, { safe: true })
      const dispatchFetchStatus = scopeBind(fetchStatusUpdated, { safe: true })
      const dispatchIsPlaceholderData = scopeBind(isPlaceholderDataUpdated, {
        safe: true,
      })
      const dispatchExtras = extras?.bindDispatcher()

      unsubscribeObserver?.()
      observer.setOptions({ ...observer.options, queryKey: key, enabled })

      const dispatch = (result: TResult) => {
        dispatchData(result.data)
        dispatchError(result.error)
        dispatchStatus(result.status)
        dispatchIsFetching(result.isFetching)
        dispatchFetchStatus(result.fetchStatus)
        dispatchIsPlaceholderData(result.isPlaceholderData)
        dispatchExtras?.(result)
      }

      unsubscribeObserver = observer.subscribe(dispatch)

      // Emit the current state immediately — observer.subscribe() may not
      // fire the callback synchronously when cached data already matches
      // the observer's initial result (e.g. staleTime + setQueryData).
      // This mirrors react-query's getOptimisticResult() on mount.
      dispatch(observer.getCurrentResult())
    },
  )

  // Runs when key or enabled changes after mount. Only updates observer options —
  // no re-binding needed because the observer callback already holds scope-bound
  // dispatchers from mountFx.
  const updateObserverFx = createEffect(
    ({ key, enabled }: { key: QueryKey; enabled: boolean }) => {
      // Strip _defaulted and queryHash so defaultQueryOptions() recomputes
      // the hash for the new key. Without this, the old hash is preserved and
      // QueryObserver#updateQuery() finds the old query — no key switch, no fetch.
      const {
        _defaulted: _d,
        queryHash: _h,
        ...baseOptions
      } = observer.options as typeof observer.options & {
        _defaulted?: boolean
        queryHash?: string
      }
      observer.setOptions({ ...baseOptions, queryKey: key, enabled })
    },
  )

  const mounted = createEvent<void>()
  const unmounted = createEvent<void>()
  const $isMounted = createStore(false, {
    ...sidConfig(name, '$isMounted'),
  })
    .on(mounted, () => true)
    .on(unmounted, () => false)

  sample({
    clock: mounted,
    source: combine({ key: $resolvedKey, enabled: $enabled }),
    target: mountFx,
  })

  sample({
    clock: combine({ key: $resolvedKey, enabled: $enabled }),
    source: combine({ key: $resolvedKey, enabled: $enabled }),
    filter: $isMounted,
    target: updateObserverFx,
  })

  const unmountFx = createEffect(() => {
    unsubscribeObserver?.()
    unsubscribeObserver = undefined
    observer.destroy()
  })
  sample({ clock: unmounted, target: unmountFx })

  const refresh = createEvent<void>()
  const refreshFx = createEffect(() =>
    queryClient.invalidateQueries({ queryKey: observer.options.queryKey }),
  )
  sample({ clock: refresh, target: refreshFx })

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
    observer,
    ...(extras?.stores ?? ({} as TExtraStores)),
  }
}
