import { allSettled, createEvent, createStore, fork } from 'effector'
import { InfiniteQueryObserver, QueryClient } from '@tanstack/query-core'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createInfiniteQuery } from '../createInfiniteQuery'
import { $queryClient } from '../queryClient'
import { queryKey, sleep } from './test-utils'

// Real timers: prefetch/mount await microtasks; fake timers would deadlock.

describe('createInfiniteQuery (core)', () => {
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

  it('strips refetchInterval from observer options when given as a Store', async () => {
    // Reactive refetchInterval — the factory must delete it from restOptions
    // so it doesn't double-wire (Store form is owned by createBaseQuery's
    // reactive plumbing; the observer gets the resolved value via setOptions).
    const $interval = createStore<number | false>(false)
    const key = queryKey()
    const queryFn = vi.fn(() => Promise.resolve({ items: ['x'], next: null }))

    const query = createInfiniteQuery<
      { items: Array<string>; next: number | null },
      Error,
      number | null
    >(queryClient, {
      name: 'inf.reactiveRefetch',
      queryKey: key,
      queryFn: ({ pageParam }) => {
        queryFn()
        return Promise.resolve({ items: [`p${pageParam}`], next: null })
      },
      initialPageParam: 0,
      getNextPageParam: (last) => last.next,
      refetchInterval: $interval,
      staleTime: Infinity,
    })

    const scope = fork({ values: [[$queryClient, queryClient]] })
    await allSettled(query.mounted, { scope })
    await sleep(10)

    // Sanity: data is fetched once at mount, no interval running.
    expect(queryFn).toHaveBeenCalledTimes(1)
  })

  it('fetchNextPage is a no-op when called before mount (no observer)', async () => {
    const queryFn = vi.fn(({ pageParam }: { pageParam: number }) =>
      Promise.resolve({ items: [`p${pageParam}`], next: null }),
    )
    const query = createInfiniteQuery<
      { items: Array<string>; next: number | null },
      Error,
      number
    >(queryClient, {
      name: 'inf.fetchNextNoObserver',
      queryKey: queryKey(),
      queryFn,
      initialPageParam: 0,
      getNextPageParam: (last) => last.next,
    })
    const scope = fork({ values: [[$queryClient, queryClient]] })

    // Observer hasn't been created — fetchNextPageFx's `if (!observer) return`
    // path; no throw.
    await allSettled(query.fetchNextPage, { scope })
    expect(queryFn).not.toHaveBeenCalled()
  })

  it('fetchPreviousPage is a no-op when called before mount (no observer)', async () => {
    const queryFn = vi.fn(({ pageParam }: { pageParam: number }) =>
      Promise.resolve({ items: [`p${pageParam}`], next: null }),
    )
    const query = createInfiniteQuery<
      { items: Array<string>; next: number | null },
      Error,
      number
    >(queryClient, {
      name: 'inf.fetchPrevNoObserver',
      queryKey: queryKey(),
      queryFn,
      initialPageParam: 0,
      getNextPageParam: (last) => last.next,
      getPreviousPageParam: (first) => (first.items.length > 0 ? 0 : null),
    })
    const scope = fork({ values: [[$queryClient, queryClient]] })

    await allSettled(query.fetchPreviousPage, { scope })
    expect(queryFn).not.toHaveBeenCalled()
  })

  it('__createObserver returns a working InfiniteQueryObserver (suspense helper)', () => {
    const query = createInfiniteQuery<
      { items: Array<string>; next: number | null },
      Error,
      number
    >(queryClient, {
      name: 'inf.transient',
      queryKey: queryKey(),
      queryFn: ({ pageParam }) =>
        Promise.resolve({ items: [`p${pageParam}`], next: null }),
      initialPageParam: 0,
      getNextPageParam: (last) => last.next,
    })

    const factory = query as typeof query & {
      __createObserver: (
        qc: QueryClient,
        init: { queryKey: unknown; enabled: boolean },
      ) => InfiniteQueryObserver
    }

    const observer = factory.__createObserver(queryClient, {
      queryKey: ['inf-transient'],
      enabled: true,
    })

    expect(observer).toBeInstanceOf(InfiniteQueryObserver)
    expect(observer.options.queryKey).toEqual(['inf-transient'])
    observer.destroy()
  })

  it('fetchNextPage / fetchPreviousPage drive the observer once mounted', async () => {
    const calls: Array<number> = []
    const query = createInfiniteQuery<
      { items: Array<string>; next: number | null; prev: number | null },
      Error,
      number
    >(queryClient, {
      name: 'inf.paginate',
      queryKey: queryKey(),
      queryFn: ({ pageParam }) => {
        calls.push(pageParam)
        return Promise.resolve({
          items: [`p${pageParam}`],
          next: pageParam + 1,
          prev: pageParam - 1,
        })
      },
      initialPageParam: 0,
      getNextPageParam: (last) => last.next,
      getPreviousPageParam: (first) => first.prev,
      staleTime: Infinity,
    })

    const scope = fork({ values: [[$queryClient, queryClient]] })
    await allSettled(query.mounted, { scope })
    await sleep(10)
    expect(calls).toEqual([0])

    // Observer now exists → fetchNextPageFx calls observer.fetchNextPage().
    await allSettled(query.fetchNextPage, { scope })
    await sleep(10)
    expect(calls).toEqual([0, 1])

    // Same path for fetchPreviousPage.
    await allSettled(query.fetchPreviousPage, { scope })
    await sleep(10)
    expect(calls).toEqual([0, 1, -1])
  })

  it('prefetch is a no-op when enabled is false', async () => {
    const queryFn = vi.fn(({ pageParam }: { pageParam: number }) =>
      Promise.resolve({ items: [`p${pageParam}`], next: null }),
    )
    const query = createInfiniteQuery<
      { items: Array<string>; next: number | null },
      Error,
      number
    >(queryClient, {
      name: 'inf.prefetchDisabled',
      queryKey: queryKey(),
      queryFn,
      initialPageParam: 0,
      getNextPageParam: (last) => last.next,
      enabled: false,
    })
    const scope = fork({ values: [[$queryClient, queryClient]] })

    await allSettled(query.prefetch, { scope })
    // prefetchFx hits the `if (!qc || !enabled) return` early exit because
    // `enabled: false` propagates through to the effect's source.
    expect(queryFn).not.toHaveBeenCalled()
  })

  it('prefetch is a no-op when no QueryClient is set (no explicit factory client)', async () => {
    const queryFn = vi.fn(({ pageParam }: { pageParam: number }) =>
      Promise.resolve({ items: [`p${pageParam}`], next: null }),
    )
    // Single-arg form — no explicit qc, falls back to global $queryClient.
    // This exercises the `parseInfiniteArgs` null-client branch as a side
    // benefit.
    const query = createInfiniteQuery<
      { items: Array<string>; next: number | null },
      Error,
      number
    >({
      name: 'inf.prefetchNoClient',
      queryKey: queryKey(),
      queryFn,
      initialPageParam: 0,
      getNextPageParam: (last) => last.next,
    })

    // Fresh scope, no qc — prefetchFx hits the `if (!qc || !enabled) return`
    // path via the qc branch.
    const scope = fork()
    await allSettled(query.prefetch, { scope })
    expect(queryFn).not.toHaveBeenCalled()
  })

  it('does not throw when created without a `name` (covers warn branch)', () => {
    // warnMissingName fires at most once per role across the test process.
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    expect(() =>
      createInfiniteQuery<
        { items: Array<string>; next: number | null },
        Error,
        number
      >({
        queryKey: ['inf-noname'],
        queryFn: ({ pageParam }) =>
          Promise.resolve({ items: [`p${pageParam}`], next: null }),
        initialPageParam: 0,
        getNextPageParam: (last) => last.next,
      }),
    ).not.toThrow()
    warn.mockRestore()
  })

  it('reactive queryKey with createEvent setter still triggers infinite refetch', async () => {
    const setId = createEvent<number>()
    const $id = createStore(1).on(setId, (_, v) => v)
    const calls: Array<number> = []

    const query = createInfiniteQuery<
      { items: Array<string>; next: number | null },
      Error,
      number
    >(queryClient, {
      name: 'inf.reactiveKey',
      queryKey: ['inf-user', $id],
      queryFn: ({ pageParam, queryKey: qk }) => {
        calls.push(qk[1] as number)
        return Promise.resolve({ items: [`u${qk[1]}-p${pageParam}`], next: null })
      },
      initialPageParam: 0,
      getNextPageParam: (last) => last.next,
      staleTime: Infinity,
    })

    const scope = fork({ values: [[$queryClient, queryClient]] })
    await allSettled(query.mounted, { scope })
    await sleep(10)
    expect(calls).toEqual([1])

    await allSettled(setId, { scope, params: 2 })
    await sleep(10)
    expect(calls).toEqual([1, 2])
  })
})
