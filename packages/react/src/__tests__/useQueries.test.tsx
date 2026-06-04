import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { act, render } from '@testing-library/react'
import * as React from 'react'
import { Provider } from 'effector-react'
import { allSettled, createStore, fork } from 'effector'
import { QueryClient } from '@tanstack/query-core'
import {
  $queryClient,
  createQueries,
  createQuery,
} from '@effector-tanstack-query/core'
import { useQueries } from '..'
import { queryKey, sleep } from './test-utils'
import type { Scope } from 'effector'

function renderWithScope(scope: Scope, ui: React.ReactElement) {
  return render(<Provider value={scope}>{ui}</Provider>)
}

describe('useQueries', () => {
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

  // ----- Tuple overload ---------------------------------------------------

  it('tuple: reads parallel results from a static array of factories', async () => {
    const userQuery = createQuery<string>({
      name: 'tuple.user',
      queryKey: queryKey(),
      queryFn: () => sleep(5).then(() => 'alice'),
    })
    const postsQuery = createQuery<number[]>({
      name: 'tuple.posts',
      queryKey: queryKey(),
      queryFn: () => sleep(5).then(() => [1, 2, 3]),
    })

    const scope = fork({ values: [[$queryClient, queryClient]] })

    function Page() {
      const [user, posts] = useQueries([userQuery, postsQuery] as const)
      if (user.isPending || posts.isPending) return <span>loading</span>
      return (
        <span>
          {user.data} / {posts.data?.join(',')}
        </span>
      )
    }

    const rendered = renderWithScope(scope, <Page />)
    rendered.getByText('loading')
    await act(async () => {
      await vi.advanceTimersByTimeAsync(10)
    })
    rendered.getByText('alice / 1,2,3')
  })

  it('tuple: refresh on one element does not refetch the other', async () => {
    const userFn = vi.fn(() => sleep(5).then(() => 'alice'))
    const postsFn = vi.fn(() => sleep(5).then(() => [1, 2]))

    const userQuery = createQuery<string>({
      name: 'tuple.refreshUser',
      queryKey: queryKey(),
      queryFn: userFn,
      staleTime: Infinity,
    })
    const postsQuery = createQuery<number[]>({
      name: 'tuple.refreshPosts',
      queryKey: queryKey(),
      queryFn: postsFn,
      staleTime: Infinity,
    })

    const scope = fork({ values: [[$queryClient, queryClient]] })

    let refreshUser: (() => void) | null = null

    function Page() {
      const [user, posts] = useQueries([userQuery, postsQuery] as const)
      refreshUser = user.refresh
      return (
        <span>
          {user.data ?? '_'} / {posts.data?.join(',') ?? '_'}
        </span>
      )
    }

    renderWithScope(scope, <Page />)
    await act(async () => {
      await vi.advanceTimersByTimeAsync(10)
    })
    expect(userFn).toHaveBeenCalledTimes(1)
    expect(postsFn).toHaveBeenCalledTimes(1)

    await act(async () => {
      refreshUser?.()
      await vi.advanceTimersByTimeAsync(10)
    })
    expect(userFn).toHaveBeenCalledTimes(2)
    expect(postsFn).toHaveBeenCalledTimes(1)
  })

  // ----- Family overload --------------------------------------------------

  it('family: returns one UseQueryResult per source item, in order', async () => {
    const $ids = createStore<number[]>([1, 2, 3])
    const family = createQueries<number, string>({
      name: 'family.usequeries',
      source: $ids,
      query: (id) => ({
        queryKey: ['family-q', id],
        queryFn: () => sleep(5).then(() => `data-${id}`),
      }),
    })

    const scope = fork({ values: [[$queryClient, queryClient]] })

    function Page() {
      const items = useQueries(family)
      return (
        <ul>
          {items.map((it, i) => (
            <li key={i}>{it.isPending ? '…' : it.data}</li>
          ))}
        </ul>
      )
    }

    const rendered = renderWithScope(scope, <Page />)
    expect(rendered.container.textContent).toBe('………')
    await act(async () => {
      await vi.advanceTimersByTimeAsync(10)
    })
    expect(rendered.container.textContent).toBe('data-1data-2data-3')
  })

  it('family: source change spawns/disposes observers and re-renders', async () => {
    const $ids = createStore<number[]>([1, 2])
    const family = createQueries<number, string>({
      name: 'family.usequeries.diff',
      source: $ids,
      query: (id) => ({
        queryKey: ['family-diff', id],
        queryFn: () => sleep(5).then(() => `data-${id}`),
      }),
    })

    const scope = fork({ values: [[$queryClient, queryClient]] })

    function Page() {
      const items = useQueries(family)
      return (
        <span>
          {items.map((it) => (it.isPending ? '?' : it.data)).join(',')}
        </span>
      )
    }

    const rendered = renderWithScope(scope, <Page />)
    await act(async () => {
      await vi.advanceTimersByTimeAsync(10)
    })
    expect(rendered.container.textContent).toBe('data-1,data-2')

    await act(async () => {
      await allSettled($ids, { params: [1, 2, 3], scope })
      await vi.advanceTimersByTimeAsync(10)
    })
    expect(rendered.container.textContent).toBe('data-1,data-2,data-3')

    await act(async () => {
      await allSettled($ids, { params: [2], scope })
    })
    expect(rendered.container.textContent).toBe('data-2')
  })

  it('family: per-item refresh routes through refreshOne', async () => {
    const fetchSpy = vi.fn((id: number) =>
      sleep(5).then(() => `data-${id}-${fetchSpy.mock.calls.length}`),
    )
    const $ids = createStore<number[]>([1, 2])
    const family = createQueries<number, string>({
      name: 'family.perItem',
      source: $ids,
      query: (id) => ({
        queryKey: ['per-item', id],
        queryFn: () => fetchSpy(id),
        staleTime: Infinity,
      }),
    })

    const scope = fork({ values: [[$queryClient, queryClient]] })

    let refreshFirst: (() => void) | null = null

    function Page() {
      const items = useQueries(family)
      refreshFirst = items[0]?.refresh ?? null
      return <span>{items.map((it) => it.data ?? '?').join(',')}</span>
    }

    renderWithScope(scope, <Page />)
    await act(async () => {
      await vi.advanceTimersByTimeAsync(10)
    })
    const initialCalls = fetchSpy.mock.calls.length

    await act(async () => {
      refreshFirst?.()
      await vi.advanceTimersByTimeAsync(10)
    })
    // One extra fetch — for the first item only.
    expect(fetchSpy.mock.calls.length).toBe(initialCalls + 1)
    // Both refetched calls were for id=1.
    expect(fetchSpy.mock.calls.at(-1)?.[0]).toBe(1)
  })
})
