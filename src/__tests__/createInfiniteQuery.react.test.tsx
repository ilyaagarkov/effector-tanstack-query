import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { act, render } from '@testing-library/react'
import * as React from 'react'
import { Provider, useUnit } from 'effector-react'
import { allSettled, createEvent, createStore, fork } from 'effector'
import { QueryClient, keepPreviousData } from '@tanstack/query-core'
import { sleep } from './test-utils'
import { createInfiniteQuery } from '../createInfiniteQuery'
import type { Scope } from 'effector'

function renderWithScope(scope: Scope, ui: React.ReactElement) {
  const result = render(<Provider value={scope}>{ui}</Provider>)
  return {
    ...result,
    rerender: (rerenderUi: React.ReactElement) =>
      result.rerender(<Provider value={scope}>{rerenderUi}</Provider>),
  }
}

describe('createInfiniteQuery (React integration)', () => {
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

  it('should return correct states for a successful infinite query', async () => {
    const scope = fork()

    const query = createInfiniteQuery(queryClient, {
      queryKey: ['items'],
      queryFn: ({ pageParam }: { pageParam: any }) =>
        sleep(10).then(() => pageParam),
      getNextPageParam: (lastPage: number) => lastPage + 1,
      initialPageParam: 0,
    })

    function Page() {
      const { data, status, hasNextPage } = useUnit({
        data: query.$data,
        status: query.$status,
        hasNextPage: query.$hasNextPage,
      })
      return (
        <div>
          <span>status: {status}</span>
          <span>pages: {data?.pages.join(',') ?? 'none'}</span>
          <span>hasNext: {String(hasNextPage)}</span>
        </div>
      )
    }

    const rendered = renderWithScope(scope, <Page />)
    await allSettled(query.mounted, { scope })

    rendered.getByText('status: pending')

    await vi.advanceTimersByTimeAsync(11)

    rendered.getByText('status: success')
    rendered.getByText('pages: 0')
    rendered.getByText('hasNext: true')
  })

  it('should fetch next page', async () => {
    const scope = fork()

    const query = createInfiniteQuery(queryClient, {
      queryKey: ['items'],
      queryFn: ({ pageParam }: { pageParam: any }) =>
        sleep(10).then(() => pageParam * 10),
      getNextPageParam: (
        _lastPage: number,
        _allPages: Array<number>,
        lastPageParam: number,
      ) => lastPageParam + 1,
      initialPageParam: 1,
    })

    function Page() {
      const { data, isFetchingNextPage } = useUnit({
        data: query.$data,
        isFetchingNextPage: query.$isFetchingNextPage,
      })
      return (
        <div>
          <span>pages: {data?.pages.join(',') ?? 'none'}</span>
          <span>fetchingNext: {String(isFetchingNextPage)}</span>
        </div>
      )
    }

    const rendered = renderWithScope(scope, <Page />)
    await allSettled(query.mounted, { scope })
    await vi.advanceTimersByTimeAsync(11)

    rendered.getByText('pages: 10')

    // Fetch next page
    await allSettled(query.fetchNextPage, { scope })
    await act(async () => {
      await vi.advanceTimersByTimeAsync(1)
    })

    rendered.getByText('fetchingNext: true')

    await act(async () => {
      await vi.advanceTimersByTimeAsync(11)
    })

    rendered.getByText('pages: 10,20')
    rendered.getByText('fetchingNext: false')
  })

  it('should fetch previous page', async () => {
    const scope = fork()

    const query = createInfiniteQuery(queryClient, {
      queryKey: ['items'],
      queryFn: ({ pageParam }: { pageParam: any }) =>
        sleep(10).then(() => pageParam),
      getNextPageParam: (lastPage: number) => lastPage + 1,
      getPreviousPageParam: (firstPage: number) => firstPage - 1,
      initialPageParam: 10,
    })

    function Page() {
      const { data, isFetchingPreviousPage } = useUnit({
        data: query.$data,
        isFetchingPreviousPage: query.$isFetchingPreviousPage,
      })
      return (
        <div>
          <span>pages: {data?.pages.join(',') ?? 'none'}</span>
          <span>fetchingPrev: {String(isFetchingPreviousPage)}</span>
        </div>
      )
    }

    const rendered = renderWithScope(scope, <Page />)
    await allSettled(query.mounted, { scope })
    await vi.advanceTimersByTimeAsync(11)

    rendered.getByText('pages: 10')

    await allSettled(query.fetchPreviousPage, { scope })
    await act(async () => {
      await vi.advanceTimersByTimeAsync(11)
    })

    rendered.getByText('pages: 9,10')
  })

  it('should set hasNextPage to false when getNextPageParam returns undefined', async () => {
    const scope = fork()

    const query = createInfiniteQuery(queryClient, {
      queryKey: ['items'],
      queryFn: ({ pageParam }: { pageParam: any }) =>
        sleep(10).then(() => pageParam),
      getNextPageParam: () => undefined,
      initialPageParam: 1,
    })

    function Page() {
      const { hasNextPage, isSuccess } = useUnit({
        hasNextPage: query.$hasNextPage,
        isSuccess: query.$isSuccess,
      })
      return (
        <span>
          hasNext: {String(hasNextPage)}, success: {String(isSuccess)}
        </span>
      )
    }

    const rendered = renderWithScope(scope, <Page />)
    await allSettled(query.mounted, { scope })
    await vi.advanceTimersByTimeAsync(11)

    rendered.getByText('hasNext: false, success: true')
  })

  it('should handle fetchNextPage error', async () => {
    const scope = fork()

    const query = createInfiniteQuery<number, Error, number>(queryClient, {
      queryKey: ['items'],
      queryFn: ({ pageParam }: { pageParam: any }) =>
        sleep(10).then(() => {
          if (pageParam > 0) throw new Error('next page failed')
          return pageParam
        }),
      getNextPageParam: (
        _lastPage: any,
        _allPages: Array<any>,
        lastPageParam: number,
      ) => lastPageParam + 1,
      initialPageParam: 0,
    })

    function Page() {
      const { data, isFetchNextPageError, error } = useUnit({
        data: query.$data,
        isFetchNextPageError: query.$isFetchNextPageError,
        error: query.$error,
      })
      return (
        <div>
          <span>pages: {data?.pages.join(',') ?? 'none'}</span>
          <span>nextError: {String(isFetchNextPageError)}</span>
          <span>error: {error?.message ?? 'none'}</span>
        </div>
      )
    }

    const rendered = renderWithScope(scope, <Page />)
    await allSettled(query.mounted, { scope })
    await vi.advanceTimersByTimeAsync(11)

    rendered.getByText('pages: 0')

    await allSettled(query.fetchNextPage, { scope })
    await act(async () => {
      await vi.advanceTimersByTimeAsync(11)
    })

    // Data preserved, error flagged
    rendered.getByText('pages: 0')
    rendered.getByText('nextError: true')
    rendered.getByText('error: next page failed')
  })

  it('should support multiple pages and track pageParams', async () => {
    const scope = fork()

    const query = createInfiniteQuery(queryClient, {
      queryKey: ['items'],
      queryFn: ({ pageParam }: { pageParam: any }) =>
        sleep(5).then(() => ({
          items: [`item-${pageParam}`],
          cursor: pageParam,
        })),
      getNextPageParam: (lastPage: { cursor: number }) => lastPage.cursor + 1,
      initialPageParam: 0,
    })

    function Page() {
      const { data } = useUnit({ data: query.$data })
      const items = data?.pages.flatMap((p: any) => p.items) ?? []
      return <span>items: {items.join(',') || 'none'}</span>
    }

    const rendered = renderWithScope(scope, <Page />)
    await allSettled(query.mounted, { scope })
    await vi.advanceTimersByTimeAsync(6)

    rendered.getByText('items: item-0')

    // Fetch page 2
    await allSettled(query.fetchNextPage, { scope })
    await act(async () => {
      await vi.advanceTimersByTimeAsync(6)
    })
    rendered.getByText('items: item-0,item-1')

    // Fetch page 3
    await allSettled(query.fetchNextPage, { scope })
    await act(async () => {
      await vi.advanceTimersByTimeAsync(6)
    })
    rendered.getByText('items: item-0,item-1,item-2')

    // Verify pageParams tracked correctly
    expect(scope.getState(query.$data)?.pageParams).toEqual([0, 1, 2])
  })

  it('should support select to transform infinite data', async () => {
    const scope = fork()

    const query = createInfiniteQuery(queryClient, {
      queryKey: ['items'],
      queryFn: ({ pageParam }: { pageParam: number }) =>
        sleep(5).then(() => ({ count: pageParam })),
      getNextPageParam: () => undefined,
      initialPageParam: 42,
      select: (data) => ({
        pages: data.pages.map((p) => `count: ${p.count}`),
        pageParams: data.pageParams,
      }),
    })

    function Page() {
      const { data } = useUnit({ data: query.$data })
      return <span>{data?.pages.join(',') ?? 'none'}</span>
    }

    const rendered = renderWithScope(scope, <Page />)
    await allSettled(query.mounted, { scope })
    await vi.advanceTimersByTimeAsync(6)

    rendered.getByText('count: 42')
  })

  it('should cleanup on unmounted', async () => {
    const scope = fork()
    let fetchCount = 0

    const query = createInfiniteQuery(queryClient, {
      queryKey: ['items'],
      queryFn: ({ pageParam }: { pageParam: any }) => {
        fetchCount++
        return sleep(5).then(() => pageParam)
      },
      getNextPageParam: (lastPage: number) => lastPage + 1,
      initialPageParam: 0,
      refetchInterval: 10,
    })

    await allSettled(query.mounted, { scope })
    await vi.advanceTimersByTimeAsync(6)
    expect(fetchCount).toBe(1)

    await allSettled(query.unmounted, { scope })

    // Interval should stop
    const countAfterUnmount = fetchCount
    await vi.advanceTimersByTimeAsync(100)
    expect(fetchCount).toBe(countAfterUnmount)
  })

  it('should support bidirectional fetching', async () => {
    const scope = fork()

    const query = createInfiniteQuery(queryClient, {
      queryKey: ['items'],
      queryFn: ({ pageParam }: { pageParam: any }) =>
        sleep(5).then(() => pageParam),
      getNextPageParam: (lastPage: number) => lastPage + 1,
      getPreviousPageParam: (firstPage: number) => firstPage - 1,
      initialPageParam: 5,
    })

    function Page() {
      const { data, hasNextPage, hasPreviousPage } = useUnit({
        data: query.$data,
        hasNextPage: query.$hasNextPage,
        hasPreviousPage: query.$hasPreviousPage,
      })
      return (
        <div>
          <span>pages: {data?.pages.join(',') ?? 'none'}</span>
          <span>
            nav: prev={String(hasPreviousPage)}, next={String(hasNextPage)}
          </span>
        </div>
      )
    }

    const rendered = renderWithScope(scope, <Page />)
    await allSettled(query.mounted, { scope })
    await vi.advanceTimersByTimeAsync(6)

    rendered.getByText('pages: 5')
    rendered.getByText('nav: prev=true, next=true')

    // Fetch next
    await allSettled(query.fetchNextPage, { scope })
    await act(async () => {
      await vi.advanceTimersByTimeAsync(6)
    })
    rendered.getByText('pages: 5,6')

    // Fetch previous
    await allSettled(query.fetchPreviousPage, { scope })
    await act(async () => {
      await vi.advanceTimersByTimeAsync(6)
    })
    rendered.getByText('pages: 4,5,6')
  })

  it('should refetch all pages on refresh', async () => {
    let callCount = 0

    const query = createInfiniteQuery(queryClient, {
      queryKey: ['items'],
      queryFn: ({ pageParam }: { pageParam: any }) => {
        callCount++
        return sleep(5).then(() => pageParam * 10 + callCount)
      },
      getNextPageParam: (
        _last: number,
        _all: Array<number>,
        lastParam: number,
      ) => lastParam + 1,
      initialPageParam: 0,
      staleTime: Infinity,
    })

    // Use global scope for refresh (invalidateQueries returns promise)
    query.mounted()
    await vi.advanceTimersByTimeAsync(6)
    expect(query.$data.getState()?.pages).toEqual([1])

    // Fetch next page
    query.fetchNextPage()
    await vi.advanceTimersByTimeAsync(6)
    expect(query.$data.getState()?.pages).toEqual([1, 12])

    // Refresh — should refetch all pages
    const countBefore = callCount
    query.refresh()
    await vi.advanceTimersByTimeAsync(20)

    // Both pages should have been refetched
    expect(callCount).toBeGreaterThan(countBefore)
    expect(query.$data.getState()?.pages).toHaveLength(2)
  })

  it('should refetch when a Store inside queryKey changes', async () => {
    const scope = fork()
    const setCategory = createEvent<string>()
    const $category = createStore('all').on(setCategory, (_, v) => v)

    const query = createInfiniteQuery(queryClient, {
      queryKey: ['items', $category],
      queryFn: ({
        pageParam,
        queryKey: qk,
      }: {
        pageParam: any
        queryKey: any
      }) => sleep(5).then(() => `${qk[1]}-page${pageParam}`),
      getNextPageParam: () => undefined,
      initialPageParam: 1,
    })

    function Page() {
      const { data } = useUnit({ data: query.$data })
      return <span>pages: {data?.pages.join(',') ?? 'none'}</span>
    }

    const rendered = renderWithScope(scope, <Page />)
    await allSettled(query.mounted, { scope })
    await vi.advanceTimersByTimeAsync(6)

    rendered.getByText('pages: all-page1')

    // Change category — triggers updateObserverFx via resolveKey with Store
    await act(async () => {
      await allSettled(setCategory, { scope, params: 'sports' })
      await vi.advanceTimersByTimeAsync(6)
    })

    rendered.getByText('pages: sports-page1')
  })

  it('should start fetching when Store<boolean> enabled changes to true', async () => {
    const scope = fork()
    const setEnabled = createEvent<boolean>()
    const $enabled = createStore(false).on(setEnabled, (_, v) => v)
    const queryFn = vi
      .fn()
      .mockImplementation(({ pageParam }: { pageParam: any }) =>
        sleep(5).then(() => pageParam),
      )

    const query = createInfiniteQuery(queryClient, {
      queryKey: ['items'],
      queryFn,
      getNextPageParam: () => undefined,
      initialPageParam: 0,
      enabled: $enabled,
    })

    const rendered = renderWithScope(scope, <Page />)

    function Page() {
      const { data, status } = useUnit({
        data: query.$data,
        status: query.$status,
      })
      return (
        <span>
          {status}: {data?.pages.join(',') ?? 'none'}
        </span>
      )
    }

    await allSettled(query.mounted, { scope })
    await vi.advanceTimersByTimeAsync(10)
    expect(queryFn).not.toHaveBeenCalled()

    // Enable — should trigger fetch via updateObserverFx
    await act(async () => {
      await allSettled(setEnabled, { scope, params: true })
      await vi.advanceTimersByTimeAsync(6)
    })

    expect(queryFn).toHaveBeenCalledTimes(1)
    rendered.getByText('success: 0')
  })

  // ── placeholderData / keepPreviousData ──────────────────────────────

  it('should keep previous infinite data when placeholderData is keepPreviousData and key changes', async () => {
    const scope = fork()
    const setOrder = createEvent<string>()
    const $order = createStore('desc').on(setOrder, (_, v) => v)

    const query = createInfiniteQuery(queryClient, {
      queryKey: ['list', $order],
      queryFn: ({
        pageParam,
        queryKey: qk,
      }: {
        pageParam: any
        queryKey: any
      }) => sleep(10).then(() => `${pageParam}-${qk[1]}`),
      getNextPageParam: (
        _last: string,
        _all: Array<string>,
        lastParam: number,
      ) => lastParam + 1,
      initialPageParam: 0,
      placeholderData: keepPreviousData,
    })

    function Page() {
      const { data, isPlaceholderData, isFetching } = useUnit({
        data: query.$data,
        isPlaceholderData: query.$isPlaceholderData,
        isFetching: query.$isFetching,
      })
      return (
        <div>
          <span>pages: {data?.pages.join(',') ?? 'none'}</span>
          <span>placeholder: {String(isPlaceholderData)}</span>
          <span>fetching: {String(isFetching)}</span>
        </div>
      )
    }

    const rendered = renderWithScope(scope, <Page />)
    await allSettled(query.mounted, { scope })
    await vi.advanceTimersByTimeAsync(11)

    rendered.getByText('pages: 0-desc')

    // Fetch second page
    await allSettled(query.fetchNextPage, { scope })
    await act(async () => {
      await vi.advanceTimersByTimeAsync(11)
    })
    rendered.getByText('pages: 0-desc,1-desc')

    // Change key — placeholder shows previous data while new key fetches
    await act(async () => {
      await allSettled(setOrder, { scope, params: 'asc' })
    })
    rendered.getByText('pages: 0-desc,1-desc')
    rendered.getByText('placeholder: true')
    rendered.getByText('fetching: true')

    await act(async () => {
      await vi.advanceTimersByTimeAsync(11)
    })

    // New key only refetches first page; placeholder gone
    rendered.getByText('pages: 0-asc')
    rendered.getByText('placeholder: false')
  })

  // ── maxPages ────────────────────────────────────────────────────────

  it('should apply maxPages to limit the number of pages retained', async () => {
    const scope = fork()

    const query = createInfiniteQuery<number, Error, number>(queryClient, {
      queryKey: ['paged'],
      queryFn: ({ pageParam }: { pageParam: any }) =>
        sleep(5).then(() => pageParam),
      getNextPageParam: (lastPage: number) => lastPage + 1,
      getPreviousPageParam: (firstPage: number) => firstPage - 1,
      initialPageParam: 1,
      maxPages: 2,
    })

    function Page() {
      const { data } = useUnit({ data: query.$data })
      return <span>pages: {data?.pages.join(',') ?? 'none'}</span>
    }

    const rendered = renderWithScope(scope, <Page />)
    await allSettled(query.mounted, { scope })
    await vi.advanceTimersByTimeAsync(6)
    rendered.getByText('pages: 1')

    // Fetch page 2 — pages becomes [1, 2]
    await allSettled(query.fetchNextPage, { scope })
    await act(async () => {
      await vi.advanceTimersByTimeAsync(6)
    })
    rendered.getByText('pages: 1,2')

    // Fetch page 3 — first page evicted, pages becomes [2, 3]
    await allSettled(query.fetchNextPage, { scope })
    await act(async () => {
      await vi.advanceTimersByTimeAsync(6)
    })
    rendered.getByText('pages: 2,3')

    // Fetch the page before the first — last page evicted, pages becomes [1, 2]
    await allSettled(query.fetchPreviousPage, { scope })
    await act(async () => {
      await vi.advanceTimersByTimeAsync(6)
    })
    rendered.getByText('pages: 1,2')
  })

  // ── pagination termination ──────────────────────────────────────────

  it('should not invoke queryFn for fetchNextPage when getNextPageParam returns undefined', async () => {
    const scope = fork()
    const queryFn = vi
      .fn()
      .mockImplementation(({ pageParam }: { pageParam: any }) =>
        sleep(5).then(() => pageParam),
      )

    const query = createInfiniteQuery<number, Error, number>(queryClient, {
      queryKey: ['terminal'],
      queryFn,
      getNextPageParam: () => undefined,
      initialPageParam: 0,
    })

    await allSettled(query.mounted, { scope })
    await vi.advanceTimersByTimeAsync(6)
    expect(queryFn).toHaveBeenCalledTimes(1)
    expect(scope.getState(query.$hasNextPage)).toBe(false)

    await allSettled(query.fetchNextPage, { scope })
    await vi.advanceTimersByTimeAsync(20)

    // No additional call — terminal page boundary respected
    expect(queryFn).toHaveBeenCalledTimes(1)
  })
})
