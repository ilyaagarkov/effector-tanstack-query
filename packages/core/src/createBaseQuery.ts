import {
  attach,
  combine,
  createEvent,
  createStore,
  sample,
  scopeBind,
} from 'effector'
import type { Event, EventCallable, Store } from 'effector'
import type {
  FetchStatus,
  QueryClient,
  QueryKey,
  QueryStatus,
} from '@tanstack/query-core'
import { $queryClient } from './queryClient'
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

type ObserverOptionsLike = { queryKey: QueryKey; enabled?: unknown }

interface BaseObserverInput {
  key: QueryKey
  enabled: boolean
  refetchInterval: number | false | undefined
  observerOptions?: ObserverOptionsLike
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
  /**
   * Timestamp (ms) of the last successful data resolution. Monotonically
   * increases per successful fetch — used to detect newly-finished fetches
   * for the `finished.success` lifecycle event.
   */
  dataUpdatedAt: number
  /**
   * Timestamp (ms) of the last error. Increments per failed fetch — used to
   * detect newly-finished failures for the `finished.failure` lifecycle event.
   */
  errorUpdatedAt: number
}

export interface BaseQueryStores<TData, TError, TObserver> {
  $data: Store<TData | undefined>
  $error: Store<TError | null>
  $status: Store<QueryStatus>
  $isPending: Store<boolean>
  $isFetching: Store<boolean>
  $isSuccess: Store<boolean>
  $isError: Store<boolean>
  $isPlaceholderData: Store<boolean>
  $fetchStatus: Store<FetchStatus>
  /**
   * Per-scope observer. Populated on first `mounted()` via attach over
   * `$queryClient` — every fork scope has its own Observer instance bound
   * to the scope's QueryClient. Read scope-aware via `useUnit($observer)`.
   */
  $observer: Store<TObserver | null>
  /**
   * Resolved QueryClient store. If the factory was called with an explicit
   * client, this is a frozen store of that client. Otherwise it's the global
   * `$queryClient`, which honors `fork({ values })` overrides.
   */
  $queryClient: Store<QueryClient | null>
  /** Internal — used by the React suspense hooks. */
  $resolvedKey: Store<QueryKey>
  /** Internal — used by the React suspense hooks. */
  $enabled: Store<boolean>
  refresh: EventCallable<void>
  mounted: EventCallable<void>
  unmounted: EventCallable<void>
  /**
   * Lifecycle events for `sample`-driven reactions to fetch completion.
   * `success` fires with the (post-`select`) data on every newly-finished
   * successful fetch; `failure` fires with the error on every failed fetch.
   * Neither fires for the baseline state observed on mount (e.g. hydrated
   * cache) — they track *new* fetches, not initial observability.
   */
  finished: {
    success: Event<TData>
    failure: Event<TError>
  }
}

export type BaseQueryOptions = {
  name?: string
} & (
  | {
      queryKey: EffectorQueryKey
      enabled?: StoreOrValue<boolean>
      /**
       * Pre-resolved reactive `refetchInterval`. The per-flavor factory
       * extracts the original option, and — if it's a Store — passes the
       * Store here while stripping the value from the observer constructor
       * options. Static values and function forms continue to flow through
       * `restOptions` to the observer.
       */
      reactiveRefetchInterval?: Store<number | false | undefined>
      observerOptions?: never
    }
  | {
      /**
       * Complete observer options produced by a reactive options factory.
       * These options are applied as a whole on every update instead of
       * resolving individual reactive fields.
       */
      observerOptions: Store<ObserverOptionsLike>
      queryKey?: never
      enabled?: never
      reactiveRefetchInterval?: never
    }
)

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

export interface ExtrasSetup<TResult, TObserver, TExtraStores> {
  /** Extra stores/events merged into the final result object. */
  stores: TExtraStores
  /**
   * Invoked inside the mount effect. Must scope-bind any extra events
   * and return a function that dispatches extra fields from the observer
   * result. The returned dispatcher is called on every subscription
   * notification alongside the base dispatcher.
   */
  bindDispatcher: () => (result: TResult) => void
  /**
   * Lets a flavor wire its own per-observer effects (e.g.
   * fetchNextPage / fetchPreviousPage for infinite queries). Receives the
   * per-scope `$observer` store so the flavor can build attach-based
   * effects that resolve the observer from the current scope.
   */
  setupEffects?: (params: { $observer: Store<TObserver | null> }) => void
}

export interface CreateBaseQueryConfig<
  TData,
  TError,
  TResult extends BaseObserverResult<TData, TError>,
  TObserver extends BaseObserverLike<TResult>,
  TExtraStores,
> {
  /** Build the observer for the current scope. Receives the resolved client. */
  createObserver: (
    queryClient: QueryClient,
    initial: {
      queryKey: QueryKey
      enabled: boolean
      observerOptions?: ObserverOptionsLike
    },
  ) => TObserver
  /** Apply complete options from a reactive options factory. */
  applyObserverOptions?: (
    observer: TObserver,
    options: ObserverOptionsLike,
  ) => void
  /**
   * Hook for query flavors that need additional stores/events (e.g. infinite
   * query's hasNextPage, fetchNextPage). Called once at factory time.
   */
  setupExtras?: () => ExtrasSetup<TResult, TObserver, TExtraStores>
}

export function createBaseQuery<
  TData,
  TError,
  TResult extends BaseObserverResult<TData, TError>,
  TObserver extends BaseObserverLike<TResult>,
  TExtraStores = {},
>(
  explicitClient: QueryClient | null,
  options: BaseQueryOptions,
  config: CreateBaseQueryConfig<TData, TError, TResult, TObserver, TExtraStores>,
): BaseQueryStores<TData, TError, TObserver> & TExtraStores {
  const { name, reactiveRefetchInterval: $reactiveRefetchInterval } = options
  const $resolvedKey = options.observerOptions
    ? options.observerOptions.map((observerOptions) => observerOptions.queryKey)
    : resolveKey(options.queryKey ?? [])
  const $enabled = options.observerOptions
    ? options.observerOptions.map(
        (observerOptions) => observerOptions.enabled !== false,
      )
    : resolveEnabled(options.enabled)

  // If an explicit client is passed, the factory is locked to it. fork()
  // values cannot override the captured value because $effectiveClient is a
  // brand-new store (not the global one). When no explicit client is passed,
  // we route through $queryClient — which respects fork({ values }) for
  // per-scope isolation.
  const $effectiveClient: Store<QueryClient | null> = explicitClient
    ? createStore(explicitClient as QueryClient | null, {
        serialize: 'ignore',
      })
    : $queryClient

  const dataUpdated = createEvent<TData | undefined>()
  const errorUpdated = createEvent<TError | null>()
  const statusUpdated = createEvent<QueryStatus>()
  const isFetchingUpdated = createEvent<boolean>()
  const fetchStatusUpdated = createEvent<FetchStatus>()
  const isPlaceholderDataUpdated = createEvent<boolean>()

  // Lifecycle events. Created once at factory time; dispatched per-scope via
  // scopeBind inside the mount effect so `allSettled` / fork isolation work.
  const finishedSuccess = createEvent<TData>()
  const finishedFailure = createEvent<TError>()

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

  // Per-scope observer storage. Carries runtime-only references
  // (subscriptions, callbacks) — must never participate in serialization.
  const $observer = createStore<TObserver | null>(null, {
    serialize: 'ignore',
  })
  const observerCreated = createEvent<TObserver>()
  $observer.on(observerCreated, (_, obs) => obs)

  // Per-observer unsubscribe handles. WeakMap so abandoned observers (e.g.
  // a scope that was discarded without unmount) are GC'able.
  const observerSubscriptions = new WeakMap<TObserver, () => void>()

  const extras = config.setupExtras?.()
  extras?.setupEffects?.({ $observer })

  // Runs once per mount. Creates the observer for the current scope (if not
  // yet created) and attaches the subscription. scopeBind({ safe: true })
  // reliably captures the fork scope here because this effect is triggered
  // directly from allSettled(mounted). Bound dispatchers are captured in the
  // observer callback's closure and reused for all subsequent notifications
  // (including after key/enabled changes).
  const mountFx = attach({
    source: { qc: $effectiveClient, observer: $observer },
    effect: (
      { qc, observer: existingObserver },
      {
        key,
        enabled,
        refetchInterval,
        observerOptions,
      }: BaseObserverInput,
    ) => {
      if (!qc) {
        throw new Error(
          '[@tanstack/query-effector] No QueryClient is set. Call setQueryClient(qc) before mounting, ' +
            'pass it to fork({ values: [[$queryClient, qc]] }), or pass it explicitly to the factory.',
        )
      }

      const observer =
        existingObserver ??
        config.createObserver(qc, {
          queryKey: key,
          enabled,
          observerOptions,
        })

      const dispatchData = scopeBind(dataUpdated, { safe: true })
      const dispatchError = scopeBind(errorUpdated, { safe: true })
      const dispatchStatus = scopeBind(statusUpdated, { safe: true })
      const dispatchIsFetching = scopeBind(isFetchingUpdated, { safe: true })
      const dispatchFetchStatus = scopeBind(fetchStatusUpdated, { safe: true })
      const dispatchIsPlaceholderData = scopeBind(isPlaceholderDataUpdated, {
        safe: true,
      })
      const dispatchFinishedSuccess = scopeBind(finishedSuccess, { safe: true })
      const dispatchFinishedFailure = scopeBind(finishedFailure, { safe: true })
      const dispatchExtras = extras?.bindDispatcher()

      // Per-mount, per-scope baseline for lifecycle events. The first
      // notification (the immediate getCurrentResult() emit below, or the
      // observer's first callback) establishes the baseline without firing —
      // so hydrated cache data on mount doesn't dispatch `finished.success`.
      // Subsequent increments of dataUpdatedAt / errorUpdatedAt are genuine
      // new fetches and do fire.
      let lastDataUpdatedAt = -1
      let lastErrorUpdatedAt = -1

      observerSubscriptions.get(observer)?.()
      if (observerOptions && config.applyObserverOptions) {
        config.applyObserverOptions(observer, observerOptions)
      } else {
        observer.setOptions({
          ...observer.options,
          queryKey: key,
          enabled,
          // Only override refetchInterval when the user provided a reactive
          // Store — otherwise the static value (or function) from the observer
          // constructor wins.
          ...($reactiveRefetchInterval ? { refetchInterval } : {}),
        })
      }

      const dispatch = (result: TResult) => {
        dispatchData(result.data)
        dispatchError(result.error)
        dispatchStatus(result.status)
        dispatchIsFetching(result.isFetching)
        dispatchFetchStatus(result.fetchStatus)
        dispatchIsPlaceholderData(result.isPlaceholderData)
        dispatchExtras?.(result)

        if (lastDataUpdatedAt === -1) {
          // Baseline — record current timestamps without emitting.
          lastDataUpdatedAt = result.dataUpdatedAt
          lastErrorUpdatedAt = result.errorUpdatedAt
        } else {
          // A newly-resolved successful fetch. Guard against placeholderData,
          // which carries status 'success' but never advances dataUpdatedAt.
          if (
            result.dataUpdatedAt > lastDataUpdatedAt &&
            result.status === 'success' &&
            !result.isPlaceholderData
          ) {
            lastDataUpdatedAt = result.dataUpdatedAt
            dispatchFinishedSuccess(result.data as TData)
          }
          if (
            result.errorUpdatedAt > lastErrorUpdatedAt &&
            result.status === 'error'
          ) {
            lastErrorUpdatedAt = result.errorUpdatedAt
            dispatchFinishedFailure(result.error as TError)
          }
        }
      }

      const unsubscribe = observer.subscribe(dispatch)
      observerSubscriptions.set(observer, unsubscribe)

      // Emit the current state immediately — observer.subscribe() may not
      // fire the callback synchronously when cached data already matches
      // the observer's initial result (e.g. staleTime + setQueryData).
      // This mirrors react-query's getOptimisticResult() on mount.
      dispatch(observer.getCurrentResult())

      return observer
    },
  })

  sample({ clock: mountFx.doneData, target: observerCreated })

  // Runs when reactive observer inputs change after mount. Only updates
  // observer options — subscription + dispatchers were already wired in
  // mountFx.
  const updateObserverFx = attach({
    source: $observer,
    effect: (
      observer,
      {
        key,
        enabled,
        refetchInterval,
        observerOptions,
      }: BaseObserverInput,
    ) => {
      if (!observer) return
      if (observerOptions && config.applyObserverOptions) {
        config.applyObserverOptions(observer, observerOptions)
        return
      }
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
      observer.setOptions({
        ...baseOptions,
        queryKey: key,
        enabled,
        ...($reactiveRefetchInterval ? { refetchInterval } : {}),
      })
    },
  })

  const mounted = createEvent<void>()
  const unmounted = createEvent<void>()
  const $isMounted = createStore(false, {
    ...sidConfig(name, '$isMounted'),
  })
    .on(mounted, () => true)
    .on(unmounted, () => false)

  // One store for every reactive input that drives observer.setOptions, so
  // mountFx and updateObserverFx always see the same shape. Static queries
  // combine their individual reactive fields; factory queries map their
  // complete observer-options store.
  const $observerOptions: Store<BaseObserverInput> = options.observerOptions
    ? options.observerOptions.map((observerOptions) => ({
        key: observerOptions.queryKey,
        enabled: observerOptions.enabled !== false,
        refetchInterval: undefined,
        observerOptions,
      }))
    : combine({
        key: $resolvedKey,
        enabled: $enabled,
        refetchInterval:
          $reactiveRefetchInterval ??
          createStore<number | false | undefined>(false),
        observerOptions: createStore<undefined>(undefined, {
          skipVoid: false,
        }),
      })

  sample({
    clock: mounted,
    source: $observerOptions,
    target: mountFx,
  })

  sample({
    clock: $observerOptions,
    source: $observerOptions,
    filter: $isMounted,
    target: updateObserverFx,
  })

  // Single effect: tear down subscription + destroy + clear $observer.
  // Doing all three in one effect avoids ordering ambiguity vs. separate
  // events that all sample from `unmounted`.
  const observerDestroyed = createEvent<void>()
  $observer.on(observerDestroyed, () => null)

  const unmountFx = attach({
    source: $observer,
    effect: (observer) => {
      if (!observer) return
      observerSubscriptions.get(observer)?.()
      observerSubscriptions.delete(observer)
      observer.destroy()
    },
  })
  sample({ clock: unmounted, target: unmountFx })
  sample({ clock: unmountFx.finally, target: observerDestroyed })

  const refresh = createEvent<void>()
  const refreshFx = attach({
    source: { qc: $effectiveClient, key: $resolvedKey },
    effect: ({ qc, key }) => {
      if (!qc) return
      return qc.invalidateQueries({ queryKey: key })
    },
  })
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
    $observer,
    $queryClient: $effectiveClient,
    $resolvedKey,
    $enabled,
    refresh,
    mounted,
    unmounted,
    finished: {
      success: finishedSuccess,
      failure: finishedFailure,
    },
    ...(extras?.stores ?? ({} as TExtraStores)),
  }
}
