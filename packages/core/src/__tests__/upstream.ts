// What the installed @tanstack/query-core passes to mutation callbacks as the
// onMutate result. Its nullability changed across 5.x (e.g. per-call
// onSuccess got `| undefined` and option-level onSuccess lost it later), so
// tests that run against several versions compare to upstream, not a literal.
import type { MutateOptions, MutationObserverOptions } from '@tanstack/query-core'

type Callback = 'onSuccess' | 'onError' | 'onSettled'
type Arg<F, I extends number> = F extends (...args: infer A) => any
  ? A[I]
  : never
type RollbackIndex<K extends Callback> = K extends 'onSettled' ? 3 : 2

/** The onMutate result a per-call (`mutate(vars, { … })`) callback receives. */
export type CallRollback<TOnMutateResult, K extends Callback> = Arg<
  NonNullable<MutateOptions<any, any, any, TOnMutateResult>[K]>,
  RollbackIndex<K>
>

/** The onMutate result an option-level callback receives. */
export type OptionRollback<TOnMutateResult, K extends Callback> = Arg<
  NonNullable<MutationObserverOptions<any, any, any, TOnMutateResult>[K]>,
  RollbackIndex<K>
>
