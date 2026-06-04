import { allSettled, createEvent, createStore, fork } from 'effector'
import { QueryClient } from '@tanstack/query-core'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createQuery } from '../createQuery'
import { createInfiniteQuery } from '../createInfiniteQuery'
import { createCancel } from '../createCacheAction'
import { $queryClient } from '../queryClient'
import { queryKey, sleep } from './test-utils'

// Smoke tests for the AbortSignal that TanStack's query-core hands to
// `queryFn({ signal })`. The factories pass observer options straight through
// via spread, so the signal arrives by default — these tests pin that
// pass-through and the cancellation paths that abort it (reactive key change,
// createCancel). The queryFn intentionally returns a still-pending promise so
// the fetch is in-flight when we abort it.

describe('AbortSignal pass-through — createQuery', () => {
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

  it('hands a real AbortSignal to the queryFn context', async () => {
    const key = queryKey()
    let capturedSignal: AbortSignal | undefined
    const scope = fork()
    const query = createQuery(queryClient, {
      name: 'abort.basic',
      queryKey: key,
      queryFn: ({ signal }) => {
        capturedSignal = signal
        return sleep(50).then(() => 'data')
      },
    })

    await allSettled(query.mounted, { scope })
    await vi.advanceTimersByTimeAsync(1)

    expect(capturedSignal).toBeInstanceOf(AbortSignal)
    expect(capturedSignal!.aborted).toBe(false)
  })

  it('aborts the previous signal when the reactive queryKey changes', async () => {
    const setId = createEvent<number>()
    const $id = createStore(1).on(setId, (_, v) => v)
    const signals: Array<AbortSignal> = []
    const scope = fork()
    const query = createQuery(queryClient, {
      name: 'abort.keychange',
      queryKey: ['abort-key', $id],
      queryFn: ({ signal }) => {
        signals.push(signal)
        return sleep(50).then(() => 'data')
      },
      staleTime: Infinity,
    })

    await allSettled(query.mounted, { scope })
    await vi.advanceTimersByTimeAsync(1)
    expect(signals).toHaveLength(1)
    const first = signals[0]!
    expect(first.aborted).toBe(false)

    // Switching the resolved key retires the previous query; with no observers
    // left on it, query-core aborts its in-flight signal.
    await allSettled(setId, { scope, params: 2 })
    await vi.advanceTimersByTimeAsync(1)

    expect(first.aborted).toBe(true)
    expect(signals).toHaveLength(2)
    expect(signals[1]!.aborted).toBe(false)
  })

  it('aborts the in-flight signal when a createCancel event fires', async () => {
    const key = queryKey()
    let capturedSignal: AbortSignal | undefined
    const query = createQuery(queryClient, {
      name: 'abort.cancel',
      queryKey: key,
      queryFn: ({ signal }) => {
        capturedSignal = signal
        return sleep(50).then(() => 'data')
      },
      staleTime: Infinity,
    })
    const cancel = createCancel(queryClient, { queryKey: key })

    query.mounted()
    await vi.advanceTimersByTimeAsync(1)
    expect(capturedSignal).toBeInstanceOf(AbortSignal)
    expect(capturedSignal!.aborted).toBe(false)
    expect(query.$fetchStatus.getState()).toBe('fetching')

    cancel()
    await vi.advanceTimersByTimeAsync(1)
    expect(capturedSignal!.aborted).toBe(true)
    expect(query.$fetchStatus.getState()).toBe('idle')
  })
})

describe('AbortSignal pass-through — createInfiniteQuery', () => {
  // Real timers: infinite-query mount/prefetch await microtasks and would
  // deadlock under fake timers (mirrors createInfiniteQuery.test.ts).
  let queryClient: QueryClient

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    })
    queryClient.mount()
  })

  afterEach(() => {
    queryClient.clear()
  })

  it('hands a real AbortSignal to the infinite queryFn context', async () => {
    let capturedSignal: AbortSignal | undefined
    const scope = fork({ values: [[$queryClient, queryClient]] })
    const query = createInfiniteQuery<
      { items: Array<string>; next: number | null },
      Error,
      number
    >(queryClient, {
      name: 'abort.infinite',
      queryKey: queryKey(),
      queryFn: ({ pageParam, signal }) => {
        capturedSignal = signal
        return sleep(30).then(() => ({ items: [`p${pageParam}`], next: null }))
      },
      initialPageParam: 0,
      getNextPageParam: (last) => last.next,
    })

    await allSettled(query.mounted, { scope })
    await sleep(5)

    expect(capturedSignal).toBeInstanceOf(AbortSignal)
    expect(capturedSignal!.aborted).toBe(false)
  })
})
