import { combine, createStore, is } from 'effector'
import type { Store } from 'effector'
import type {
  QueryClient,
  QueryKey,
  QueryObserverOptions,
} from '@tanstack/query-core'
import type {
  EffectorQueryKey,
  OptionsSource,
  QueryArguments,
  StoreOrValue,
} from './types'

export function resolveQueryArguments<TOptions>(
  args: QueryArguments<TOptions>,
): [QueryClient | null, TOptions] {
  // Match the pre-factory contract: an explicit `undefined` second argument
  // still selects the single-argument form.
  if (args.length === 2 && args[1] !== undefined) return args
  return [null, args[0] as TOptions]
}

export function resolveKey(key: EffectorQueryKey): Store<QueryKey> {
  const storePositions: Array<number> = []
  const stores: Array<Store<unknown>> = []

  key.forEach((item, i) => {
    if (is.store(item)) {
      storePositions.push(i)
      stores.push(item)
    }
  })

  if (stores.length === 0) {
    return createStore(key)
  }

  return combine(
    stores,
    (values): QueryKey =>
      key.map((item, i) => {
        const storeIdx = storePositions.indexOf(i)
        return storeIdx >= 0 ? values[storeIdx] : item
      }),
  )
}

type AnyQueryObserverOptions = QueryObserverOptions<any, any, any, any, any>

/** Native `enabled`: a boolean or TanStack's `(query) => boolean` callback. */
export type ResolvedEnabled = Exclude<
  AnyQueryObserverOptions['enabled'],
  undefined
>

/** Scoped native options with a resolved key and a defined enabled. */
export type ResolvedOptions<
  TOptions extends AnyQueryObserverOptions = AnyQueryObserverOptions,
> = Omit<
  TOptions,
  | 'enabled'
  | 'name'
  | 'queryKey'
  | 'refetchInterval'
  | 'notifyOnChangeProps'
  | 'queryHash'
  | '_defaulted'
> & {
  enabled: ResolvedEnabled
  refetchInterval?: TOptions['refetchInterval'] | number | false
  queryKey: QueryKey
  notifyOnChangeProps?: AnyQueryObserverOptions['notifyOnChangeProps']
  queryHash?: string
  _defaulted?: boolean
}

type AdapterOptions<TOptions extends AnyQueryObserverOptions> = {
  enabled?: StoreOrValue<boolean>
  refetchInterval?:
    | TOptions['refetchInterval']
    | Store<number | false | undefined>
  name?: string
}
type InlineOptionsInput<TOptions extends AnyQueryObserverOptions> =
  AdapterOptions<TOptions> &
    Omit<TOptions, 'queryKey' | 'enabled' | 'refetchInterval'> & {
      queryKey: EffectorQueryKey
    }
type QueryOptionsInput<TOptions extends AnyQueryObserverOptions> =
  | InlineOptionsInput<TOptions>
  | (AdapterOptions<TOptions> & {
      queryKey?: never
      source: OptionsSource
      query: (params: any) => TOptions & { queryKey: QueryKey }
    })

/** Maps the plain values of a store or a shallow shape of stores. */
export function resolveSource<T>(
  source: OptionsSource,
  fn: (params: any) => T,
): Store<T> {
  return is.store(source) ? source.map(fn) : combine(source, fn)
}

/** An exception thrown by a factory's `query` callback. */
export type FactoryFailure = { error: unknown }

/**
 * Current options of a query, or the failure that prevented computing them.
 * Only the factory form can fail; inline options always resolve.
 */
export type QueryState<TOptions> =
  | { options: TOptions; failure: null }
  | { options: null; failure: FactoryFailure }

/**
 * Resolves `enabled` the way TanStack does: a callback is evaluated against
 * the cached query for these options. Only call this from effects — a
 * callback is user code and may throw.
 */
export function isEnabledFor(
  queryClient: QueryClient,
  options: { enabled?: ResolvedEnabled; queryKey: QueryKey },
): boolean {
  const { enabled } = options
  if (typeof enabled !== 'function') return enabled !== false
  const defaulted = queryClient.defaultQueryOptions(
    options as AnyQueryObserverOptions,
  )
  return enabled(queryClient.getQueryCache().build(queryClient, defaulted))
}

function resolveFactoryOptions<
  TOptions extends AnyQueryObserverOptions,
>(options: {
  source: OptionsSource
  query: (params: any) => TOptions & { queryKey: QueryKey }
  enabled?: StoreOrValue<boolean>
  refetchInterval?:
    | TOptions['refetchInterval']
    | Store<number | false | undefined>
  name?: string
}): Store<QueryState<ResolvedOptions<TOptions>>> {
  const { enabled, refetchInterval, name: _name, ...binding } = options
  // The factory is user code running inside an effector computation. An
  // exception escaping it would be swallowed on updates and would leave the
  // effector kernel in a broken state when thrown while a fork scope lazily
  // initializes this store. Capture it and surface it as a query error.
  const runQuery = (
    params: unknown,
  ): QueryState<TOptions & { queryKey: QueryKey }> => {
    try {
      return { options: binding.query(params), failure: null }
    } catch (error) {
      return { options: null, failure: { error } }
    }
  }
  const $raw = resolveSource(binding.source, runQuery)
  const $enabled = is.store(enabled)
    ? enabled
    : createStore(enabled, { skipVoid: false, serialize: 'ignore' })
  const $interval = is.store(refetchInterval)
    ? refetchInterval
    : createStore(refetchInterval, { skipVoid: false, serialize: 'ignore' })
  return combine(
    { raw: $raw, enabled: $enabled, interval: $interval },
    ({ raw, enabled, interval }): QueryState<ResolvedOptions<TOptions>> => {
      if (raw.failure !== null) return { options: null, failure: raw.failure }
      const { options } = raw
      // A defined top-level value overrides the factory; a callback is kept
      // as is and evaluated by TanStack against the query.
      const effectiveEnabled: ResolvedEnabled =
        enabled ?? options.enabled ?? true
      return {
        options: {
          ...options,
          enabled:
            typeof options.queryFn === 'symbol' ? false : effectiveEnabled,
          ...(interval !== undefined ? { refetchInterval: interval } : {}),
          notifyOnChangeProps: 'all',
        },
        failure: null,
      }
    },
  )
}

function getInlineUpdateBase(
  previous: AnyQueryObserverOptions,
  mount: boolean,
) {
  if (mount) return previous

  const { _defaulted, queryHash, ...rest } = previous
  return rest
}

type InlineCapturedOptions<TOptions extends AnyQueryObserverOptions> = Omit<
  InlineOptionsInput<TOptions>,
  'queryKey' | 'enabled' | 'name'
>
type InlineNativeOptions<TOptions extends AnyQueryObserverOptions> = Omit<
  InlineCapturedOptions<TOptions>,
  'refetchInterval'
> & { refetchInterval?: TOptions['refetchInterval'] }
type CurrentOptions<TOptions extends AnyQueryObserverOptions> =
  | ResolvedOptions<TOptions>
  | (InlineNativeOptions<TOptions> & { queryKey: QueryKey; enabled: boolean })
type PrefetchOptions<TOptions extends AnyQueryObserverOptions> =
  | Omit<ResolvedOptions<TOptions>, 'enabled'>
  | (InlineNativeOptions<TOptions> & { queryKey: QueryKey })

/** Inline updates retain observer options; factory updates use the new snapshot. */
export function resolveQueryDefinition<
  TOptions extends AnyQueryObserverOptions,
>(
  options: QueryOptionsInput<TOptions>,
): QueryDefinition<CurrentOptions<TOptions>, PrefetchOptions<TOptions>> {
  if (options.queryKey === undefined) {
    const $state = resolveFactoryOptions(options)
    return {
      $state,
      $options: $state.map((state) => state.options),
      // No key while the factory fails, so refresh cannot target the cache.
      $resolvedKey: $state.map((state) => state.options?.queryKey ?? null),
      $enabled: $state.map(
        (state) => state.options !== null && state.options.enabled !== false,
      ),
      create: (current: CurrentOptions<TOptions>) => current,
      update: (
        _previous: AnyQueryObserverOptions,
        current: CurrentOptions<TOptions>,
        _mount: boolean,
      ) => current,
      prefetch: (current: CurrentOptions<TOptions>) => current,
    }
  }

  const { queryKey, enabled, name: _name, ...capturedOptions } = options
  const interval = capturedOptions.refetchInterval
  const $interval: Store<number | false | undefined> | undefined = is.store<
    unknown,
    number | false | undefined
  >(interval)
    ? interval
    : undefined
  if ($interval) delete capturedOptions.refetchInterval
  // The only non-native value in this field was the Store removed above.
  // Narrow that field without copying the captured object a second time.
  const restOptions = capturedOptions as Omit<
    typeof capturedOptions,
    'refetchInterval'
  > & {
    refetchInterval?: TOptions['refetchInterval']
  }
  const $resolvedKey = resolveKey(queryKey)
  const $enabled = is.store(enabled) ? enabled : createStore(enabled ?? true)
  const $options = combine(
    {
      queryKey: $resolvedKey,
      enabled: $enabled,
      refetchInterval:
        $interval ?? createStore<number | false | undefined>(false),
    },
    ({ queryKey, enabled, refetchInterval }) => ({
      ...restOptions,
      queryKey,
      enabled,
      ...($interval ? { refetchInterval } : {}),
    }),
  )
  return {
    $state: $options.map((current) => ({ options: current, failure: null })),
    $options,
    $resolvedKey,
    $enabled,
    create: ({ queryKey, enabled }: CurrentOptions<TOptions>) => ({
      ...restOptions,
      queryKey,
      enabled,
    }),
    update: (
      previous: AnyQueryObserverOptions,
      current: CurrentOptions<TOptions>,
      mount: boolean,
    ) => {
      const base = getInlineUpdateBase(previous, mount)
      return {
        ...base,
        queryKey: current.queryKey,
        enabled: current.enabled,
        ...($interval ? { refetchInterval: current.refetchInterval } : {}),
      }
    },
    prefetch: ({ queryKey }: CurrentOptions<TOptions>) => ({
      ...restOptions,
      queryKey,
    }),
  }
}
/** Reactive options and the operation-specific policies consumed by query owners. */
export interface QueryDefinition<
  TOptions extends ResolvedOptions = ResolvedOptions,
  TFetchOptions = Omit<ResolvedOptions, 'enabled'>,
> {
  /** Options or the factory failure; the source of truth for owners. */
  $state: Store<QueryState<TOptions>>
  /** Current options; `null` while a factory fails. */
  $options: Store<TOptions | null>
  /** Current key; `null` while a factory fails. */
  $resolvedKey: Store<QueryKey | null>
  $enabled: Store<boolean>
  create: (current: TOptions) => ResolvedOptions
  update: (
    previous: AnyQueryObserverOptions,
    current: TOptions,
    mount: boolean,
  ) => ResolvedOptions
  prefetch: (current: TOptions) => TFetchOptions
}
