import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { act, render } from '@testing-library/react'
import { allSettled, fork } from 'effector'
import { QueryClient } from '@tanstack/query-core'
import { queryKey, sleep } from './test-utils'
import { createQuery } from '../createQuery'
import { useQuery } from '../react'

describe('createQuery — refetch with cancelRefetch', () => {
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

  it('should ignore second refetch when called with cancelRefetch=false and there is data', async () => {
    const key = queryKey()
    let fetchCount = 0

    const query = createQuery(queryClient, {
      name: 'cancelFalse',
      queryKey: key,
      queryFn: async () => {
        fetchCount++
        await sleep(10)
        return 'data'
      },
      enabled: false,
      initialData: 'initialData',
    })

    query.mounted()
    await vi.advanceTimersByTimeAsync(0)

    void query.observer.refetch()
    void query.observer.refetch({ cancelRefetch: false })
    await vi.advanceTimersByTimeAsync(15)

    // Second call ignored — first refetch still in flight
    expect(fetchCount).toBe(1)
  })

  it('should cancel ongoing fetch when refetch is called again (cancelRefetch=true is default)', async () => {
    const key = queryKey()
    let fetchCount = 0

    const query = createQuery(queryClient, {
      name: 'cancelTrue',
      queryKey: key,
      queryFn: async () => {
        fetchCount++
        await sleep(10)
        return 'data'
      },
      enabled: false,
      initialData: 'initialData',
    })

    query.mounted()
    await vi.advanceTimersByTimeAsync(0)

    void query.observer.refetch()
    void query.observer.refetch()
    await vi.advanceTimersByTimeAsync(15)

    // First fetch cancelled, second ran
    expect(fetchCount).toBe(2)
  })

  it('should not cancel initial fetch when there is no data yet', async () => {
    const key = queryKey()
    let fetchCount = 0

    const query = createQuery(queryClient, {
      name: 'noDataNoCancel',
      queryKey: key,
      queryFn: async () => {
        fetchCount++
        await sleep(10)
        return 'data'
      },
    })

    query.mounted()
    void query.observer.refetch()
    await vi.advanceTimersByTimeAsync(15)

    // Initial fetch + manual refetch dedupe down to single inflight
    expect(fetchCount).toBe(1)
  })
})

describe('createQuery — refetchOnMount variants', () => {
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

  it('should always fetch when refetchOnMount is "always", even with fresh cache', async () => {
    const key = queryKey()
    const queryFn = vi
      .fn()
      .mockImplementation(() => sleep(5).then(() => 'fetched'))

    queryClient.setQueryData(key, 'cached')

    const query = createQuery<string>(queryClient, {
      name: 'alwaysMount',
      queryKey: key,
      queryFn,
      staleTime: Infinity,
      refetchOnMount: 'always',
    })

    const scope = fork()
    await allSettled(query.mounted, { scope })
    expect(scope.getState(query.$data)).toBe('cached')
    expect(scope.getState(query.$isFetching)).toBe(true)

    await vi.advanceTimersByTimeAsync(6)
    expect(scope.getState(query.$data)).toBe('fetched')
    expect(queryFn).toHaveBeenCalledTimes(1)
  })

  it('should refetch stale query on mount when refetchOnMount is true', async () => {
    const key = queryKey()
    const queryFn = vi
      .fn()
      .mockImplementation(() => sleep(5).then(() => 'fresh'))

    // Pre-populate cache, then backdate updatedAt to make it stale
    queryClient.setQueryData(key, 'old', { updatedAt: Date.now() - 10_000 })

    const query = createQuery<string>(queryClient, {
      name: 'staleMountTrue',
      queryKey: key,
      queryFn,
      staleTime: 1_000,
      refetchOnMount: true,
    })

    const scope = fork()
    await allSettled(query.mounted, { scope })
    expect(scope.getState(query.$data)).toBe('old')

    await vi.advanceTimersByTimeAsync(6)
    expect(scope.getState(query.$data)).toBe('fresh')
    expect(queryFn).toHaveBeenCalledTimes(1)
  })

  it('should not refetch when refetchOnMount is true but data is fresh', async () => {
    const key = queryKey()
    const queryFn = vi.fn().mockResolvedValue('fresh')

    queryClient.setQueryData(key, 'cached')

    const query = createQuery<string>(queryClient, {
      name: 'freshMountTrue',
      queryKey: key,
      queryFn,
      staleTime: Infinity,
      refetchOnMount: true,
    })

    const scope = fork()
    await allSettled(query.mounted, { scope })
    await vi.advanceTimersByTimeAsync(10)

    expect(scope.getState(query.$data)).toBe('cached')
    expect(queryFn).not.toHaveBeenCalled()
  })

  it('should refetch when remounting with gcTime=0 because cache was evicted', async () => {
    const key = queryKey()
    const queryFn = vi
      .fn()
      .mockImplementation(() => sleep(5).then(() => 'data'))

    const query = createQuery(queryClient, {
      name: 'gcZeroRemount',
      queryKey: key,
      queryFn,
      gcTime: 0,
    })

    query.mounted()
    await vi.advanceTimersByTimeAsync(6)
    expect(queryFn).toHaveBeenCalledTimes(1)

    query.unmounted()
    await vi.advanceTimersByTimeAsync(10)
    expect(queryClient.getQueryData(key)).toBeUndefined()

    // Remount — should fetch again
    query.mounted()
    await vi.advanceTimersByTimeAsync(6)
    expect(queryFn).toHaveBeenCalledTimes(2)
  })
})

describe('createQuery — refetchOnWindowFocus', () => {
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

  it('should not refetch on visibilitychange when enabled is false', async () => {
    const key = queryKey()
    const queryFn = vi.fn().mockResolvedValue('data')

    const query = createQuery(queryClient, {
      name: 'focusDisabled',
      queryKey: key,
      queryFn,
      enabled: false,
    })

    query.mounted()
    await vi.advanceTimersByTimeAsync(0)

    act(() => {
      window.dispatchEvent(new Event('visibilitychange'))
    })

    expect(queryFn).not.toHaveBeenCalled()
  })

  it('should not refetch stale query on focus when refetchOnWindowFocus is false', async () => {
    const key = queryKey()
    let count = 0

    const query = createQuery(queryClient, {
      name: 'focusFalse',
      queryKey: key,
      queryFn: () => count++,
      staleTime: 0,
      refetchOnWindowFocus: false,
    })

    function Page() {
      const { data } = useQuery(query)
      return <span>data: {data ?? 'none'}</span>
    }

    const rendered = render(<Page />)
    await act(async () => {
      await vi.advanceTimersByTimeAsync(10)
    })
    rendered.getByText('data: 0')

    await act(async () => {
      window.dispatchEvent(new Event('visibilitychange'))
      await vi.advanceTimersByTimeAsync(10)
    })

    rendered.getByText('data: 0')
    expect(count).toBe(1)
  })

  it('should not refetch stale query on focus when refetchOnWindowFocus returns false', async () => {
    const key = queryKey()
    let count = 0

    const query = createQuery(queryClient, {
      name: 'focusFnFalse',
      queryKey: key,
      queryFn: () => count++,
      staleTime: 0,
      refetchOnWindowFocus: () => false,
    })

    function Page() {
      const { data } = useQuery(query)
      return <span>data: {data ?? 'none'}</span>
    }

    const rendered = render(<Page />)
    await act(async () => {
      await vi.advanceTimersByTimeAsync(10)
    })
    rendered.getByText('data: 0')

    await act(async () => {
      window.dispatchEvent(new Event('visibilitychange'))
      await vi.advanceTimersByTimeAsync(10)
    })

    expect(count).toBe(1)
  })

  it('should not refetch fresh query on focus when refetchOnWindowFocus is true', async () => {
    const key = queryKey()
    let count = 0

    const query = createQuery(queryClient, {
      name: 'focusFresh',
      queryKey: key,
      queryFn: () => count++,
      staleTime: Infinity,
      refetchOnWindowFocus: true,
    })

    function Page() {
      const { data } = useQuery(query)
      return <span>data: {data ?? 'none'}</span>
    }

    const rendered = render(<Page />)
    await act(async () => {
      await vi.advanceTimersByTimeAsync(10)
    })
    rendered.getByText('data: 0')

    await act(async () => {
      window.dispatchEvent(new Event('visibilitychange'))
      await vi.advanceTimersByTimeAsync(10)
    })

    expect(count).toBe(1)
  })

  it('should refetch fresh query on focus when refetchOnWindowFocus is "always"', async () => {
    const key = queryKey()
    let count = 0

    const query = createQuery(queryClient, {
      name: 'focusAlways',
      queryKey: key,
      queryFn: async () => {
        await sleep(5)
        return count++
      },
      staleTime: Infinity,
      refetchOnWindowFocus: 'always',
    })

    function Page() {
      const { data, isFetching } = useQuery(query)
      return (
        <span>
          data: {data ?? 'none'}, fetching: {String(isFetching)}
        </span>
      )
    }

    const rendered = render(<Page />)
    await act(async () => {
      await vi.advanceTimersByTimeAsync(6)
    })
    rendered.getByText('data: 0, fetching: false')

    await act(async () => {
      window.dispatchEvent(new Event('visibilitychange'))
      await vi.advanceTimersByTimeAsync(6)
    })

    rendered.getByText('data: 1, fetching: false')
  })
})

describe('createQuery — retry edge cases', () => {
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

  it('should continue retrying after unmount/remount while waiting for retry delay', async () => {
    const key = queryKey()
    let count = 0

    const query = createQuery(queryClient, {
      name: 'retryRemount',
      queryKey: key,
      queryFn: async () => {
        count++
        await sleep(10)
        throw new Error('fail')
      },
      retry: 2,
      retryDelay: 100,
    })

    query.mounted()
    await vi.advanceTimersByTimeAsync(11)
    expect(count).toBe(1)

    // During the 100ms retry-delay window, unmount + remount
    await vi.advanceTimersByTimeAsync(50)
    query.unmounted()
    await vi.advanceTimersByTimeAsync(10)
    query.mounted()

    // Drain remaining retries
    await vi.advanceTimersByTimeAsync(300)
    // 1 initial + 2 retries = 3 calls (retry continues across remount because
    // the underlying query is preserved in the cache during the delay window)
    expect(count).toBeGreaterThanOrEqual(3)
  })

  it('should derive retryDelay from the error via a function', async () => {
    const key = queryKey()
    let count = 0
    const delays: Array<number> = []

    const query = createQuery<string, Error & { delay: number }>(queryClient, {
      name: 'retryDelayFn',
      queryKey: key,
      queryFn: async () => {
        count++
        await sleep(5)
        const err = Object.assign(new Error('fail'), { delay: 50 })
        throw err
      },
      retry: 1,
      retryDelay: (_attempt, error) => {
        delays.push(error.delay)
        return error.delay
      },
    })

    query.mounted()
    await vi.advanceTimersByTimeAsync(6) // first attempt fails
    await vi.advanceTimersByTimeAsync(60) // 50ms delay + retry runs

    expect(count).toBe(2)
    // retryDelay is invoked on every failure (both attempts fail because the
    // queryFn always rejects); the second value is computed but not used
    // since retry: 1 caps the attempts
    expect(delays).toEqual([50, 50])
  })

  it('should clear $error during a refetch after a previous failure', async () => {
    const key = queryKey()
    let shouldFail = true

    const query = createQuery(queryClient, {
      name: 'errorClearOnRefetch',
      queryKey: key,
      queryFn: async () => {
        await sleep(10)
        if (shouldFail) throw new Error('fail')
        return 'ok'
      },
    })

    query.mounted()
    await vi.advanceTimersByTimeAsync(11)
    expect(query.$status.getState()).toBe('error')
    expect(query.$error.getState()?.message).toBe('fail')

    // While refetch is in flight, the existing error is preserved BUT a fresh
    // success replaces it (status → success, error → null)
    shouldFail = false
    query.refresh()
    await vi.advanceTimersByTimeAsync(11)

    expect(query.$status.getState()).toBe('success')
    expect(query.$error.getState()).toBeNull()
    expect(query.$data.getState()).toBe('ok')
  })
})
