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
  if (args.length === 2) return args
  return [null, args[0]]
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

/** Scoped native options with a resolved key and boolean enabled. */
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
  enabled: boolean
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
}): Store<ResolvedOptions<TOptions>> {
  const { enabled, refetchInterval, name: _name, ...binding } = options
  const $raw = is.store(binding.source)
    ? binding.source.map(binding.query)
    : combine(binding.source, binding.query)
  const $enabled = is.store(enabled)
    ? enabled
    : createStore(enabled, { skipVoid: false, serialize: 'ignore' })
  const $interval = is.store(refetchInterval)
    ? refetchInterval
    : createStore(refetchInterval, { skipVoid: false, serialize: 'ignore' })
  return combine(
    { options: $raw, enabled: $enabled, interval: $interval },
    ({ options, enabled, interval }): ResolvedOptions<TOptions> => {
      const effectiveEnabled = enabled ?? options.enabled ?? true
      if (typeof effectiveEnabled !== 'boolean') {
        throw new TypeError(
          '[@effector-tanstack-query/core] enabled must resolve to a boolean. ' +
            'Use combine to derive a boolean store, or override factory enabled at the top level.',
        )
      }
      return {
        ...options,
        enabled: effectiveEnabled && typeof options.queryFn !== 'symbol',
        ...(interval !== undefined ? { refetchInterval: interval } : {}),
        notifyOnChangeProps: 'all',
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
    const $options = resolveFactoryOptions(options)
    return {
      $options,
      $resolvedKey: $options.map((o) => o.queryKey),
      $enabled: $options.map((o) => o.enabled),
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
  $options: Store<TOptions>
  $resolvedKey: Store<QueryKey>
  $enabled: Store<boolean>
  create: (current: TOptions) => ResolvedOptions
  update: (
    previous: AnyQueryObserverOptions,
    current: TOptions,
    mount: boolean,
  ) => ResolvedOptions
  prefetch: (current: TOptions) => TFetchOptions
}
