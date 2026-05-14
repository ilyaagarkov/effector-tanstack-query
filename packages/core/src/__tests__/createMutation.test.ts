import { allSettled, createWatch, fork } from 'effector'
import { QueryClient } from '@tanstack/query-core'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createMutation } from '../createMutation'
import { $queryClient } from '../queryClient'
import { sleep } from './test-utils'

// Real timers: allSettled awaits observer.mutate's microtasks; fake timers
// would deadlock waiting for the user's mutationFn promise to resolve.

describe('createMutation (core)', () => {
  let queryClient: QueryClient

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: { mutations: { retry: false } },
    })
    queryClient.mount()
  })

  afterEach(() => {
    queryClient.clear()
  })

  it('throws on start when no QueryClient is set in scope or no-scope default', async () => {
    const consoleError = vi
      .spyOn(console, 'error')
      .mockImplementation(() => {})

    // Factory created with no client argument — falls back to $queryClient.
    const mutation = createMutation({
      name: 'mutation.noClient',
      mutationFn: () => Promise.resolve('x'),
    })

    const scope = fork() // no $queryClient injected → startFx throws

    await allSettled(mutation.start, { scope })

    // The observer was never created (the throw aborted startFx before
    // dispatching observerCreated), so $observer stays null and $status
    // remains at its initial 'idle' value.
    expect(scope.getState(mutation.$observer)).toBeNull()
    expect(scope.getState(mutation.$status)).toBe('idle')

    consoleError.mockRestore()
  })

  it('emits finished.failure with params + error on a rejected mutation', async () => {
    const failure = vi.fn()
    const mutation = createMutation<string, Error, number>(queryClient, {
      name: 'mutation.failed',
      mutationFn: (n: number) => Promise.reject(new Error(`bad-${n}`)),
    })

    const scope = fork({ values: [[$queryClient, queryClient]] })
    const unwatch = createWatch({
      unit: mutation.finished.failure,
      scope,
      fn: failure,
    })

    await allSettled(mutation.start, { scope })
    await allSettled(mutation.mutate, { scope, params: 7 })
    // mutate is fire-and-forget — wait for the mutationFn promise + the
    // observer callback to dispatch through scopeBind.
    await sleep(20)

    expect(failure).toHaveBeenCalledTimes(1)
    expect(failure).toHaveBeenCalledWith({
      params: 7,
      error: expect.objectContaining({ message: 'bad-7' }),
    })
    unwatch()
  })

  it('unmounted tears down the observer subscription (no further dispatches)', async () => {
    const onStatus = vi.fn()
    const mutation = createMutation<string, Error, void>(queryClient, {
      name: 'mutation.unmount',
      mutationFn: () => sleep(5).then(() => 'ok'),
    })

    const scope = fork({ values: [[$queryClient, queryClient]] })
    const unwatch = createWatch({
      unit: mutation.$status,
      scope,
      fn: onStatus,
    })

    await allSettled(mutation.start, { scope })
    onStatus.mockClear()
    await allSettled(mutation.unmounted, { scope })

    // After unmount, the observer subscription is gone — a follow-up mutate
    // doesn't push status into the effector store anymore.
    await allSettled(mutation.mutate, { scope })
    await sleep(20)

    expect(onStatus).not.toHaveBeenCalled()
    unwatch()
  })

  it('unmounted is a safe no-op when start was never called (no observer)', async () => {
    const mutation = createMutation(queryClient, {
      name: 'mutation.unmountFirst',
      mutationFn: () => Promise.resolve(1),
    })
    const scope = fork({ values: [[$queryClient, queryClient]] })

    // No throw — unmountFx hits the `if (!observer) return` early exit.
    await allSettled(mutation.unmounted, { scope })
    expect(scope.getState(mutation.$observer)).toBeNull()
  })

  it('mutate is a no-op when start was never called', async () => {
    const onStatus = vi.fn()
    const mutation = createMutation<string, Error, void>(queryClient, {
      name: 'mutation.mutateNoStart',
      mutationFn: () => Promise.resolve('x'),
    })
    const scope = fork({ values: [[$queryClient, queryClient]] })
    const unwatch = createWatch({
      unit: mutation.$status,
      scope,
      fn: onStatus,
    })

    await allSettled(mutation.mutate, { scope })
    await sleep(10)
    expect(onStatus).not.toHaveBeenCalled()
    unwatch()
  })

  it('mutateWith invokes per-call onSuccess + onSettled callbacks', async () => {
    const onSuccess = vi.fn()
    const onSettled = vi.fn()
    const mutation = createMutation<string, Error, number>(queryClient, {
      name: 'mutation.mutateWith',
      mutationFn: (n: number) => Promise.resolve(`val-${n}`),
    })
    const scope = fork({ values: [[$queryClient, queryClient]] })
    await allSettled(mutation.start, { scope })
    await allSettled(mutation.mutateWith, {
      scope,
      params: { variables: 3, onSuccess, onSettled },
    })
    await sleep(20)
    // tanstack-query passes (data, variables, onMutateResult, context)
    expect(onSuccess).toHaveBeenCalledTimes(1)
    expect(onSuccess.mock.calls[0]!.slice(0, 3)).toEqual(['val-3', 3, undefined])
    expect(onSettled).toHaveBeenCalled()
  })

  it('mutateWith is a no-op without start', async () => {
    const onSuccess = vi.fn()
    const mutation = createMutation<string, Error, number>(queryClient, {
      name: 'mutation.mutateWithNoStart',
      mutationFn: () => Promise.resolve('x'),
    })
    const scope = fork({ values: [[$queryClient, queryClient]] })
    await allSettled(mutation.mutateWith, {
      scope,
      params: { variables: 1, onSuccess },
    })
    await sleep(10)
    expect(onSuccess).not.toHaveBeenCalled()
  })

  it('reset clears the data/status when observer exists', async () => {
    const mutation = createMutation<string, Error, void>(queryClient, {
      name: 'mutation.reset',
      mutationFn: () => Promise.resolve('done'),
    })
    const scope = fork({ values: [[$queryClient, queryClient]] })
    await allSettled(mutation.start, { scope })
    await allSettled(mutation.mutate, { scope })
    await sleep(20)
    expect(scope.getState(mutation.$data)).toBe('done')

    await allSettled(mutation.reset, { scope })
    await sleep(0)
    expect(scope.getState(mutation.$data)).toBeUndefined()
    expect(scope.getState(mutation.$status)).toBe('idle')
  })

  it('reset is a no-op when start was never called', async () => {
    const mutation = createMutation(queryClient, {
      name: 'mutation.resetNoStart',
      mutationFn: () => Promise.resolve('x'),
    })
    const scope = fork({ values: [[$queryClient, queryClient]] })
    await allSettled(mutation.reset, { scope })
    expect(scope.getState(mutation.$observer)).toBeNull()
  })

  it('reset during a pending mutation does not emit finished.success/failure', async () => {
    const success = vi.fn()
    const failure = vi.fn()
    const mutation = createMutation<string, Error, void>(queryClient, {
      name: 'mutation.resetWhilePending',
      mutationFn: () => sleep(50).then(() => 'done'),
    })
    const scope = fork({ values: [[$queryClient, queryClient]] })
    const u1 = createWatch({
      unit: mutation.finished.success,
      scope,
      fn: success,
    })
    const u2 = createWatch({
      unit: mutation.finished.failure,
      scope,
      fn: failure,
    })

    await allSettled(mutation.start, { scope })
    await allSettled(mutation.mutate, { scope })
    // Mutation is still in flight (50ms). Reset transitions pending → idle —
    // hits the if(prevStatus==='pending') block but takes the implicit
    // neither-success-nor-error fall-through.
    await sleep(5)
    expect(scope.getState(mutation.$status)).toBe('pending')
    await allSettled(mutation.reset, { scope })
    await sleep(60)

    expect(success).not.toHaveBeenCalled()
    expect(failure).not.toHaveBeenCalled()
    u1()
    u2()
  })

  it('mutateWith swallows a rejected mutationFn (covers .catch handler)', async () => {
    const onError = vi.fn()
    const mutation = createMutation<string, Error, number>(queryClient, {
      name: 'mutation.mutateWithReject',
      mutationFn: (n: number) => Promise.reject(new Error(`mw-bad-${n}`)),
    })
    const scope = fork({ values: [[$queryClient, queryClient]] })
    await allSettled(mutation.start, { scope })
    await allSettled(mutation.mutateWith, {
      scope,
      params: { variables: 9, onError },
    })
    await sleep(20)
    // mutateWithFx's `.catch(() => {})` swallows the rejection so the
    // outer effect never fails. The error still flows through the observer
    // subscription to per-call onError + the $error store.
    expect(onError).toHaveBeenCalled()
    expect(scope.getState(mutation.$error)?.message).toBe('mw-bad-9')
  })

  it('does not throw when created without a `name` (covers warn branch)', () => {
    // warnMissingName fires at most once per role across the test process.
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    expect(() =>
      createMutation({
        mutationFn: () => Promise.resolve('x'),
      }),
    ).not.toThrow()
    warn.mockRestore()
  })
})
