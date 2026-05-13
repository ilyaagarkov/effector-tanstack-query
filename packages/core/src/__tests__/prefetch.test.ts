import { allSettled, createEvent, createStore, fork } from 'effector'
import { QueryClient } from '@tanstack/query-core'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createQuery } from '../createQuery'
import { createInfiniteQuery } from '../createInfiniteQuery'
import { $queryClient } from '../queryClient'
import { queryKey } from './test-utils'

// prefetch awaits the actual fetch — these tests use REAL timers so we can
// rely on the queryFn microtasks resolving normally. Fake timers would
// deadlock allSettled here (the same way they do for query.refresh).

describe('query.prefetch', () => {
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

  it('populates the queryClient cache before allSettled resolves', async () => {
    const key = queryKey()
    const query = createQuery(queryClient, {
      name: 'prefetch.basic',
      queryKey: key,
      queryFn: () => Promise.resolve({ id: 1, name: 'Alice' }),
    })

    const scope = fork()
    await allSettled(query.prefetch, { scope })

    // After prefetch resolves, the queryClient cache has the data — no
    // observer needed.
    const cached = queryClient.getQueryData(key)
    expect(cached).toEqual({ id: 1, name: 'Alice' })
  })

  it('on subsequent mount, observer reads from cache without refetching', async () => {
    const key = queryKey()
    const queryFn = vi.fn().mockResolvedValue('cached-value')
    const query = createQuery<string>(queryClient, {
      name: 'prefetch.cacheHit',
      queryKey: key,
      queryFn,
      staleTime: Infinity,
    })

    const scope = fork()
    await allSettled(query.prefetch, { scope })
    expect(queryFn).toHaveBeenCalledTimes(1)

    await allSettled(query.mounted, { scope })

    // Mount must have used the cached value — queryFn not called again.
    expect(queryFn).toHaveBeenCalledTimes(1)
    expect(scope.getState(query.$data)).toBe('cached-value')
    expect(scope.getState(query.$status)).toBe('success')
  })

  it('resolves a reactive queryKey at prefetch time', async () => {
    const setId = createEvent<number>()
    const $id = createStore(1).on(setId, (_, v) => v)

    let fetchedFor: number | null = null
    const query = createQuery(queryClient, {
      name: 'prefetch.reactive',
      queryKey: ['user', $id],
      queryFn: ({ queryKey: qk }) => {
        fetchedFor = qk[1] as number
        return Promise.resolve({ id: qk[1] })
      },
    })

    const scope = fork()
    await allSettled(setId, { scope, params: 7 })
    await allSettled(query.prefetch, { scope })

    expect(fetchedFor).toBe(7)
    expect(queryClient.getQueryData(['user', 7])).toEqual({ id: 7 })
  })

  it('is a no-op when `enabled` is false', async () => {
    const queryFn = vi.fn().mockResolvedValue('never')
    const query = createQuery(queryClient, {
      name: 'prefetch.disabled',
      queryKey: ['off'],
      queryFn,
      enabled: false,
    })

    const scope = fork()
    await allSettled(query.prefetch, { scope })

    expect(queryFn).not.toHaveBeenCalled()
    expect(queryClient.getQueryData(['off'])).toBeUndefined()
  })

  it('runs against the per-scope queryClient under fork({ values })', async () => {
    const qcA = new QueryClient({ defaultOptions: { queries: { retry: false } } })
    qcA.mount()
    const qcB = new QueryClient({ defaultOptions: { queries: { retry: false } } })
    qcB.mount()

    const query = createQuery({
      name: 'prefetch.perScope',
      queryKey: ['user'],
      queryFn: () => Promise.resolve('hi'),
    })

    const scopeA = fork({ values: [[$queryClient, qcA]] })
    void fork({ values: [[$queryClient, qcB]] }) // built to prove qcB stays clean

    await allSettled(query.prefetch, { scope: scopeA })

    expect(qcA.getQueryData(['user'])).toBe('hi')
    // scopeB never prefetched — its cache stays empty.
    expect(qcB.getQueryData(['user'])).toBeUndefined()

    qcA.clear()
    qcB.clear()
  })
})

describe('infiniteQuery.prefetch', () => {
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

  it('prefetches the first page via fetchInfiniteQuery', async () => {
    const query = createInfiniteQuery<number, Error, number>(queryClient, {
      name: 'prefetch.infinite',
      queryKey: ['paged'],
      queryFn: ({ pageParam }: { pageParam: any }) => Promise.resolve(pageParam),
      getNextPageParam: (last: number) => last + 1,
      initialPageParam: 0,
    })

    const scope = fork()
    await allSettled(query.prefetch, { scope })

    const cached = queryClient.getQueryData<{
      pages: Array<number>
      pageParams: Array<number>
    }>(['paged'])
    expect(cached?.pages).toEqual([0])
    expect(cached?.pageParams).toEqual([0])
  })
})
