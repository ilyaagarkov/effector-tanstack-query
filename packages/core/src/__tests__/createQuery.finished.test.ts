import {
  allSettled,
  createEvent,
  createStore,
  createWatch,
  fork,
} from 'effector'
import { QueryClient } from '@tanstack/query-core'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createQuery } from '../createQuery'
import { queryKey, sleep } from './test-utils'

// Lifecycle events: finished.success / finished.failure.
//
// Semantics under test:
// - success fires (with post-select TData) on every newly-finished fetch
// - failure fires (with TError) on every failed fetch
// - the baseline observed on mount (incl. hydrated cache) never fires
// - the *start* of a refetch (isFetching → true) does not fire — only resolution
// - each fork scope tracks its own baseline; events land in the right scope

describe('createQuery finished events', () => {
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

  it('fires finished.success with TData after a successful fetch', async () => {
    const success = vi.fn()
    const scope = fork()
    const query = createQuery(queryClient, {
      name: 'finished.success.basic',
      queryKey: queryKey(),
      queryFn: () => sleep(10).then(() => 'result'),
    })
    const unwatch = createWatch({
      unit: query.finished.success,
      scope,
      fn: success,
    })

    await allSettled(query.mounted, { scope })
    await vi.advanceTimersByTimeAsync(11)

    expect(success).toHaveBeenCalledTimes(1)
    expect(success).toHaveBeenCalledWith('result')
    unwatch()
  })

  it('fires finished.success again after refresh()', async () => {
    const success = vi.fn()
    let count = 0
    const query = createQuery(queryClient, {
      name: 'finished.success.refresh',
      queryKey: queryKey(),
      queryFn: () => sleep(10).then(() => ++count),
      staleTime: Infinity,
    })
    // Default scope: refresh fires invalidateQueries whose promise resolves
    // only after the refetch settles — global scope keeps the timing simple.
    const unwatch = query.finished.success.watch(success)

    query.mounted()
    await vi.advanceTimersByTimeAsync(11)
    expect(success).toHaveBeenCalledTimes(1)
    expect(success).toHaveBeenLastCalledWith(1)

    query.refresh()
    await vi.advanceTimersByTimeAsync(11)
    expect(success).toHaveBeenCalledTimes(2)
    expect(success).toHaveBeenLastCalledWith(2)
    unwatch()
  })

  it('fires finished.failure with TError on a failed fetch', async () => {
    const failure = vi.fn()
    const error = new Error('boom')
    const scope = fork()
    const query = createQuery<string, Error>(queryClient, {
      name: 'finished.failure.basic',
      queryKey: queryKey(),
      queryFn: () => sleep(10).then(() => Promise.reject(error)),
    })
    const unwatch = createWatch({
      unit: query.finished.failure,
      scope,
      fn: failure,
    })

    await allSettled(query.mounted, { scope })
    await vi.advanceTimersByTimeAsync(11)

    expect(failure).toHaveBeenCalledTimes(1)
    expect(failure).toHaveBeenCalledWith(error)
    unwatch()
  })

  it('does NOT fire finished.success on first mount with hydrated cache data', async () => {
    const key = queryKey()
    const success = vi.fn()

    // Pre-populate the cache, then mount with staleTime: Infinity so mounting
    // does not trigger a background refetch — the observer only ever sees the
    // hydrated baseline.
    void queryClient.prefetchQuery({
      queryKey: key,
      queryFn: () => sleep(5).then(() => 'hydrated'),
    })
    await vi.advanceTimersByTimeAsync(6)

    const scope = fork()
    const query = createQuery(queryClient, {
      name: 'finished.success.hydrated',
      queryKey: key,
      queryFn: () => sleep(10).then(() => 'fresh'),
      staleTime: Infinity,
    })
    const unwatch = createWatch({
      unit: query.finished.success,
      scope,
      fn: success,
    })

    await allSettled(query.mounted, { scope })
    await vi.advanceTimersByTimeAsync(11)

    expect(scope.getState(query.$data)).toBe('hydrated')
    expect(success).not.toHaveBeenCalled()
    unwatch()
  })

  it('does NOT fire finished.success at the start of a refetch (only on resolution)', async () => {
    const success = vi.fn()
    let count = 0
    const query = createQuery(queryClient, {
      name: 'finished.success.refetchStart',
      queryKey: queryKey(),
      queryFn: () => sleep(10).then(() => ++count),
      staleTime: Infinity,
    })
    const unwatch = query.finished.success.watch(success)

    query.mounted()
    await vi.advanceTimersByTimeAsync(11)
    expect(success).toHaveBeenCalledTimes(1)
    success.mockClear()

    // Kick off a refetch but don't let it resolve yet.
    query.refresh()
    await vi.advanceTimersByTimeAsync(1)
    expect(query.$isFetching.getState()).toBe(true)
    expect(success).not.toHaveBeenCalled()

    // Resolve — now it fires exactly once.
    await vi.advanceTimersByTimeAsync(11)
    expect(success).toHaveBeenCalledTimes(1)
    expect(success).toHaveBeenCalledWith(2)
    unwatch()
  })

  it('tracks baseline per scope — events land only in the mounted scope', async () => {
    const successA = vi.fn()
    const successB = vi.fn()
    const scopeA = fork()
    const scopeB = fork()
    const query = createQuery(queryClient, {
      name: 'finished.success.perScope',
      queryKey: queryKey(),
      queryFn: () => sleep(10).then(() => 'data'),
    })
    const uA = createWatch({
      unit: query.finished.success,
      scope: scopeA,
      fn: successA,
    })
    const uB = createWatch({
      unit: query.finished.success,
      scope: scopeB,
      fn: successB,
    })

    await allSettled(query.mounted, { scope: scopeA })
    await vi.advanceTimersByTimeAsync(11)

    expect(successA).toHaveBeenCalledTimes(1)
    expect(successA).toHaveBeenCalledWith('data')
    expect(successB).not.toHaveBeenCalled()
    uA()
    uB()
  })

  it('fires finished.success again after a reactive key change triggers a new fetch', async () => {
    const success = vi.fn()
    const key = queryKey()
    const setId = createEvent<number>()
    const $id = createStore(1).on(setId, (_, v) => v)
    const scope = fork()
    const query = createQuery(queryClient, {
      name: 'finished.success.keyChange',
      queryKey: [...key, $id],
      queryFn: ({ queryKey: qk }) =>
        sleep(10).then(() => `user-${qk[qk.length - 1]}`),
    })
    const unwatch = createWatch({
      unit: query.finished.success,
      scope,
      fn: success,
    })

    await allSettled(query.mounted, { scope })
    await vi.advanceTimersByTimeAsync(11)
    expect(success).toHaveBeenCalledTimes(1)
    expect(success).toHaveBeenLastCalledWith('user-1')

    await allSettled(setId, { scope, params: 2 })
    await vi.advanceTimersByTimeAsync(11)
    expect(success).toHaveBeenCalledTimes(2)
    expect(success).toHaveBeenLastCalledWith('user-2')
    unwatch()
  })
})
