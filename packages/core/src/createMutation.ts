import {
  createEffect,
  createEvent,
  createStore,
  sample,
  scopeBind,
} from 'effector'
import { MutationObserver } from '@tanstack/query-core'
import type { MutateOptions, QueryClient } from '@tanstack/query-core'
import { sidConfig, warnMissingName } from './createBaseQuery'
import type { CreateMutationOptions, MutationResult } from './types'

type MutationStatus = 'idle' | 'pending' | 'success' | 'error'

export function createMutation<
  TData = unknown,
  TError = Error,
  TVariables = void,
  TOnMutateResult = unknown,
>(
  queryClient: QueryClient,
  options: CreateMutationOptions<TData, TError, TVariables, TOnMutateResult>,
): MutationResult<TData, TError, TVariables> {
  const { name, ...observerOptions } = options

  if (!name) warnMissingName('createMutation')

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

  const observer = new MutationObserver<
    TData,
    TError,
    TVariables,
    TOnMutateResult
  >(queryClient, observerOptions)

  let unsubscribeObserver: (() => void) | undefined

  const start = createEvent<void>()
  const unmounted = createEvent<void>()

  const startFx = createEffect(() => {
    const dispatchData = scopeBind(dataUpdated, { safe: true })
    const dispatchError = scopeBind(errorUpdated, { safe: true })
    const dispatchStatus = scopeBind(statusUpdated, { safe: true })
    const dispatchVariables = scopeBind(variablesUpdated, { safe: true })
    const dispatchIsPaused = scopeBind(isPausedUpdated, { safe: true })
    const dispatchFinishedSuccess = scopeBind(finishedSuccess, { safe: true })
    const dispatchFinishedFailure = scopeBind(finishedFailure, { safe: true })

    unsubscribeObserver?.()

    // Track status transitions to emit `finished.success` / `finished.failure`
    // exactly once per pending → terminal transition. The observer holds at
    // most one inflight mutation at a time, so a single previous-status flag
    // is sufficient.
    let prevStatus: MutationStatus = 'idle'

    unsubscribeObserver = observer.subscribe((result) => {
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
  })

  sample({ clock: start, target: startFx })

  const unmountFx = createEffect(() => {
    unsubscribeObserver?.()
    unsubscribeObserver = undefined
  })
  sample({ clock: unmounted, target: unmountFx })

  const mutate = createEvent<TVariables>()

  // Fire-and-forget: don't return the promise so allSettled doesn't block
  // (would deadlock under fake timers since observer.mutate awaits the user's
  // mutationFn). Errors are tracked via the observer subscription which
  // updates $error/$status and emits `finished.failure`.
  const mutateFx = createEffect((variables: TVariables) => {
    observer.mutate(variables).catch(() => {})
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

  const mutateWithFx = createEffect(
    ({
      variables,
      ...callbacks
    }: {
      variables: TVariables
      onSuccess?: MutateOptions<TData, TError, TVariables>['onSuccess']
      onError?: MutateOptions<TData, TError, TVariables>['onError']
      onSettled?: MutateOptions<TData, TError, TVariables>['onSettled']
    }) => {
      observer.mutate(variables, callbacks).catch(() => {})
    },
  )

  sample({ clock: mutateWith, target: mutateWithFx })

  const reset = createEvent<void>()

  const resetFx = createEffect(() => {
    observer.reset()
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
