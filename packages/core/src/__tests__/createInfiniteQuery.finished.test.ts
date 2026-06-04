import {
  allSettled,
  createEvent,
  createStore,
  createWatch,
  fork,
} from 'effector'
import { QueryClient } from '@tanstack/query-core'
import type { InfiniteData } from '@tanstack/query-core'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createInfiniteQuery } from '../createInfiniteQuery'
import { $queryClient } from '../queryClient'
import { queryKey, sleep } from './test-utils'

// Real timers: prefetch / refetch await microtasks; fake timers would deadlock.
// Mirrors createQuery.finished.test.ts for the infinite flavor — payload is
// InfiniteData (or the post-select shape).

type Page = { items: Array<string>; next: number | null }

describe('createInfiniteQuery finished events', () => {
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

  it('fires finished.success with InfiniteData after a successful fetch', async () => {
    const success = vi.fn()
    const scope = fork({ values: [[$queryClient, queryClient]] })
    const query = createInfiniteQuery<Page, Error, number | null>(queryClient, {
      name: 'inf.finished.success.basic',
      queryKey: queryKey(),
      queryFn: ({ pageParam }) =>
        sleep(10).then(() => ({ items: [`p${pageParam}`], next: null })),
      initialPageParam: 0,
      getNextPageParam: (last) => last.next,
    })
    const unwatch = createWatch({
      unit: query.finished.success,
      scope,
      fn: success,
    })

    await allSettled(query.mounted, { scope })
    await sleep(20)

    expect(success).toHaveBeenCalledTimes(1)
    const payload = success.mock.calls[0]![0] as InfiniteData<
      Page,
      number | null
    >
    expect(payload.pages).toEqual([{ items: ['p0'], next: null }])
    unwatch()
  })

  it('fires finished.success with the post-select shape', async () => {
    const success = vi.fn()
    const scope = fork({ values: [[$queryClient, queryClient]] })
    const query = createInfiniteQuery(queryClient, {
      name: 'inf.finished.success.select',
      queryKey: queryKey(),
      queryFn: ({ pageParam }: { pageParam: number }) =>
        sleep(10).then(() => ({ items: [`p${pageParam}`], next: null })),
      initialPageParam: 0,
      getNextPageParam: (last) => last.next,
      select: (data) => data.pages.flatMap((p) => p.items),
    })
    const unwatch = createWatch({
      unit: query.finished.success,
      scope,
      fn: success,
    })

    await allSettled(query.mounted, { scope })
    await sleep(20)

    expect(success).toHaveBeenCalledTimes(1)
    expect(success).toHaveBeenCalledWith(['p0'])
    unwatch()
  })

  it('fires finished.failure with TError on a failed fetch', async () => {
    const failure = vi.fn()
    const error = new Error('inf boom')
    const scope = fork({ values: [[$queryClient, queryClient]] })
    const query = createInfiniteQuery<Page, Error, number>(queryClient, {
      name: 'inf.finished.failure.basic',
      queryKey: queryKey(),
      queryFn: () => sleep(10).then(() => Promise.reject(error)),
      initialPageParam: 0,
      getNextPageParam: (last) => last.next,
    })
    const unwatch = createWatch({
      unit: query.finished.failure,
      scope,
      fn: failure,
    })

    await allSettled(query.mounted, { scope })
    await sleep(20)

    expect(failure).toHaveBeenCalledTimes(1)
    expect(failure).toHaveBeenCalledWith(error)
    unwatch()
  })

  it('does NOT fire finished.success on first mount with hydrated cache data', async () => {
    const key = queryKey()
    const success = vi.fn()

    await queryClient.fetchInfiniteQuery({
      queryKey: key,
      queryFn: ({ pageParam }) =>
        sleep(5).then(() => ({ items: [`hydrated-${pageParam}`], next: null })),
      initialPageParam: 0,
      getNextPageParam: (last: Page) => last.next,
    })

    const scope = fork({ values: [[$queryClient, queryClient]] })
    const query = createInfiniteQuery<Page, Error, number | null>(queryClient, {
      name: 'inf.finished.success.hydrated',
      queryKey: key,
      queryFn: ({ pageParam }) =>
        sleep(10).then(() => ({ items: [`fresh-${pageParam}`], next: null })),
      initialPageParam: 0,
      getNextPageParam: (last) => last.next,
      staleTime: Infinity,
    })
    const unwatch = createWatch({
      unit: query.finished.success,
      scope,
      fn: success,
    })

    await allSettled(query.mounted, { scope })
    await sleep(20)

    const data = scope.getState(query.$data) as InfiniteData<Page, number | null>
    expect(data.pages).toEqual([{ items: ['hydrated-0'], next: null }])
    expect(success).not.toHaveBeenCalled()
    unwatch()
  })

  it('does NOT fire at the start of a refetch (only on resolution)', async () => {
    const success = vi.fn()
    let count = 0
    const query = createInfiniteQuery<Page, Error, number | null>(queryClient, {
      name: 'inf.finished.success.refetchStart',
      queryKey: queryKey(),
      queryFn: ({ pageParam }) =>
        sleep(30).then(() => ({
          items: [`p${pageParam}-${++count}`],
          next: null,
        })),
      initialPageParam: 0,
      getNextPageParam: (last) => last.next,
      staleTime: Infinity,
    })
    // Default scope keeps the refresh/invalidate timeline simple.
    const unwatch = query.finished.success.watch(success)

    query.mounted()
    await sleep(40)
    expect(success).toHaveBeenCalledTimes(1)
    success.mockClear()

    // Refetch in flight — isFetching true, but no event until it resolves.
    query.refresh()
    await sleep(10)
    expect(query.$isFetching.getState()).toBe(true)
    expect(success).not.toHaveBeenCalled()

    await sleep(30)
    expect(success).toHaveBeenCalledTimes(1)
    unwatch()
  })

  it('tracks baseline per scope — events land only in the mounted scope', async () => {
    const successA = vi.fn()
    const successB = vi.fn()
    const scopeA = fork({ values: [[$queryClient, queryClient]] })
    const scopeB = fork({ values: [[$queryClient, queryClient]] })
    const query = createInfiniteQuery<Page, Error, number | null>(queryClient, {
      name: 'inf.finished.success.perScope',
      queryKey: queryKey(),
      queryFn: ({ pageParam }) =>
        sleep(10).then(() => ({ items: [`p${pageParam}`], next: null })),
      initialPageParam: 0,
      getNextPageParam: (last) => last.next,
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
    await sleep(20)

    expect(successA).toHaveBeenCalledTimes(1)
    expect(successB).not.toHaveBeenCalled()
    uA()
    uB()
  })

  it('fires finished.success again after a reactive key change', async () => {
    const success = vi.fn()
    const key = queryKey()
    const setId = createEvent<number>()
    const $id = createStore(1).on(setId, (_, v) => v)
    const scope = fork({ values: [[$queryClient, queryClient]] })
    const query = createInfiniteQuery<Page, Error, number | null>(queryClient, {
      name: 'inf.finished.success.keyChange',
      queryKey: [...key, $id],
      queryFn: ({ queryKey: qk, pageParam }) =>
        sleep(10).then(() => ({
          items: [`u${qk[qk.length - 1]}-p${pageParam}`],
          next: null,
        })),
      initialPageParam: 0,
      getNextPageParam: (last) => last.next,
    })
    const unwatch = createWatch({
      unit: query.finished.success,
      scope,
      fn: success,
    })

    await allSettled(query.mounted, { scope })
    await sleep(20)
    expect(success).toHaveBeenCalledTimes(1)
    let payload = success.mock.calls[0]![0] as InfiniteData<Page, number | null>
    expect(payload.pages[0]!.items).toEqual(['u1-p0'])

    await allSettled(setId, { scope, params: 2 })
    await sleep(20)
    expect(success).toHaveBeenCalledTimes(2)
    payload = success.mock.calls[1]![0] as InfiniteData<Page, number | null>
    expect(payload.pages[0]!.items).toEqual(['u2-p0'])
    unwatch()
  })
})
