// Adapted from @tanstack/react-query 5.100.10; see ../LICENSE.TanStack.
import type {
  DefaultError,
  MutationKey,
  MutationObserverOptions,
} from '@tanstack/query-core'

// Named interfaces (not Omit aliases) keep exported factories portable:
// declarations reference them instead of expanding fields whose types
// Query Core doesn't export (e.g. RetryValue).

/** Result of {@link mutationOptions} called with a `mutationKey`. */
export interface MutationOptionsWithKey<
  TData = unknown,
  TError = DefaultError,
  TVariables = void,
  TOnMutateResult = unknown,
> extends Omit<
    MutationObserverOptions<TData, TError, TVariables, TOnMutateResult>,
    '_defaulted' | 'mutationKey'
  > {
  mutationKey: MutationKey
}

/** Result of {@link mutationOptions} called without a `mutationKey`. */
export interface MutationOptionsWithoutKey<
  TData = unknown,
  TError = DefaultError,
  TVariables = void,
  TOnMutateResult = unknown,
> extends Omit<
    MutationObserverOptions<TData, TError, TVariables, TOnMutateResult>,
    '_defaulted' | 'mutationKey'
  > {}

/**
 * Typed identity for reusable mutation options. Depends only on
 * `@tanstack/query-core`; the result is accepted by `createMutation` and by
 * native consumers such as `useMutation` from `@tanstack/react-query`.
 */
export function mutationOptions<
  TData = unknown,
  TError = DefaultError,
  TVariables = void,
  TOnMutateResult = unknown,
>(
  options: MutationOptionsWithKey<TData, TError, TVariables, TOnMutateResult>,
): MutationOptionsWithKey<TData, TError, TVariables, TOnMutateResult>

export function mutationOptions<
  TData = unknown,
  TError = DefaultError,
  TVariables = void,
  TOnMutateResult = unknown,
>(
  options: MutationOptionsWithoutKey<
    TData,
    TError,
    TVariables,
    TOnMutateResult
  >,
): MutationOptionsWithoutKey<TData, TError, TVariables, TOnMutateResult>

export function mutationOptions(options: unknown) {
  return options
}
