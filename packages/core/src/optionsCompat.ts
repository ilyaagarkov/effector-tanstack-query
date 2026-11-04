import type {
  DefaultError,
  QueryObserverOptions,
  QueryKey,
  InfiniteData,
  InfiniteQueryObserver,
  InfiniteQueryObserverOptions,
  InfiniteQueryPageParamsOptions,
} from '@tanstack/query-core'

// Query 5.0 has data tags but no error tags or skipToken. Derive optional
// features from the installed core instead of importing newer named exports.
type CoreExports = typeof import('@tanstack/query-core')
type CoreSymbol<K extends PropertyKey> = K extends keyof CoreExports
  ? Extract<CoreExports[K], symbol>
  : never
type Tag<Value, Error> = {
  [P in CoreSymbol<'dataTagSymbol'>]: Value
} & {
  [P in CoreSymbol<'dataTagErrorSymbol'>]: Error
}
export type DataTag<Key, Value, Error> =
  Key extends Tag<any, any> ? Key : Key & Tag<Value, Error>
// A named result lets consumers emit portable declarations for exported factories.
export type QueryOptionsWithDataTag<
  TOptions,
  TQueryKey extends QueryKey,
  TCacheData,
  TError,
> = TOptions & {
  queryKey: DataTag<TQueryKey, TCacheData, TError>
}
export type SkipToken = Exclude<
  QueryObserverOptions['queryFn'],
  Function | undefined
>
export type NonUndefinedGuard<T> = T extends undefined ? never : T
export type OmitKeyof<T, K extends keyof T> = Omit<T, K>

// InfiniteQueryObserverOptions lost its TQueryData parameter during v5.
// These stable component interfaces describe the same options in both shapes.
export type InfiniteOptions<
  TQueryFnData = unknown,
  TError = DefaultError,
  TData = TQueryFnData,
  TQueryKey extends QueryKey = QueryKey,
  TPageParam = unknown,
> = QueryObserverOptions<
  TQueryFnData,
  TError,
  TData,
  InfiniteData<TQueryFnData, TPageParam>,
  TQueryKey,
  TPageParam
> &
  InfiniteQueryPageParamsOptions<TQueryFnData, TPageParam>

// Before Query Core 5.80 the infinite observer types take an extra TQueryData
// parameter in 4th position. Probe the installed shape: a 4th argument that
// is the key type shows up as `queryKey` only in the newer layout.
type LegacyInfiniteGenerics =
  NonNullable<
    InfiniteQueryObserverOptions<unknown, unknown, unknown, ['probe']>['queryKey']
  > extends ['probe']
    ? false
    : true

/**
 * `InfiniteQueryObserver` for both layouts. The arguments are conditional on
 * a non-generic check, so they resolve to the installed positions; the old
 * layout's 6th parameter (page param) keeps its `unknown` default.
 */
export type InfiniteObserver<
  TQueryFnData,
  TError,
  TData,
  TQueryKey extends QueryKey,
  TPageParam,
> = InfiniteQueryObserver<
  TQueryFnData,
  TError,
  TData,
  LegacyInfiniteGenerics extends true
    ? InfiniteData<TQueryFnData, TPageParam>
    : TQueryKey,
  LegacyInfiniteGenerics extends true ? TQueryKey : TPageParam
>

// Deferred conditional inference barrier, also available before TS 5.4.
export type NoInfer<T> = [T][T extends any ? 0 : never]
