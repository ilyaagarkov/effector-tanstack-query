import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { act, render } from '@testing-library/react'
import * as React from 'react'
import { Provider } from 'effector-react'
import { allSettled, createEvent, createStore, fork, sample } from 'effector'
import { QueryClient, onlineManager } from '@tanstack/query-core'
import { sleep } from './test-utils'
import { createMutation } from '../createMutation'
import { useMutation } from '../react'
import type { Scope } from 'effector'

function renderWithScope(scope: Scope, ui: React.ReactElement) {
  return render(<Provider value={scope}>{ui}</Provider>)
}

function mockOnline(value: boolean) {
  return vi.spyOn(onlineManager, 'isOnline').mockReturnValue(value)
}

describe('createMutation — unmounted lifecycle', () => {
  let queryClient: QueryClient

  beforeEach(() => {
    vi.useFakeTimers()
    queryClient = new QueryClient({
      defaultOptions: { mutations: { retry: false } },
    })
    queryClient.mount()
  })

  afterEach(() => {
    queryClient.clear()
    vi.useRealTimers()
  })

  it('should unsubscribe observer when unmounted is called', async () => {
    const mutation = createMutation(queryClient, {
      name: 'unmountObserver',
      mutationFn: () => sleep(5).then(() => 'done'),
    })

    const scope = fork()
    await allSettled(mutation.start, { scope })
    await allSettled(mutation.mutate, { scope, params: undefined })
    await vi.advanceTimersByTimeAsync(6)

    expect(scope.getState(mutation.$status)).toBe('success')

    await allSettled(mutation.unmounted, { scope })

    // After unmount, future observer notifications no longer reach scope stores
    await allSettled(mutation.reset, { scope })
    await vi.advanceTimersByTimeAsync(0)

    // Reset would normally flip $status back to 'idle' via observer subscription
    // — but with the subscription torn down, scope state is frozen at 'success'.
    expect(scope.getState(mutation.$status)).toBe('success')
  })

  it('should let useMutation hook gc the mutation entry on component unmount', async () => {
    const mutation = createMutation(queryClient, {
      name: 'hookUnmountGc',
      mutationFn: () => sleep(5).then(() => 'done'),
      gcTime: 50,
    })

    function Page() {
      useMutation(mutation)
      return null
    }

    const scope = fork()
    const rendered = renderWithScope(scope, <Page />)

    await act(async () => {
      await allSettled(mutation.mutate, { scope, params: undefined })
      await vi.advanceTimersByTimeAsync(11)
    })

    expect(queryClient.getMutationCache().getAll().length).toBe(1)

    rendered.unmount()
    await act(async () => {
      await vi.advanceTimersByTimeAsync(60)
    })

    expect(queryClient.getMutationCache().getAll().length).toBe(0)
  })
})

describe('createMutation — $isPaused store', () => {
  let queryClient: QueryClient

  beforeEach(() => {
    vi.useFakeTimers()
    queryClient = new QueryClient({
      defaultOptions: { mutations: { retry: false } },
    })
    queryClient.mount()
  })

  afterEach(() => {
    queryClient.clear()
    vi.useRealTimers()
  })

  it('should flip $isPaused to true while offline and back to false on resume', async () => {
    const onlineMock = mockOnline(false)

    const mutation = createMutation(queryClient, {
      name: 'isPausedFlow',
      mutationFn: () => sleep(5).then(() => 'done'),
    })

    const scope = fork()
    await allSettled(mutation.start, { scope })
    expect(scope.getState(mutation.$isPaused)).toBe(false)

    await allSettled(mutation.mutate, { scope, params: undefined })
    await vi.advanceTimersByTimeAsync(0)

    expect(scope.getState(mutation.$isPaused)).toBe(true)

    onlineMock.mockReturnValue(true)
    await act(async () => {
      void queryClient.getMutationCache().resumePausedMutations()
      await vi.advanceTimersByTimeAsync(11)
    })

    expect(scope.getState(mutation.$isPaused)).toBe(false)
    expect(scope.getState(mutation.$status)).toBe('success')

    onlineMock.mockRestore()
  })
})

describe('createMutation — finished.success / finished.failure events', () => {
  let queryClient: QueryClient

  beforeEach(() => {
    vi.useFakeTimers()
    queryClient = new QueryClient({
      defaultOptions: { mutations: { retry: false } },
    })
    queryClient.mount()
  })

  afterEach(() => {
    queryClient.clear()
    vi.useRealTimers()
  })

  it('should fire finished.success exactly once per successful mutate with params + result', async () => {
    const mutation = createMutation(queryClient, {
      name: 'finishedSuccess',
      mutationFn: (n: number) => sleep(5).then(() => n * 2),
    })

    const successHandler = createEvent<{ params: number; result: number }>()
    const $log = createStore<Array<{ params: number; result: number }>>([]).on(
      successHandler,
      (acc, payload) => [...acc, payload],
    )
    sample({ clock: mutation.finished.success, target: successHandler })

    const scope = fork()
    await allSettled(mutation.start, { scope })

    await allSettled(mutation.mutate, { scope, params: 3 })
    await vi.advanceTimersByTimeAsync(11)

    await allSettled(mutation.mutate, { scope, params: 7 })
    await vi.advanceTimersByTimeAsync(11)

    expect(scope.getState($log)).toEqual([
      { params: 3, result: 6 },
      { params: 7, result: 14 },
    ])
  })

  it('should fire finished.failure with params + error on rejection', async () => {
    const mutation = createMutation<void, Error, string>(queryClient, {
      name: 'finishedFailure',
      mutationFn: (text: string) =>
        sleep(5).then(() => Promise.reject(new Error(`fail-${text}`))),
    })

    const failHandler = createEvent<{ params: string; error: Error }>()
    const $log = createStore<Array<{ params: string; error: string }>>([]).on(
      failHandler,
      (acc, { params, error }) => [...acc, { params, error: error.message }],
    )
    sample({ clock: mutation.finished.failure, target: failHandler })

    const scope = fork()
    await allSettled(mutation.start, { scope })

    await allSettled(mutation.mutate, { scope, params: 'a' })
    await vi.advanceTimersByTimeAsync(11)

    expect(scope.getState($log)).toEqual([
      { params: 'a', error: 'fail-a' },
    ])
  })

  it('should NOT fire finished events when reset transitions away from success/error', async () => {
    const mutation = createMutation(queryClient, {
      name: 'finishedNoReset',
      mutationFn: () => sleep(5).then(() => 'ok'),
    })

    let successCount = 0
    mutation.finished.success.watch(() => {
      successCount++
    })

    const scope = fork()
    await allSettled(mutation.start, { scope })
    await allSettled(mutation.mutate, { scope, params: undefined })
    await vi.advanceTimersByTimeAsync(11)
    expect(successCount).toBe(1)

    await allSettled(mutation.reset, { scope })
    expect(successCount).toBe(1)
  })
})

describe('createMutation — mutateWith per-call callbacks', () => {
  let queryClient: QueryClient

  beforeEach(() => {
    vi.useFakeTimers()
    queryClient = new QueryClient({
      defaultOptions: { mutations: { retry: false } },
    })
    queryClient.mount()
  })

  afterEach(() => {
    queryClient.clear()
    vi.useRealTimers()
  })

  it('should run per-call onSuccess in addition to observer-level onSuccess', async () => {
    const observerOnSuccess = vi.fn()
    const perCallOnSuccess = vi.fn()

    const mutation = createMutation(queryClient, {
      name: 'mutateWithSuccess',
      mutationFn: (text: string) => sleep(5).then(() => text.toUpperCase()),
      onSuccess: observerOnSuccess,
    })

    const scope = fork()
    await allSettled(mutation.start, { scope })

    await allSettled(mutation.mutateWith, {
      scope,
      params: { variables: 'hello', onSuccess: perCallOnSuccess },
    })
    await vi.advanceTimersByTimeAsync(11)

    expect(observerOnSuccess).toHaveBeenCalledTimes(1)
    expect(perCallOnSuccess).toHaveBeenCalledTimes(1)
    expect(perCallOnSuccess).toHaveBeenCalledWith(
      'HELLO',
      'hello',
      undefined,
      expect.objectContaining({ client: queryClient }),
    )
  })

  it('should run per-call onError when the mutation rejects', async () => {
    const observerOnError = vi.fn()
    const perCallOnError = vi.fn()

    const mutation = createMutation<string, Error, string>(queryClient, {
      name: 'mutateWithError',
      mutationFn: () => sleep(5).then(() => Promise.reject(new Error('boom'))),
      onError: observerOnError,
    })

    const scope = fork()
    await allSettled(mutation.start, { scope })

    await allSettled(mutation.mutateWith, {
      scope,
      params: { variables: 'todo', onError: perCallOnError },
    })
    await vi.advanceTimersByTimeAsync(11)

    expect(observerOnError).toHaveBeenCalledTimes(1)
    expect(perCallOnError).toHaveBeenCalledTimes(1)
    expect(perCallOnError.mock.calls[0]?.[0]?.message).toBe('boom')
  })

  it('should run per-call onSettled on both success and failure paths', async () => {
    const onSettled = vi.fn()
    let shouldFail = false

    const mutation = createMutation<string, Error, string>(queryClient, {
      name: 'mutateWithSettled',
      mutationFn: (t: string) => {
        if (shouldFail) return sleep(5).then(() => Promise.reject(new Error('x')))
        return sleep(5).then(() => t)
      },
    })

    const scope = fork()
    await allSettled(mutation.start, { scope })

    await allSettled(mutation.mutateWith, {
      scope,
      params: { variables: 'ok', onSettled },
    })
    await vi.advanceTimersByTimeAsync(11)

    shouldFail = true
    await allSettled(mutation.mutateWith, {
      scope,
      params: { variables: 'fail', onSettled },
    })
    await vi.advanceTimersByTimeAsync(11)

    expect(onSettled).toHaveBeenCalledTimes(2)
    expect(onSettled.mock.calls[0]?.[0]).toBe('ok') // data on success
    expect(onSettled.mock.calls[1]?.[1]?.message).toBe('x') // error on failure
  })
})
