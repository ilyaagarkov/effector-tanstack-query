import type {
  DefaultError,
  QueryObserverOptions,
  QueryKey,
  InfiniteData,
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

// Deferred conditional inference barrier, also available before TS 5.4.
export type NoInfer<T> = [T][T extends any ? 0 : never]
