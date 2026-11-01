import { allSettled, createEvent, createStore, fork } from 'effector'
import { QueryClient } from '@tanstack/query-core'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  $queryClient,
  createInfiniteQuery,
  infiniteQueryOptions,
  prefetchQueries,
} from '../index'

describe('createInfiniteQuery factory form', () => {
  let client: QueryClient
  beforeEach(() => {
    vi.useFakeTimers()
    client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
    client.mount()
  })
  afterEach(() => {
    client.unmount()
    client.clear()
    vi.useRealTimers()
  })

  it('uses factory page options when an optional top-level key is explicitly undefined', async () => {
    const query = createInfiniteQuery(client, {
      source: createStore(7),
      query: (id) => ({
        queryKey: ['optional-page-key', id],
        initialPageParam: 0,
        queryFn: ({ pageParam }: { pageParam: number }) => id + pageParam,
        getNextPageParam: () => undefined,
      }),
      queryKey: undefined,
    })
    const scope = fork()
    await allSettled(query.prefetch, { scope })
    await allSettled(query.mounted, { scope })
    expect(scope.getState(query.$data)).toEqual({ pages: [7], pageParams: [0] })
  })

  it('keeps page cursors and selected data while switching source keys', async () => {
    const changed = createEvent<string>()
    const $category = createStore('a').on(changed, (_, v) => v)
    const query = createInfiniteQuery(client, {
      source: { category: $category },
      query: ({ category }) =>
        infiniteQueryOptions({
          queryKey: ['pages', { category }],
          initialPageParam: 1,
          queryFn: async ({ pageParam }) => ({ category, page: pageParam }),
          getNextPageParam: (page) =>
            page.page < 2 ? page.page + 1 : undefined,
          getPreviousPageParam: (page) =>
            page.page > 0 ? page.page - 1 : undefined,
          select: (data) =>
            data.pages.map((page) => `${page.category}-${page.page}`),
        }),
    })
    const scope = fork()
    await prefetchQueries([query], { scope })
    expect(scope.getState(query.$data)).toEqual(['a-1'])
    await allSettled(query.fetchNextPage, { scope })
    await vi.advanceTimersByTimeAsync(1)
    expect(scope.getState(query.$data)).toEqual(['a-1', 'a-2'])
    expect(scope.getState(query.$hasNextPage)).toBe(false)
    await allSettled(query.fetchPreviousPage, { scope })
    await vi.advanceTimersByTimeAsync(1)
    expect(scope.getState(query.$data)).toEqual(['a-0', 'a-1', 'a-2'])
    expect(scope.getState(query.$hasPreviousPage)).toBe(false)
    await allSettled(changed, { scope, params: 'b' })
    await vi.advanceTimersByTimeAsync(1)
    expect(scope.getState(query.$data)).toEqual(['b-1'])
    expect(client.getQueryData(['pages', { category: 'a' }])).toEqual({
      pages: [
        { category: 'a', page: 0 },
        { category: 'a', page: 1 },
        { category: 'a', page: 2 },
      ],
      pageParams: [0, 1, 2],
    })
  })

  it('uses current initialPageParam and closures for scoped prefetch', async () => {
    const $start = createStore(1)
    const query = createInfiniteQuery({
      name: 'infinite.factory.ssr',
      source: $start,
      query: (start) =>
        infiniteQueryOptions({
          queryKey: ['scoped-pages', start],
          initialPageParam: start,
          queryFn: async ({ pageParam }) => pageParam * start,
          getNextPageParam: () => undefined,
        }),
    })
    const scope = fork({
      values: [
        [$start, 3],
        [$queryClient, client],
      ],
    })
    await prefetchQueries([query], { scope })
    expect(scope.getState(query.$data)).toEqual({ pages: [9], pageParams: [3] })
    expect(client.getQueryData(['scoped-pages', 1])).toBeUndefined()
  })

  it('updates same-key selection and next-page behavior without an extra initial fetch', async () => {
    const changed = createEvent<number>()
    const $step = createStore(1).on(changed, (_, v) => v)
    const calls: number[] = []
    const query = createInfiniteQuery(client, {
      source: $step,
      query: (step) =>
        infiniteQueryOptions({
          queryKey: ['step'],
          initialPageParam: 0,
          staleTime: Infinity,
          queryFn: ({ pageParam }) => {
            calls.push(pageParam)
            return pageParam
          },
          getNextPageParam: (page) => page + step,
          select: (data) => data.pages.map((page) => page + step),
        }),
    })
    const scope = fork()
    await prefetchQueries([query], { scope })
    await allSettled(changed, { scope, params: 5 })
    expect(scope.getState(query.$data)).toEqual([5])
    expect(calls).toEqual([0])
    await allSettled(query.fetchNextPage, { scope })
    await vi.advanceTimersByTimeAsync(1)
    expect(calls).toEqual([0, 5])
    expect(scope.getState(query.$data)).toEqual([5, 10])
  })

  it('honors derived boolean enabled for prefetch and mount', async () => {
    const queryFn = vi.fn(() => 1)
    const query = createInfiniteQuery(client, {
      source: {},
      enabled: createStore(false).map((value) => value),
      query: () =>
        infiniteQueryOptions({
          queryKey: ['disabled-pages'],
          enabled: true,
          queryFn,
          initialPageParam: 0,
          getNextPageParam: () => undefined,
        }),
    })
    const scope = fork()
    await allSettled(query.prefetch, { scope })
    await allSettled(query.mounted, { scope })
    expect(queryFn).not.toHaveBeenCalled()
  })
})
