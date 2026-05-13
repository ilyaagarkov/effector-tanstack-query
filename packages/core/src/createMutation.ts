import {
  attach,
  createEvent,
  createStore,
  sample,
  scopeBind,
} from 'effector'
import type { Store } from 'effector'
import { MutationObserver } from '@tanstack/query-core'
import type { MutateOptions, QueryClient } from '@tanstack/query-core'
import { $queryClient } from './queryClient'
import { sidConfig, warnMissingName } from './createBaseQuery'
import type { CreateMutationOptions, MutationResult } from './types'

type MutationStatus = 'idle' | 'pending' | 'success' | 'error'

export function createMutation<
  TData = unknown,
  TError = Error,
  TVariables = void,
  TOnMutateResult = unknown,
>(
  arg1:
    | QueryClient
    | CreateMutationOptions<TData, TError, TVariables, TOnMutateResult>,
  arg2?: CreateMutationOptions<TData, TError, TVariables, TOnMutateResult>,
): MutationResult<TData, TError, TVariables> {
  const [explicitClient, options] = parseMutationArgs<
    TData,
    TError,
    TVariables,
    TOnMutateResult
  >(arg1, arg2)

  const { name, ...observerOptions } = options

  if (!name) warnMissingName('createMutation')

  const $effectiveClient: Store<QueryClient | null> = explicitClient
    ? createStore(explicitClient as QueryClient | null, {
        serialize: 'ignore',
      })
    : $queryClient

  const dataUpdated = createEvent<TData | undefined>()
  const errorUpdated = createEvent<TError | null>()
  const statusUpdated = createEvent<MutationStatus>()
  const variablesUpdated = createEvent<TVariables | undefined>()
  const isPausedUpdated = createEvent<boolean>()
  const finishedSuccess = createEvent<{ params: TVariables; result: TData }>()
  const finishedFailure = createEvent<{ params: TVariables; error: TError }>()

  const $data = createStore<TData | undefined>(undefined, {
    skipVoid: false,
    ...sidConfig(name, '$data'),
  }).on(dataUpdated, (_, v) => v)
  const $error = createStore<TError | null>(null, {
    skipVoid: false,
    ...sidConfig(name, '$error'),
  }).on(errorUpdated, (_, v) => v)
  const $status = createStore<MutationStatus>('idle', {
    ...sidConfig(name, '$status'),
  }).on(statusUpdated, (_, v) => v)
  const $variables = createStore<TVariables | undefined>(undefined, {
    skipVoid: false,
    ...sidConfig(name, '$variables'),
  }).on(variablesUpdated, (_, v) => v)
  const $isPaused = createStore(false, {
    ...sidConfig(name, '$isPaused'),
  }).on(isPausedUpdated, (_, v) => v)

  // Derived stores via .map don't take sid — they recompute from $status on
  // the client after fork({ values }).
  const $isPending = $status.map((s) => s === 'pending')
  const $isSuccess = $status.map((s) => s === 'success')
  const $isError = $status.map((s) => s === 'error')
  const $isIdle = $status.map((s) => s === 'idle')

  // Per-scope observer — same pattern as createBaseQuery. Each fork scope
  // gets its own MutationObserver bound to its scope's QueryClient.
  type Observer = MutationObserver<TData, TError, TVariables, TOnMutateResult>
  const $observer = createStore<Observer | null>(null, {
    serialize: 'ignore',
  })
  const observerCreated = createEvent<Observer>()
  $observer.on(observerCreated, (_, obs) => obs)

  const observerSubscriptions = new WeakMap<Observer, () => void>()

  const start = createEvent<void>()
  const unmounted = createEvent<void>()

  const startFx = attach({
    source: { qc: $effectiveClient, observer: $observer },
    effect: ({ qc, observer: existingObserver }) => {
      if (!qc) {
        throw new Error(
          '[@tanstack/query-effector] No QueryClient is set for createMutation. Call setQueryClient(qc) before start, ' +
            'pass it to fork({ values: [[$queryClient, qc]] }), or pass it explicitly to the factory.',
        )
      }

      const observer =
        existingObserver ??
        new MutationObserver<TData, TError, TVariables, TOnMutateResult>(
          qc,
          observerOptions,
        )

      const dispatchData = scopeBind(dataUpdated, { safe: true })
      const dispatchError = scopeBind(errorUpdated, { safe: true })
      const dispatchStatus = scopeBind(statusUpdated, { safe: true })
      const dispatchVariables = scopeBind(variablesUpdated, { safe: true })
      const dispatchIsPaused = scopeBind(isPausedUpdated, { safe: true })
      const dispatchFinishedSuccess = scopeBind(finishedSuccess, { safe: true })
      const dispatchFinishedFailure = scopeBind(finishedFailure, { safe: true })

      observerSubscriptions.get(observer)?.()

      // Track status transitions to emit `finished.success` / `finished.failure`
      // exactly once per pending → terminal transition. The observer holds at
      // most one inflight mutation at a time, so a single previous-status flag
      // is sufficient.
      let prevStatus: MutationStatus = 'idle'

      const unsubscribe = observer.subscribe((result) => {
        dispatchData(result.data)
        dispatchError(result.error)
        dispatchStatus(result.status)
        dispatchVariables(result.variables)
        dispatchIsPaused(result.isPaused)

        if (prevStatus === 'pending') {
          if (result.status === 'success') {
            dispatchFinishedSuccess({
              params: result.variables as TVariables,
              result: result.data as TData,
            })
          } else if (result.status === 'error') {
            dispatchFinishedFailure({
              params: result.variables as TVariables,
              error: result.error as TError,
            })
          }
        }
        prevStatus = result.status
      })

      observerSubscriptions.set(observer, unsubscribe)

      return observer
    },
  })

  sample({ clock: start, target: startFx })
  sample({ clock: startFx.doneData, target: observerCreated })

  // Mutation observers (unlike query observers) live across mount cycles —
  // their data state survives unmount and can be observed again on re-start.
  // Match that by keeping `$observer` populated; we only drop the
  // subscription so listeners stop receiving updates after unmount.
  const unmountFx = attach({
    source: $observer,
    effect: (observer) => {
      if (!observer) return
      observerSubscriptions.get(observer)?.()
      observerSubscriptions.delete(observer)
    },
  })
  sample({ clock: unmounted, target: unmountFx })

  const mutate = createEvent<TVariables>()

  // Fire-and-forget: don't return the promise so allSettled doesn't block
  // (would deadlock under fake timers since observer.mutate awaits the user's
  // mutationFn). Errors are tracked via the observer subscription which
  // updates $error/$status and emits `finished.failure`.
  const mutateFx = attach({
    source: $observer,
    effect: (observer, variables: TVariables) => {
      if (!observer) return
      observer.mutate(variables).catch(() => {})
    },
  })

  sample({ clock: mutate, target: mutateFx })

  // Per-call callbacks variant: forwards onSuccess/onError/onSettled to
  // observer.mutate(vars, opts). Use this for component-local reactions
  // that don't fit module-level `sample({ clock: finished.success })` wiring.
  const mutateWith = createEvent<{
    variables: TVariables
    onSuccess?: MutateOptions<TData, TError, TVariables>['onSuccess']
    onError?: MutateOptions<TData, TError, TVariables>['onError']
    onSettled?: MutateOptions<TData, TError, TVariables>['onSettled']
  }>()

  const mutateWithFx = attach({
    source: $observer,
    effect: (
      observer,
      {
        variables,
        ...callbacks
      }: {
        variables: TVariables
        onSuccess?: MutateOptions<TData, TError, TVariables>['onSuccess']
        onError?: MutateOptions<TData, TError, TVariables>['onError']
        onSettled?: MutateOptions<TData, TError, TVariables>['onSettled']
      },
    ) => {
      if (!observer) return
      observer.mutate(variables, callbacks).catch(() => {})
    },
  })

  sample({ clock: mutateWith, target: mutateWithFx })

  const reset = createEvent<void>()

  const resetFx = attach({
    source: $observer,
    effect: (observer) => {
      if (!observer) return
      observer.reset()
    },
  })

  sample({ clock: reset, target: resetFx })

  return {
    $data,
    $error,
    $status,
    $variables,
    $isPaused,
    $isPending,
    $isSuccess,
    $isError,
    $isIdle,
    $observer,
    $queryClient: $effectiveClient,
    mutate,
    mutateWith,
    reset,
    start,
    unmounted,
    finished: {
      success: finishedSuccess,
      failure: finishedFailure,
    },
  }
}

function parseMutationArgs<TData, TError, TVariables, TOnMutateResult>(
  arg1:
    | QueryClient
    | CreateMutationOptions<TData, TError, TVariables, TOnMutateResult>,
  arg2?: CreateMutationOptions<TData, TError, TVariables, TOnMutateResult>,
): [
  QueryClient | null,
  CreateMutationOptions<TData, TError, TVariables, TOnMutateResult>,
] {
  if (arg2 !== undefined) {
    return [arg1 as QueryClient, arg2]
  }
  return [
    null,
    arg1 as CreateMutationOptions<TData, TError, TVariables, TOnMutateResult>,
  ]
}
