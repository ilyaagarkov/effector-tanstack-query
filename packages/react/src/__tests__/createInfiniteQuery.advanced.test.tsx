import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { act, render } from '@testing-library/react'
import * as React from 'react'
import { Provider } from 'effector-react'
import { allSettled, fork } from 'effector'
import { QueryClient } from '@tanstack/query-core'
import { sleep } from './test-utils'
import { createInfiniteQuery } from '@effector-tanstack-query/core'
import { useInfiniteQuery } from '..'
import type { Scope } from 'effector'

function renderWithScope(scope: Scope, ui: React.ReactElement) {
  return render(<Provider value={scope}>{ui}</Provider>)
}

describe('createInfiniteQuery — fetchNextPage cancellation', () => {
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

  it('should cancel an ongoing fetchNextPage when another fetchNextPage is invoked (default)', async () => {
    const aborts: Array<boolean> = []

    const query = createInfiniteQuery<number, Error, number>(queryClient, {
      name: 'cancelDefault',
      queryKey: ['cancel-default'],
      queryFn: async ({ pageParam, signal }) => {
        const aborted = { value: false }
        signal.addEventListener('abort', () => {
          aborted.value = true
          aborts.push(true)
        })
        await sleep(50)
        return pageParam as number
      },
      getNextPageParam: (lastPage) => lastPage + 1,
      initialPageParam: 0,
    })

    query.mounted()
    await vi.advanceTimersByTimeAsync(51)

    void query.observer.fetchNextPage()
    await vi.advanceTimersByTimeAsync(10)
    void query.observer.fetchNextPage()
    await vi.advanceTimersByTimeAsync(60)

    // First fetchNextPage was cancelled, then second ran
    expect(aborts.length).toBeGreaterThanOrEqual(1)
  })

  it('should NOT cancel ongoing fetchNextPage when called again with cancelRefetch=false', async () => {
    let aborted = false

    const query = createInfiniteQuery<number, Error, number>(queryClient, {
      name: 'cancelFalse',
      queryKey: ['cancel-false'],
      queryFn: async ({ pageParam, signal }) => {
        signal.addEventListener('abort', () => {
          aborted = true
        })
        await sleep(50)
        return pageParam as number
      },
      getNextPageParam: (lastPage) => lastPage + 1,
      initialPageParam: 10,
    })

    query.mounted()
    await vi.advanceTimersByTimeAsync(51)
    expect(query.$data.getState()?.pages).toEqual([10])

    void query.observer.fetchNextPage()
    await vi.advanceTimersByTimeAsync(10)
    void query.observer.fetchNextPage({ cancelRefetch: false })
    await vi.advanceTimersByTimeAsync(60)

    // First fetch was NOT cancelled
    expect(aborted).toBe(false)
    expect(query.$data.getState()?.pages).toEqual([10, 11])
  })
})

describe('createInfiniteQuery — setQueryData integration', () => {
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

  it('should adopt new pages set via queryClient.setQueryData', async () => {
    const key = ['setData-infinite']

    const query = createInfiniteQuery<number, Error, number>(queryClient, {
      name: 'setDataInfinite',
      queryKey: key,
      queryFn: ({ pageParam }: { pageParam: any }) =>
        sleep(5).then(() => pageParam),
      getNextPageParam: (lastPage: number) => lastPage + 1,
      initialPageParam: 0,
    })

    function Page() {
      const { data } = useInfiniteQuery(query)
      return <span>pages: {data?.pages.join(',') ?? 'none'}</span>
    }

    const scope = fork()
    const rendered = renderWithScope(scope, <Page />)
    await act(async () => {
      await vi.advanceTimersByTimeAsync(6)
    })
    rendered.getByText('pages: 0')

    await act(async () => {
      queryClient.setQueryData(key, { pages: [7, 8], pageParams: [7, 8] })
      await vi.advanceTimersByTimeAsync(0)
    })

    rendered.getByText('pages: 7,8')
  })

  it('should refetch using new cursors after setQueryData seeded different pageParams', async () => {
    const key = ['cursors-refetch']
    let multiplier = 1

    const query = createInfiniteQuery<number, Error, number>(queryClient, {
      name: 'newCursors',
      queryKey: key,
      queryFn: ({ pageParam }: { pageParam: any }) =>
        sleep(5).then(() => multiplier * (pageParam as number)),
      getNextPageParam: (lastPage: number) => lastPage + 1,
      initialPageParam: 0,
    })

    query.mounted()
    await vi.advanceTimersByTimeAsync(6)
    expect(query.$data.getState()?.pages).toEqual([0])

    queryClient.setQueryData(key, { pages: [7, 8], pageParams: [7, 8] })
    multiplier = 2

    query.refresh()
    await vi.advanceTimersByTimeAsync(20)

    // Refresh recomputes pageParams from each fetched page via getNextPageParam:
    // page 0 fetched with pageParam=7 → 14, then next param is lastPage+1 = 15
    // page 1 fetched with pageParam=15 → 30
    expect(query.$data.getState()?.pages).toEqual([14, 30])
    expect(query.$data.getState()?.pageParams).toEqual([7, 15])
  })
})

describe('createInfiniteQuery — hasNextPage edge cases', () => {
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

  it('should compute hasNextPage from initialData on first render (without fetching)', async () => {
    const queryFn = vi.fn(({ pageParam }: { pageParam: any }) =>
      sleep(5).then(() => pageParam),
    )

    const query = createInfiniteQuery<number, Error, number>(queryClient, {
      name: 'initialDataHasNext',
      queryKey: ['initial-hasNext'],
      queryFn,
      getNextPageParam: (lastPage: number) => lastPage + 1,
      initialPageParam: 0,
      initialData: { pages: [10], pageParams: [10] },
      staleTime: Infinity,
    })

    const scope = fork()
    await allSettled(query.mounted, { scope })
    await vi.advanceTimersByTimeAsync(10)

    expect(scope.getState(query.$data)?.pages).toEqual([10])
    expect(scope.getState(query.$hasNextPage)).toBe(true)
    expect(queryFn).not.toHaveBeenCalled()
  })

  it('should expose allPages in getNextPageParam callback', async () => {
    const seenAllPages: Array<Array<number>> = []

    const query = createInfiniteQuery<number, Error, number>(queryClient, {
      name: 'allPagesArg',
      queryKey: ['all-pages'],
      queryFn: ({ pageParam }: { pageParam: any }) =>
        sleep(5).then(() => pageParam as number),
      getNextPageParam: (
        _lastPage: number,
        allPages: Array<number>,
        lastParam: number,
      ) => {
        seenAllPages.push([...allPages])
        return lastParam + 1
      },
      initialPageParam: 0,
    })

    query.mounted()
    await vi.advanceTimersByTimeAsync(6)

    void query.observer.fetchNextPage()
    await vi.advanceTimersByTimeAsync(6)

    void query.observer.fetchNextPage()
    await vi.advanceTimersByTimeAsync(6)

    // getNextPageParam saw progressively-larger allPages arrays
    expect(seenAllPages.some((p) => p.length === 1)).toBe(true)
    expect(seenAllPages.some((p) => p.length === 2)).toBe(true)
    expect(seenAllPages.some((p) => p.length === 3)).toBe(true)
  })

  it('should set hasNextPage=false when getNextPageParam returns undefined after a refetch', async () => {
    const key = ['hasNext-after-refetch']
    let allowMore = true

    const query = createInfiniteQuery<number, Error, number>(queryClient, {
      name: 'refetchHasNext',
      queryKey: key,
      queryFn: ({ pageParam }: { pageParam: any }) =>
        sleep(5).then(() => pageParam as number),
      getNextPageParam: (lastPage: number) =>
        allowMore ? lastPage + 1 : undefined,
      initialPageParam: 0,
    })

    query.mounted()
    await vi.advanceTimersByTimeAsync(6)
    expect(query.$hasNextPage.getState()).toBe(true)

    allowMore = false
    query.refresh()
    await vi.advanceTimersByTimeAsync(6)

    expect(query.$hasNextPage.getState()).toBe(false)
  })
})

describe('createInfiniteQuery — multi-page refetch', () => {
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

  it('should refetch all loaded pages on refresh (not just the first)', async () => {
    let callCount = 0

    const query = createInfiniteQuery<
      { id: number; ts: number },
      Error,
      number
    >(queryClient, {
      name: 'multiRefetch',
      queryKey: ['multi-refetch'],
      queryFn: ({ pageParam }: { pageParam: any }) => {
        const ts = ++callCount
        return sleep(5).then(() => ({ id: pageParam as number, ts }))
      },
      getNextPageParam: (lastPage: { id: number }) => lastPage.id + 1,
      initialPageParam: 0,
    })

    query.mounted()
    await vi.advanceTimersByTimeAsync(6)

    void query.observer.fetchNextPage()
    await vi.advanceTimersByTimeAsync(6)
    void query.observer.fetchNextPage()
    await vi.advanceTimersByTimeAsync(6)

    expect(query.$data.getState()?.pages.map((p) => p.id)).toEqual([0, 1, 2])
    const callsBefore = callCount

    query.refresh()
    await vi.advanceTimersByTimeAsync(30)

    // Refresh re-ran all 3 pages
    expect(callCount).toBe(callsBefore + 3)
    expect(query.$data.getState()?.pages.map((p) => p.id)).toEqual([0, 1, 2])
  })
})

describe('createInfiniteQuery — unmount cancellation', () => {
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

  it('should abort an ongoing fetch when the component unmounts mid-fetch', async () => {
    let aborted = false

    const query = createInfiniteQuery<number, Error, number>(queryClient, {
      name: 'unmountAbort',
      queryKey: ['unmount-abort'],
      queryFn: async ({ pageParam, signal }) => {
        signal.addEventListener('abort', () => {
          aborted = true
        })
        await sleep(50)
        return pageParam as number
      },
      getNextPageParam: (lastPage: number) => lastPage + 1,
      initialPageParam: 0,
    })

    function Page() {
      useInfiniteQuery(query)
      return <span>page</span>
    }

    const rendered = render(<Page />)

    // Initial fetch is in flight (50ms total); unmount before it completes
    await act(async () => {
      await vi.advanceTimersByTimeAsync(10)
    })
    expect(aborted).toBe(false)

    rendered.unmount()
    await act(async () => {
      await vi.advanceTimersByTimeAsync(1)
    })

    expect(aborted).toBe(true)
  })
})
