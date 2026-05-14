import { fork, serialize } from 'effector'
import { QueryClient } from '@tanstack/query-core'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createQuery } from '../createQuery'
import { createInfiniteQuery } from '../createInfiniteQuery'
import { $queryClient } from '../queryClient'
import { prefetchQueries } from '../prefetchQueries'
import { queryKey } from './test-utils'

// Same as prefetch tests: real timers because allSettled awaits the actual
// fetch microtasks and would deadlock under fake timers.

describe('prefetchQueries', () => {
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

  it('runs prefetch then mount for each query and populates effector stores', async () => {
    const key = queryKey()
    const queryFn = vi.fn().mockResolvedValue({ id: 1, name: 'Alice' })

    const query = createQuery(queryClient, {
      name: 'prefetchQueries.user',
      queryKey: key,
      queryFn,
      staleTime: Infinity,
    })

    const scope = fork({ values: [[$queryClient, queryClient]] })
    await prefetchQueries([query], { scope })

    // Cache populated by prefetch step
    expect(queryClient.getQueryData(key)).toEqual({ id: 1, name: 'Alice' })
    // Stores populated by mount step (observer dispatch)
    expect(scope.getState(query.$data)).toEqual({ id: 1, name: 'Alice' })
    expect(scope.getState(query.$status)).toBe('success')
    // Mount must NOT cause a second fetch — cache is fresh
    expect(queryFn).toHaveBeenCalledTimes(1)
  })

  it('serialize(scope) ships populated stores to the client', async () => {
    const query = createQuery(queryClient, {
      name: 'prefetchQueries.serialized',
      queryKey: ['x'],
      queryFn: () => Promise.resolve('hello'),
      staleTime: Infinity,
    })

    const scope = fork({ values: [[$queryClient, queryClient]] })
    await prefetchQueries([query], { scope })

    const snapshot = serialize(scope)
    // Effector serializes by SID; both $data and $status should be present
    // with the prefetched values, so the client doesn't render Loading
    // before the observer's first dispatch arrives.
    expect(snapshot).toMatchObject({
      '@tanstack/query-effector.prefetchQueries.serialized.$data': 'hello',
      '@tanstack/query-effector.prefetchQueries.serialized.$status': 'success',
    })
  })

  it('handles a heterogeneous mix of queries and infinite queries', async () => {
    const userQuery = createQuery(queryClient, {
      name: 'prefetchQueries.user2',
      queryKey: ['user'],
      queryFn: () => Promise.resolve({ name: 'Bob' }),
      staleTime: Infinity,
    })

    const feed = createInfiniteQuery({
      queryClient,
      name: 'prefetchQueries.feed',
      queryKey: ['feed'],
      queryFn: ({ pageParam }) =>
        Promise.resolve({ items: [`p${pageParam}`], next: null }),
      initialPageParam: 0,
      getNextPageParam: (last: { next: number | null }) => last.next,
      staleTime: Infinity,
    })

    const scope = fork({ values: [[$queryClient, queryClient]] })
    await prefetchQueries([userQuery, feed], { scope })

    expect(scope.getState(userQuery.$data)).toEqual({ name: 'Bob' })
    expect(scope.getState(feed.$data)).toBeDefined()
    // Both observers in the same scope; both stores filled — confirms
    // mounting both queries didn't blow away the other's data.
  })

  it('resolves to undefined and is awaitable on an empty array', async () => {
    const scope = fork({ values: [[$queryClient, queryClient]] })
    await expect(prefetchQueries([], { scope })).resolves.toBeUndefined()
  })
})
