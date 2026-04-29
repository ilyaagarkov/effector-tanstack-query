import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { act } from '@testing-library/react'
import { allSettled, fork } from 'effector'
import { QueryClient, onlineManager } from '@tanstack/query-core'
import { sleep } from './test-utils'
import { createMutation } from '@effector-tanstack-query/core'

function mockOnline(value: boolean) {
  return vi.spyOn(onlineManager, 'isOnline').mockReturnValue(value)
}

describe('createMutation — global defaults via setMutationDefaults', () => {
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

  it('should pull mutationFn from setMutationDefaults when keyed by mutationKey', async () => {
    const mutationKey = ['todos', 'add']

    queryClient.setMutationDefaults(mutationKey, {
      mutationFn: async (text: string) => {
        await sleep(10)
        return text.toUpperCase()
      },
    })

    const mutation = createMutation<string, Error, string>(queryClient, {
      name: 'defaultsLookup',
      mutationKey,
    })

    const scope = fork()
    await allSettled(mutation.start, { scope })

    await allSettled(mutation.mutate, { scope, params: 'todo' })
    await vi.advanceTimersByTimeAsync(11)

    expect(scope.getState(mutation.$data)).toBe('TODO')
    expect(scope.getState(mutation.$status)).toBe('success')
  })

  it('should use defaults retry option for retryable mutations', async () => {
    const mutationKey = ['todos', 'retryable']
    let attempts = 0

    queryClient.setMutationDefaults(mutationKey, {
      mutationFn: async () => {
        attempts++
        await sleep(5)
        if (attempts < 3) throw new Error(`fail-${attempts}`)
        return 'ok'
      },
      retry: 2,
      retryDelay: 5,
    })

    const mutation = createMutation<string, Error, void>(queryClient, {
      name: 'defaultsRetry',
      mutationKey,
    })

    const scope = fork()
    await allSettled(mutation.start, { scope })
    await allSettled(mutation.mutate, { scope, params: undefined })
    await vi.advanceTimersByTimeAsync(50)

    expect(scope.getState(mutation.$data)).toBe('ok')
    expect(attempts).toBe(3)
  })
})

describe('createMutation — offline / pause behavior', () => {
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

  it('should not invoke mutationFn while offline (paused) and resume on resumePausedMutations', async () => {
    const onlineMock = mockOnline(false)
    let count = 0

    const mutation = createMutation(queryClient, {
      name: 'pausedMutation',
      mutationFn: async () => {
        count++
        await sleep(5)
        return count
      },
    })

    const scope = fork()
    await allSettled(mutation.start, { scope })
    await allSettled(mutation.mutate, { scope, params: undefined })

    // Status flips to pending but mutationFn never runs while offline
    await vi.advanceTimersByTimeAsync(20)
    expect(count).toBe(0)
    expect(scope.getState(mutation.$status)).toBe('pending')

    onlineMock.mockReturnValue(true)
    await act(async () => {
      void queryClient.getMutationCache().resumePausedMutations()
      await vi.advanceTimersByTimeAsync(11)
    })

    expect(count).toBe(1)
    expect(scope.getState(mutation.$status)).toBe('success')
    expect(scope.getState(mutation.$data)).toBe(1)

    onlineMock.mockRestore()
  })

  it('should fire onMutate even when the mutation is paused offline', async () => {
    const onlineMock = mockOnline(false)
    const onMutate = vi.fn()
    let count = 0

    const mutation = createMutation(queryClient, {
      name: 'pausedOnMutate',
      mutationFn: async () => {
        count++
        await sleep(5)
        return count
      },
      onMutate,
    })

    const scope = fork()
    await allSettled(mutation.start, { scope })
    await allSettled(mutation.mutate, { scope, params: 'todo' })
    await vi.advanceTimersByTimeAsync(20)

    // mutationFn paused but onMutate already fired
    expect(count).toBe(0)
    expect(onMutate).toHaveBeenCalledTimes(1)
    expect(onMutate).toHaveBeenCalledWith(
      'todo',
      expect.objectContaining({ client: queryClient }),
    )

    onlineMock.mockReturnValue(true)
    await act(async () => {
      void queryClient.getMutationCache().resumePausedMutations()
      await vi.advanceTimersByTimeAsync(11)
    })

    // Resume runs mutationFn but does NOT fire onMutate again
    expect(count).toBe(1)
    expect(onMutate).toHaveBeenCalledTimes(1)

    onlineMock.mockRestore()
  })

  it('should retry a paused mutation when going online with networkMode: offlineFirst', async () => {
    const onlineMock = mockOnline(false)
    let count = 0

    const mutation = createMutation<string, Error, void>(queryClient, {
      name: 'offlineFirstRetry',
      mutationFn: async () => {
        await sleep(5)
        count++
        if (count > 1) return `data${count}`
        throw new Error('first attempt fails')
      },
      retry: 1,
      retryDelay: 5,
      networkMode: 'offlineFirst',
    })

    const scope = fork()
    await allSettled(mutation.start, { scope })
    await allSettled(mutation.mutate, { scope, params: undefined })

    // First attempt runs immediately under offlineFirst
    await vi.advanceTimersByTimeAsync(16)
    expect(count).toBe(1)
    // Retry is paused while offline
    expect(scope.getState(mutation.$status)).toBe('pending')

    onlineMock.mockReturnValue(true)
    await act(async () => {
      void queryClient.getMutationCache().resumePausedMutations()
      await vi.advanceTimersByTimeAsync(20)
    })

    expect(count).toBe(2)
    expect(scope.getState(mutation.$status)).toBe('success')
    expect(scope.getState(mutation.$data)).toBe('data2')

    onlineMock.mockRestore()
  })

  it('should run a normal mutation immediately when online (sanity check for paused-flow guard)', async () => {
    let count = 0

    const mutation = createMutation(queryClient, {
      name: 'onlineImmediate',
      mutationFn: async () => {
        count++
        await sleep(5)
        return count
      },
    })

    const scope = fork()
    await allSettled(mutation.start, { scope })
    await allSettled(mutation.mutate, { scope, params: undefined })
    await vi.advanceTimersByTimeAsync(11)

    expect(count).toBe(1)
    expect(scope.getState(mutation.$status)).toBe('success')
  })
})

describe('createMutation — multiple instances on the same key', () => {
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

  it('should isolate state between two distinct createMutation instances', async () => {
    const m1 = createMutation(queryClient, {
      name: 'isolatedA',
      mutationFn: (text: string) => sleep(5).then(() => `A:${text}`),
    })
    const m2 = createMutation(queryClient, {
      name: 'isolatedB',
      mutationFn: (text: string) => sleep(5).then(() => `B:${text}`),
    })

    const scope = fork()
    await allSettled(m1.start, { scope })
    await allSettled(m2.start, { scope })

    await allSettled(m1.mutate, { scope, params: 'one' })
    await vi.advanceTimersByTimeAsync(6)

    expect(scope.getState(m1.$data)).toBe('A:one')
    expect(scope.getState(m2.$data)).toBeUndefined()
    expect(scope.getState(m2.$status)).toBe('idle')
  })
})

describe('createMutation — cache lifecycle', () => {
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

  it('should record the mutation in the queryClient mutation cache after a successful run', async () => {
    const mutation = createMutation(queryClient, {
      name: 'cacheRecord',
      mutationFn: () => sleep(5).then(() => 'done'),
    })

    expect(queryClient.getMutationCache().getAll().length).toBe(0)

    const scope = fork()
    await allSettled(mutation.start, { scope })
    await allSettled(mutation.mutate, { scope, params: undefined })
    await vi.advanceTimersByTimeAsync(11)

    expect(queryClient.getMutationCache().getAll().length).toBeGreaterThan(0)
    const entry = queryClient.getMutationCache().getAll()[0]
    expect(entry?.state.status).toBe('success')
    expect(entry?.state.data).toBe('done')
  })

  it('should clear mutations via queryClient.getMutationCache().clear()', async () => {
    const mutation = createMutation(queryClient, {
      name: 'cacheClear',
      mutationFn: () => sleep(5).then(() => 'done'),
    })

    const scope = fork()
    await allSettled(mutation.start, { scope })
    await allSettled(mutation.mutate, { scope, params: undefined })
    await vi.advanceTimersByTimeAsync(11)

    expect(queryClient.getMutationCache().getAll().length).toBeGreaterThan(0)

    queryClient.getMutationCache().clear()
    expect(queryClient.getMutationCache().getAll().length).toBe(0)
  })
})
