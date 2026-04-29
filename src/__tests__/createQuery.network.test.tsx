import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { act, render } from '@testing-library/react'
import { QueryClient, onlineManager } from '@tanstack/query-core'
import { queryKey, sleep } from './test-utils'
import { createQuery } from '../createQuery'
import { useQuery } from '../react'

function mockOnline(value: boolean) {
  return vi.spyOn(onlineManager, 'isOnline').mockReturnValue(value)
}

describe('createQuery — networkMode "online" (default)', () => {
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

  it('should pause fetching when offline and resume when online', async () => {
    const onlineMock = mockOnline(false)
    const key = queryKey()

    const query = createQuery(queryClient, {
      name: 'pauseFetch',
      queryKey: key,
      queryFn: () => sleep(10).then(() => 'data'),
    })

    function Page() {
      const { status, fetchStatus, data } = useQuery(query)
      return (
        <span>
          {status}/{fetchStatus}: {data ?? 'none'}
        </span>
      )
    }

    const rendered = render(<Page />)
    await act(async () => {
      await vi.advanceTimersByTimeAsync(0)
    })

    rendered.getByText('pending/paused: none')

    onlineMock.mockReturnValue(true)
    await act(async () => {
      queryClient.getQueryCache().onOnline()
      await vi.advanceTimersByTimeAsync(11)
    })

    rendered.getByText('success/idle: data')
    onlineMock.mockRestore()
  })

  it('should pause invalidate refetch when offline', async () => {
    const key = queryKey()
    let count = 0

    const query = createQuery(queryClient, {
      name: 'pauseInvalidate',
      queryKey: key,
      queryFn: () => sleep(10).then(() => 'data' + ++count),
    })

    function Page() {
      const { status, fetchStatus, data } = useQuery(query)
      return (
        <span>
          {status}/{fetchStatus}: {data ?? 'none'}
        </span>
      )
    }

    const rendered = render(<Page />)
    await act(async () => {
      await vi.advanceTimersByTimeAsync(11)
    })
    rendered.getByText('success/idle: data1')

    const onlineMock = mockOnline(false)
    await act(async () => {
      void queryClient.invalidateQueries({ queryKey: key })
      await vi.advanceTimersByTimeAsync(11)
    })
    rendered.getByText('success/paused: data1')

    onlineMock.mockReturnValue(true)
    await act(async () => {
      queryClient.getQueryCache().onOnline()
      await vi.advanceTimersByTimeAsync(11)
    })
    rendered.getByText('success/idle: data2')
    onlineMock.mockRestore()
  })

  it('should not refetch on visibilitychange while offline', async () => {
    const key = queryKey()
    let count = 0

    const query = createQuery(queryClient, {
      name: 'noFocusOffline',
      queryKey: key,
      queryFn: () => sleep(10).then(() => 'data' + ++count),
    })

    function Page() {
      const { fetchStatus, data } = useQuery(query)
      return (
        <span>
          {fetchStatus}: {data ?? 'none'}
        </span>
      )
    }

    const rendered = render(<Page />)
    await act(async () => {
      await vi.advanceTimersByTimeAsync(11)
    })
    rendered.getByText('idle: data1')

    const onlineMock = mockOnline(false)
    await act(async () => {
      void queryClient.invalidateQueries({ queryKey: key })
      await vi.advanceTimersByTimeAsync(0)
    })
    rendered.getByText('paused: data1')

    await act(async () => {
      window.dispatchEvent(new Event('visibilitychange'))
      await vi.advanceTimersByTimeAsync(11)
    })

    expect(count).toBe(1)
    onlineMock.mockRestore()
  })

  it('should pause initial fetch and stay paused on invalidate while offline', async () => {
    const onlineMock = mockOnline(false)
    const key = queryKey()
    let count = 0

    const query = createQuery(queryClient, {
      name: 'pausedNoInvalidate',
      queryKey: key,
      queryFn: () => sleep(10).then(() => 'data' + ++count),
    })

    function Page() {
      const { status, fetchStatus } = useQuery(query)
      return (
        <span>
          {status}/{fetchStatus}
        </span>
      )
    }

    const rendered = render(<Page />)
    await act(async () => {
      await vi.advanceTimersByTimeAsync(0)
    })
    rendered.getByText('pending/paused')

    await act(async () => {
      void queryClient.invalidateQueries({ queryKey: key })
      await vi.advanceTimersByTimeAsync(11)
    })

    rendered.getByText('pending/paused')
    expect(count).toBe(0)
    onlineMock.mockRestore()
  })

  it('should pause retry when going offline mid-attempt', async () => {
    const key = queryKey()
    let count = 0

    const query = createQuery(queryClient, {
      name: 'pauseRetry',
      queryKey: key,
      queryFn: async () => {
        count++
        await sleep(5)
        throw new Error('fail')
      },
      retry: 2,
      retryDelay: 100,
    })

    function Page() {
      const { fetchStatus } = useQuery(query)
      return <span>fetchStatus: {fetchStatus}</span>
    }

    const rendered = render(<Page />)
    await act(async () => {
      await vi.advanceTimersByTimeAsync(6)
    })
    expect(count).toBe(1)

    // Go offline during the 100ms retry delay
    const onlineMock = mockOnline(false)
    await act(async () => {
      await vi.advanceTimersByTimeAsync(110)
    })

    // Retry should be paused, not progressed
    rendered.getByText('fetchStatus: paused')

    onlineMock.mockReturnValue(true)
    await act(async () => {
      queryClient.getQueryCache().onOnline()
      await vi.advanceTimersByTimeAsync(11)
      await vi.advanceTimersByTimeAsync(110)
      await vi.advanceTimersByTimeAsync(11)
    })

    expect(count).toBeGreaterThanOrEqual(2)
    onlineMock.mockRestore()
  })
})

describe('createQuery — networkMode "always"', () => {
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

  it('should fetch even when offline', async () => {
    const onlineMock = mockOnline(false)
    const key = queryKey()

    const query = createQuery(queryClient, {
      name: 'alwaysOffline',
      queryKey: key,
      queryFn: () => sleep(5).then(() => 'data'),
      networkMode: 'always',
    })

    function Page() {
      const { status, data } = useQuery(query)
      return (
        <span>
          {status}: {data ?? 'none'}
        </span>
      )
    }

    const rendered = render(<Page />)
    await act(async () => {
      await vi.advanceTimersByTimeAsync(6)
    })

    rendered.getByText('success: data')
    onlineMock.mockRestore()
  })

  it('should not pause retries when offline (networkMode: always)', async () => {
    const onlineMock = mockOnline(false)
    const key = queryKey()
    let count = 0

    const query = createQuery(queryClient, {
      name: 'alwaysRetry',
      queryKey: key,
      queryFn: async () => {
        count++
        await sleep(5)
        throw new Error('fail')
      },
      networkMode: 'always',
      retry: 2,
      retryDelay: 5,
    })

    query.mounted()
    await vi.advanceTimersByTimeAsync(50)

    expect(count).toBe(3) // 1 + 2 retries, no pause
    onlineMock.mockRestore()
  })
})

describe('createQuery — networkMode "offlineFirst"', () => {
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

  it('should fetch initially when offline but pause retries on failure', async () => {
    const onlineMock = mockOnline(false)
    const key = queryKey()
    let count = 0

    const query = createQuery(queryClient, {
      name: 'offlineFirst',
      queryKey: key,
      queryFn: async () => {
        count++
        await sleep(5)
        throw new Error('fail')
      },
      networkMode: 'offlineFirst',
      retry: 2,
      retryDelay: 5,
    })

    query.mounted()
    await vi.advanceTimersByTimeAsync(50)

    // First attempt happens (offlineFirst), but retries are paused while offline
    expect(count).toBe(1)
    expect(query.$fetchStatus.getState()).toBe('paused')

    onlineMock.mockReturnValue(true)
    queryClient.getQueryCache().onOnline()
    await vi.advanceTimersByTimeAsync(50)

    expect(count).toBeGreaterThanOrEqual(2)
    onlineMock.mockRestore()
  })
})

describe('createQuery — refetchOnReconnect', () => {
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

  it('should refetch on reconnect when refetchOnReconnect is "always" with fresh data', async () => {
    const key = queryKey()
    let count = 0

    const query = createQuery(queryClient, {
      name: 'reconnectAlways',
      queryKey: key,
      queryFn: () => sleep(5).then(() => count++),
      staleTime: Infinity,
      refetchOnReconnect: 'always',
    })

    query.mounted()
    await vi.advanceTimersByTimeAsync(6)
    expect(count).toBe(1)

    // Simulate reconnect (go offline, then online)
    const onlineMock = mockOnline(false)
    onlineMock.mockReturnValue(true)
    queryClient.getQueryCache().onOnline()
    await vi.advanceTimersByTimeAsync(6)

    expect(count).toBe(2)
    onlineMock.mockRestore()
  })

  it('should NOT refetch on reconnect when refetchOnReconnect is false', async () => {
    const key = queryKey()
    let count = 0

    const query = createQuery(queryClient, {
      name: 'reconnectFalse',
      queryKey: key,
      queryFn: () => sleep(5).then(() => count++),
      staleTime: 0,
      refetchOnReconnect: false,
    })

    query.mounted()
    await vi.advanceTimersByTimeAsync(6)
    expect(count).toBe(1)

    queryClient.getQueryCache().onOnline()
    await vi.advanceTimersByTimeAsync(6)

    expect(count).toBe(1)
  })
})
