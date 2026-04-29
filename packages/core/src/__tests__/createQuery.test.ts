import { allSettled, createEvent, createStore, fork } from 'effector'
import { QueryClient } from '@tanstack/query-core'
import { queryKey, sleep } from './test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createQuery } from '../createQuery'

// Testing strategy:
// - fork() creates an isolated scope: store state changes don't bleed between tests
// - allSettled(event, { scope }) fires the event in scope and waits for ALL effects
//   (including setupSubscriptionFx triggered via sample) to settle
// - vi.advanceTimersByTimeAsync resolves async queryFn promises (sleep-based)
// - Store updates in tests use events (.on) because allSettled(event) reliably
//   triggers the reactive graph; direct store allSettled may not propagate derived stores

describe('createQuery', () => {
  let queryClient: QueryClient

  beforeEach(() => {
    vi.useFakeTimers()
    queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    })
    queryClient.mount()
  })

  afterEach(() => {
    queryClient.clear()
    vi.useRealTimers()
  })

  it('should return pending state before the first fetch completes', async () => {
    const key = queryKey()
    const scope = fork()
    const query = createQuery(queryClient, {
      queryKey: key,
      queryFn: () => sleep(10).then(() => 'data'),
    })

    await allSettled(query.mounted, { scope })

    expect(scope.getState(query.$status)).toBe('pending')
    expect(scope.getState(query.$isPending)).toBe(true)
    expect(scope.getState(query.$data)).toBeUndefined()
    expect(scope.getState(query.$error)).toBeNull()
  })

  it('should transition to success state with data', async () => {
    const key = queryKey()
    const scope = fork()
    const query = createQuery(queryClient, {
      queryKey: key,
      queryFn: () => sleep(10).then(() => 'result'),
    })

    await allSettled(query.mounted, { scope })
    await vi.advanceTimersByTimeAsync(11)

    expect(scope.getState(query.$status)).toBe('success')
    expect(scope.getState(query.$data)).toBe('result')
    expect(scope.getState(query.$isSuccess)).toBe(true)
    expect(scope.getState(query.$isPending)).toBe(false)
    expect(scope.getState(query.$isFetching)).toBe(false)
    expect(scope.getState(query.$fetchStatus)).toBe('idle')
    expect(scope.getState(query.$error)).toBeNull()
  })

  it('should transition to error state on failure', async () => {
    const key = queryKey()
    const error = new Error('fetch failed')
    const scope = fork()
    const query = createQuery(queryClient, {
      queryKey: key,
      queryFn: () => sleep(10).then(() => Promise.reject(error)),
    })

    await allSettled(query.mounted, { scope })
    await vi.advanceTimersByTimeAsync(11)

    expect(scope.getState(query.$status)).toBe('error')
    expect(scope.getState(query.$isError)).toBe(true)
    expect(scope.getState(query.$error)).toBe(error)
    expect(scope.getState(query.$data)).toBeUndefined()
  })

  it('should not fetch when enabled is false', async () => {
    const key = queryKey()
    const queryFn = vi.fn().mockResolvedValue('data')
    const scope = fork()
    const query = createQuery(queryClient, {
      queryKey: key,
      queryFn,
      enabled: false,
    })

    await allSettled(query.mounted, { scope })
    await vi.advanceTimersByTimeAsync(20)

    expect(queryFn).not.toHaveBeenCalled()
    expect(scope.getState(query.$status)).toBe('pending')
    expect(scope.getState(query.$fetchStatus)).toBe('idle')
  })

  it('should start fetching when Store<boolean> enabled changes to true', async () => {
    const key = queryKey()
    // Use an event to drive the store — allSettled(event) reliably
    // propagates through the reactive graph in fork scope
    const setEnabled = createEvent<boolean>()
    const $enabled = createStore(false).on(setEnabled, (_, v) => v)
    const queryFn = vi
      .fn()
      .mockImplementation(() => sleep(10).then(() => 'data'))
    const scope = fork()
    const query = createQuery(queryClient, {
      queryKey: key,
      queryFn,
      enabled: $enabled,
    })

    await allSettled(query.mounted, { scope })
    await vi.advanceTimersByTimeAsync(20)
    expect(queryFn).not.toHaveBeenCalled()

    await allSettled(setEnabled, { scope, params: true })
    await vi.advanceTimersByTimeAsync(11)

    expect(queryFn).toHaveBeenCalledTimes(1)
    expect(scope.getState(query.$data)).toBe('data')
    expect(scope.getState(query.$status)).toBe('success')
  })

  it('should stop re-fetching when Store<boolean> enabled changes to false', async () => {
    const key = queryKey()
    const setEnabled = createEvent<boolean>()
    const $enabled = createStore(true).on(setEnabled, (_, v) => v)
    const queryFn = vi
      .fn()
      .mockImplementation(() => sleep(10).then(() => 'data'))
    const scope = fork()
    const query = createQuery(queryClient, {
      queryKey: key,
      queryFn,
      enabled: $enabled,
      staleTime: 0,
    })

    await allSettled(query.mounted, { scope })
    await vi.advanceTimersByTimeAsync(11)
    expect(scope.getState(query.$data)).toBe('data')

    await allSettled(setEnabled, { scope, params: false })
    await queryClient.invalidateQueries({ queryKey: key })
    await vi.advanceTimersByTimeAsync(11)

    expect(queryFn).toHaveBeenCalledTimes(1)
  })

  it('should refetch when a Store inside queryKey changes', async () => {
    const key = queryKey()
    const setId = createEvent<number>()
    const $id = createStore(1).on(setId, (_, v) => v)
    const scope = fork()
    const query = createQuery(queryClient, {
      queryKey: [...key, $id],
      queryFn: ({ queryKey: qk }) =>
        sleep(10).then(() => ({ id: qk[qk.length - 1] })),
    })

    await allSettled(query.mounted, { scope })
    await vi.advanceTimersByTimeAsync(11)
    expect(scope.getState(query.$data)).toEqual({ id: 1 })

    await allSettled(setId, { scope, params: 2 })
    await vi.advanceTimersByTimeAsync(11)
    expect(scope.getState(query.$data)).toEqual({ id: 2 })
  })

  it('should support a mixed queryKey of stores and plain values', async () => {
    const key = queryKey()
    const setSection = createEvent<string>()
    const $section = createStore('posts').on(setSection, (_, v) => v)
    const scope = fork()
    const query = createQuery(queryClient, {
      queryKey: [...key, 42, $section],
      queryFn: ({ queryKey: qk }) => sleep(10).then(() => `${qk[1]}-${qk[2]}`),
    })

    await allSettled(query.mounted, { scope })
    await vi.advanceTimersByTimeAsync(11)
    expect(scope.getState(query.$data)).toBe('42-posts')

    await allSettled(setSection, { scope, params: 'comments' })
    await vi.advanceTimersByTimeAsync(11)
    expect(scope.getState(query.$data)).toBe('42-comments')
  })

  it('should deduplicate inflight requests for the same key', async () => {
    const key = queryKey()
    const queryFn = vi
      .fn()
      .mockImplementation(() => sleep(10).then(() => 'data'))
    const scope = fork()

    const q1 = createQuery(queryClient, { queryKey: key, queryFn })
    const q2 = createQuery(queryClient, { queryKey: key, queryFn })

    await allSettled(q1.mounted, { scope })
    await allSettled(q2.mounted, { scope })
    await vi.advanceTimersByTimeAsync(11)

    expect(queryFn).toHaveBeenCalledTimes(1)
    expect(scope.getState(q1.$data)).toBe('data')
    expect(scope.getState(q2.$data)).toBe('data')
  })

  it('should trigger a background refetch on refresh', async () => {
    const key = queryKey()
    let count = 0
    // Use global scope for refresh test: refresh fires invalidateQueries
    // which returns a Promise that resolves only after the refetch completes.
    // Using global scope avoids having to interleave allSettled with timer advance.
    const query = createQuery(queryClient, {
      queryKey: key,
      queryFn: () => sleep(10).then(() => ++count),
      staleTime: Infinity,
    })

    query.mounted()
    await vi.advanceTimersByTimeAsync(11)
    expect(query.$data.getState()).toBe(1)

    query.refresh()
    await vi.advanceTimersByTimeAsync(11)
    expect(query.$data.getState()).toBe(2)
  })

  it('should use cached data from a previous fetch with the same key', async () => {
    const key = queryKey()
    const scope = fork()

    void queryClient.prefetchQuery({
      queryKey: key,
      queryFn: () => sleep(5).then(() => 'prefetched'),
    })
    await vi.advanceTimersByTimeAsync(6)

    const query = createQuery(queryClient, {
      queryKey: key,
      queryFn: () => sleep(10).then(() => 'fresh'),
    })

    await allSettled(query.mounted, { scope })

    expect(scope.getState(query.$data)).toBe('prefetched')
    expect(scope.getState(query.$status)).toBe('success')
  })

  it('should track $status transitions across pending → success', async () => {
    const key = queryKey()
    const statuses: Array<string> = []
    const query = createQuery(queryClient, {
      queryKey: key,
      queryFn: () => sleep(10).then(() => 'result'),
    })

    query.$status.watch((s) => statuses.push(s))
    query.mounted()
    await vi.advanceTimersByTimeAsync(11)

    expect(statuses).toEqual(['pending', 'success'])
  })
})
