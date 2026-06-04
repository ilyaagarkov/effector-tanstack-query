import {
  attach,
  createEvent,
  createStore,
  sample,
  scopeBind,
  type Store,
} from 'effector'
import { QueryObserver, hashKey } from '@tanstack/query-core'
import type { QueryClient } from '@tanstack/query-core'
import { $queryClient as $globalQueryClient } from './queryClient'
import { sidConfig, warnMissingName } from './createBaseQuery'
import type {
  CreateQueriesOptions,
  QueriesResult,
  QueryItemState,
} from './types'

interface ObserverEntry<TData, TError> {
  observer: QueryObserver<TData, TError>
  unsubscribe: (() => void) | null
}

const EMPTY_ITEMS: ReadonlyArray<QueryItemState<unknown, unknown, unknown>> = []

/**
 * Reactive family of parallel queries indexed by a source store. See
 * {@link CreateQueriesOptions} for the input shape and
 * {@link QueriesResult} for the output API.
 *
 * Internals:
 *
 *   - Each `source` element gets one `QueryObserver` (deduplicated by
 *     `hashKey(query(item).queryKey)`). Observers live in a per-scope
 *     `Map` held in a `serialize: 'ignore'` store (instances can't ride
 *     through `serialize(scope)`).
 *   - On every `source` update the family diffs prev/next, spawns
 *     observers for new items, disposes observers for removed items,
 *     and updates `$items`. Re-ordering without add/remove is cheap —
 *     observers stay, `$items` just re-projects.
 *   - Observer subscriptions are reference-counted via `mounted()` /
 *     `unmounted()`. First mount subscribes every observer; last
 *     unmount unsubscribes. Subsequent source changes while mounted
 *     auto-subscribe new observers.
 *   - SSR works via `prefetch`: triggers `qc.fetchQuery(...)` for every
 *     current source item in parallel, populates the QC cache, then
 *     mounts observers so `$items` snapshot carries the data through
 *     `serialize(scope)`.
 */
export function createQueries<
  TItem,
  TQueryFnData = unknown,
  TError = Error,
  TData = TQueryFnData,
  TQueryKey extends ReadonlyArray<unknown> = ReadonlyArray<unknown>,
>(
  options: CreateQueriesOptions<TItem, TQueryFnData, TError, TData, TQueryKey>,
): QueriesResult<TItem, TData, TError>
export function createQueries<
  TItem,
  TQueryFnData = unknown,
  TError = Error,
  TData = TQueryFnData,
  TQueryKey extends ReadonlyArray<unknown> = ReadonlyArray<unknown>,
>(
  queryClient: QueryClient,
  options: CreateQueriesOptions<TItem, TQueryFnData, TError, TData, TQueryKey>,
): QueriesResult<TItem, TData, TError>
export function createQueries<
  TItem,
  TQueryFnData = unknown,
  TError = Error,
  TData = TQueryFnData,
  TQueryKey extends ReadonlyArray<unknown> = ReadonlyArray<unknown>,
>(
  arg1:
    | QueryClient
    | CreateQueriesOptions<TItem, TQueryFnData, TError, TData, TQueryKey>,
  arg2?: CreateQueriesOptions<TItem, TQueryFnData, TError, TData, TQueryKey>,
): QueriesResult<TItem, TData, TError> {
  const [explicitClient, options] = parseArgs<
    TItem,
    TQueryFnData,
    TError,
    TData,
    TQueryKey
  >(arg1, arg2)

  const { name, source, query, ...sharedOptions } = options

  if (!name) warnMissingName('createQueries')

  const $queryClient: Store<QueryClient | null> = explicitClient
    ? createStore(explicitClient as QueryClient | null, {
        serialize: 'ignore',
      })
    : $globalQueryClient

  // Per-scope observer storage. Map keyed by queryKey hash.
  const $observers = createStore<Map<string, ObserverEntry<TData, TError>>>(
    new Map(),
    { serialize: 'ignore' },
  )

  // Per-scope ref-count: number of active consumers that called mounted().
  // First mount subscribes observers, last unmount unsubscribes them.
  const $refCount = createStore<number>(0, { serialize: 'ignore' })

  // The serializable result snapshot.
  const itemsUpdated = createEvent<
    ReadonlyArray<QueryItemState<TItem, TData, TError>>
  >()
  const $items = createStore<
    ReadonlyArray<QueryItemState<TItem, TData, TError>>
  >(EMPTY_ITEMS as ReadonlyArray<QueryItemState<TItem, TData, TError>>, {
    ...sidConfig(name, '$items'),
  }).on(itemsUpdated, (_, items) => items)

  const observersChanged = createEvent<
    Map<string, ObserverEntry<TData, TError>>
  >()
  $observers.on(observersChanged, (_, next) => next)

  const refCountChanged = createEvent<number>()
  $refCount.on(refCountChanged, (_, next) => next)

  const mounted = createEvent<void>()
  const unmounted = createEvent<void>()
  const refresh = createEvent<void>()
  const refreshOne = createEvent<TItem>()
  const prefetch = createEvent<void>()

  // Snapshot helpers — pure, run from effects.
  function itemsFromObservers(
    src: ReadonlyArray<TItem>,
    observers: Map<string, ObserverEntry<TData, TError>>,
  ): ReadonlyArray<QueryItemState<TItem, TData, TError>> {
    return src.map((item) => {
      const opts = query(item)
      const hash = hashKey(opts.queryKey as ReadonlyArray<unknown>)
      const entry = observers.get(hash)
      if (!entry) return defaultItemState(item)
      const r = entry.observer.getCurrentResult()
      return {
        source: item,
        data: r.data,
        error: r.error,
        status: r.status,
        isPending: r.isPending,
        isFetching: r.isFetching,
        isSuccess: r.isSuccess,
        isError: r.isError,
        isPlaceholderData: r.isPlaceholderData,
        fetchStatus: r.fetchStatus,
      }
    })
  }

  function buildObserverOptions(item: TItem) {
    const itemOpts = query(item)
    return {
      ...sharedOptions,
      ...itemOpts,
      enabled: itemOpts.enabled ?? true,
    } as ConstructorParameters<typeof QueryObserver<TQueryFnData, TError, TData>>[1]
  }

  // Diff source against current observers. Spawns / disposes observers
  // to match the desired set; subscribes the ones that should be live
  // given the current mount state. Idempotent — calling twice with the
  // same input + state is a no-op.
  function diffSource(
    qc: QueryClient,
    src: ReadonlyArray<TItem>,
    prev: Map<string, ObserverEntry<TData, TError>>,
    isMounted: boolean,
    dispatchRecompute: () => void,
  ): {
    next: Map<string, ObserverEntry<TData, TError>>
    items: ReadonlyArray<QueryItemState<TItem, TData, TError>>
  } {
    const next = new Map(prev)
    const keep = new Set<string>()

    for (const item of src) {
      const opts = query(item)
      const hash = hashKey(opts.queryKey as ReadonlyArray<unknown>)
      keep.add(hash)
      let entry = next.get(hash)
      if (!entry) {
        const obs = new QueryObserver<TQueryFnData, TError, TData>(
          qc,
          buildObserverOptions(item) as any,
        )
        entry = {
          observer: obs as unknown as QueryObserver<TData, TError>,
          unsubscribe: null,
        }
        next.set(hash, entry)
      } else {
        // Same queryKey but `query(item)` might have changed `enabled`
        // (or other passthrough options). Keep observer options in sync.
        entry.observer.setOptions({
          ...entry.observer.options,
          ...(buildObserverOptions(item) as any),
        })
      }
      // Ensure subscription state matches mount state — covers both
      // newly-spawned observers and pre-existing observers that were
      // created while unmounted (`syncFx` ran on source change before
      // anyone called `mounted()`).
      if (isMounted && !entry.unsubscribe) {
        entry.unsubscribe = entry.observer.subscribe(dispatchRecompute)
      }
    }

    for (const [hash, entry] of next) {
      if (!keep.has(hash)) {
        entry.unsubscribe?.()
        entry.observer.destroy()
        next.delete(hash)
      }
    }

    return { next, items: itemsFromObservers(src, next) }
  }

  // Triggered whenever an observer emits a result (subscribe callback)
  // OR when source changes — re-projects $items.
  const recomputeFx = attach({
    source: { observers: $observers, currentSource: source },
    effect: ({ observers, currentSource }) => {
      return itemsFromObservers(currentSource, observers)
    },
  })
  sample({ clock: recomputeFx.doneData, target: itemsUpdated })

  // Source sync effect — applies diff, mutates observer subscriptions
  // when mounted, then dispatches the items snapshot. When the scope
  // has no QueryClient yet we still run, but the diff produces an
  // empty observer set (no `new QueryObserver(qc, ...)` calls), so
  // `$items` shows default-pending state and observers spawn the
  // moment qc becomes available.
  const syncFx = attach({
    source: {
      qc: $queryClient,
      observers: $observers,
      refCount: $refCount,
      currentSource: source,
    },
    effect: ({ qc, observers, refCount, currentSource }) => {
      if (!qc) {
        return {
          next: observers,
          items: currentSource.map(defaultItemState),
        }
      }
      const dispatchRecompute = scopeBind(recomputeFx, { safe: true })
      return diffSource(
        qc,
        currentSource,
        observers,
        refCount > 0,
        () => dispatchRecompute(),
      )
    },
  })
  sample({
    clock: syncFx.doneData,
    fn: (payload) => payload.next,
    target: observersChanged,
  })
  sample({
    clock: syncFx.doneData,
    fn: (payload) => payload.items,
    target: itemsUpdated,
  })

  sample({ clock: source, target: syncFx })
  sample({ clock: $queryClient, target: syncFx })

  // Mount lifecycle — increment refCount, then run syncFx so observers
  // get spawned (if missing) and subscribed (because `refCount > 0`
  // now). Same path covers the first-ever mount AND
  // existing-but-unsubscribed observers (created while unmounted, e.g.
  // on a source-change in a not-yet-mounted scope).
  const mountFx = attach({
    source: $refCount,
    effect: (refCount) => refCount + 1,
  })
  sample({ clock: mounted, target: mountFx })
  sample({ clock: mountFx.doneData, target: refCountChanged })
  sample({ clock: mountFx.done, target: syncFx })

  const unmountFx = attach({
    source: { observers: $observers, refCount: $refCount },
    effect: ({ observers, refCount }) => {
      const nextRefCount = Math.max(0, refCount - 1)
      if (nextRefCount === 0) {
        for (const entry of observers.values()) {
          entry.unsubscribe?.()
          entry.unsubscribe = null
        }
      }
      return nextRefCount
    },
  })
  sample({ clock: unmounted, target: unmountFx })
  sample({ clock: unmountFx.doneData, target: refCountChanged })

  // Refresh — invalidate all observed queries; observer subscribers
  // pick up the refetched data and refresh $items via recomputeFx.
  const refreshFx = attach({
    source: $observers,
    effect: async (observers) => {
      await Promise.all(
        [...observers.values()].map((entry) =>
          entry.observer.refetch().catch(() => undefined),
        ),
      )
    },
  })
  sample({ clock: refresh, target: refreshFx })

  const refreshOneFx = attach({
    source: $observers,
    effect: async (
      observers,
      item: TItem,
    ) => {
      const opts = query(item)
      const hash = hashKey(opts.queryKey as ReadonlyArray<unknown>)
      const entry = observers.get(hash)
      if (!entry) return
      await entry.observer.refetch().catch(() => undefined)
    },
  })
  sample({ clock: refreshOne, target: refreshOneFx })

  // Prefetch — for SSR. Walks source, calls qc.fetchQuery for each item
  // in parallel, then re-runs syncFx so $items reflects the populated
  // cache.
  const prefetchFx = attach({
    source: { qc: $queryClient, currentSource: source },
    effect: async ({ qc, currentSource }) => {
      if (!qc) return
      await Promise.all(
        currentSource.map((item) => {
          const opts = query(item)
          if (opts.enabled === false) return Promise.resolve()
          return qc
            .fetchQuery({
              ...sharedOptions,
              ...opts,
            } as any)
            .catch(() => undefined)
        }),
      )
    },
  })
  sample({ clock: prefetch, target: prefetchFx })
  // After prefetch resolves, re-sync to update $items from QC cache.
  sample({ clock: prefetchFx.done, target: syncFx })

  // Derived stores — convenience views.
  const $data = $items.map((items) => items.map((it) => it.data))
  const $isPending = $items.map((items) =>
    items.length === 0 ? false : items.some((it) => it.isPending),
  )
  const $isSuccess = $items.map((items) =>
    items.length === 0 ? true : items.every((it) => it.isSuccess),
  )
  const $isFetching = $items.map((items) => items.some((it) => it.isFetching))
  const $isError = $items.map((items) => items.some((it) => it.isError))

  const result: QueriesResult<TItem, TData, TError> = {
    $items,
    $data,
    $isPending,
    $isSuccess,
    $isFetching,
    $isError,
    mounted,
    unmounted,
    refresh,
    refreshOne,
    prefetch,
    $queryClient,
    __family: true,
  }

  // Internal: callable from the suspense hook to reconstruct the
  // QueryObserver options for one source item (with sharedOptions
  // merged on top of `query(item)` and the default `enabled: true`).
  // The hook then feeds this into `qc.fetchQuery` to obtain a
  // deduped-by-queryHash inflight promise to throw at React.
  Object.defineProperty(result, '__queryFor', {
    enumerable: false,
    value: buildObserverOptions,
  })

  return result

  function defaultItemState(item: TItem): QueryItemState<TItem, TData, TError> {
    return {
      source: item,
      data: undefined,
      error: null,
      status: 'pending',
      isPending: true,
      isFetching: false,
      isSuccess: false,
      isError: false,
      isPlaceholderData: false,
      fetchStatus: 'idle',
    }
  }
}

function parseArgs<TItem, TQueryFnData, TError, TData, TQueryKey extends ReadonlyArray<unknown>>(
  arg1:
    | QueryClient
    | CreateQueriesOptions<TItem, TQueryFnData, TError, TData, TQueryKey>,
  arg2?: CreateQueriesOptions<TItem, TQueryFnData, TError, TData, TQueryKey>,
): [
  QueryClient | null,
  CreateQueriesOptions<TItem, TQueryFnData, TError, TData, TQueryKey>,
] {
  if (arg2 !== undefined) {
    return [arg1 as QueryClient, arg2]
  }
  return [
    null,
    arg1 as CreateQueriesOptions<
      TItem,
      TQueryFnData,
      TError,
      TData,
      TQueryKey
    >,
  ]
}
