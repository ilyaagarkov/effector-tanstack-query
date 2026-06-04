import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { act, render } from '@testing-library/react'
import * as React from 'react'
import { Provider } from 'effector-react'
import { allSettled, fork } from 'effector'
import { QueryClient } from '@tanstack/query-core'
import { $queryClient, createQuery, setQueryClient } from '@effector-tanstack-query/core'
import { useIsFetching, useQuery } from '..'
import { sleep } from './test-utils'
import type { Scope } from 'effector'

function renderWithScope(scope: Scope, ui: React.ReactElement) {
  return render(<Provider value={scope}>{ui}</Provider>)
}

describe('useIsFetching', () => {
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

  function Indicator({ filters }: { filters?: Parameters<typeof useIsFetching>[0] }) {
    const count = useIsFetching(filters)
    return <span data-testid="count">{count}</span>
  }

  it('returns 0 when there are no active queries', () => {
    const scope = fork({ values: [[$queryClient, queryClient]] })
    const r = renderWithScope(scope, <Indicator />)
    expect(r.getByTestId('count').textContent).toBe('0')
  })

  it('increments to 1 while a fetch is in flight, back to 0 after it settles', async () => {
    const query = createQuery<string>({
      name: 'isFetching.single',
      queryKey: ['isFetching', 'single'],
      queryFn: () => sleep(10).then(() => 'data'),
    })
    const scope = fork({ values: [[$queryClient, queryClient]] })

    function Page() {
      useQuery(query)
      return <Indicator />
    }

    const r = renderWithScope(scope, <Page />)
    // The mount effect kicked off the fetch synchronously.
    expect(r.getByTestId('count').textContent).toBe('1')

    await act(async () => {
      await vi.advanceTimersByTimeAsync(11)
    })
    expect(r.getByTestId('count').textContent).toBe('0')
  })

  it('counts multiple simultaneous fetches', async () => {
    const q1 = createQuery<string>({
      name: 'isFetching.multi1',
      queryKey: ['isFetching', 'multi', 1],
      queryFn: () => sleep(10).then(() => 'a'),
    })
    const q2 = createQuery<string>({
      name: 'isFetching.multi2',
      queryKey: ['isFetching', 'multi', 2],
      queryFn: () => sleep(10).then(() => 'b'),
    })
    const scope = fork({ values: [[$queryClient, queryClient]] })

    function Page() {
      useQuery(q1)
      useQuery(q2)
      return <Indicator />
    }

    const r = renderWithScope(scope, <Page />)
    expect(r.getByTestId('count').textContent).toBe('2')

    await act(async () => {
      await vi.advanceTimersByTimeAsync(11)
    })
    expect(r.getByTestId('count').textContent).toBe('0')
  })

  it('filters by queryKey — ignores non-matching queries', async () => {
    const userQuery = createQuery<string>({
      name: 'isFetching.user',
      queryKey: ['user', 1],
      queryFn: () => sleep(10).then(() => 'alice'),
    })
    const postsQuery = createQuery<number[]>({
      name: 'isFetching.posts',
      queryKey: ['posts', 1],
      queryFn: () => sleep(10).then(() => [1, 2]),
    })
    const scope = fork({ values: [[$queryClient, queryClient]] })

    function Page() {
      useQuery(userQuery)
      useQuery(postsQuery)
      const all = useIsFetching()
      const users = useIsFetching({ queryKey: ['user'] })
      return (
        <span>
          <span data-testid="all">{all}</span>
          <span data-testid="users">{users}</span>
        </span>
      )
    }

    const r = renderWithScope(scope, <Page />)
    expect(r.getByTestId('all').textContent).toBe('2')
    expect(r.getByTestId('users').textContent).toBe('1')

    await act(async () => {
      await vi.advanceTimersByTimeAsync(11)
    })
    expect(r.getByTestId('all').textContent).toBe('0')
  })

  it('reacts to a $queryClient change in the scope', async () => {
    // Start with the default (idle) client → 0.
    const scope = fork({ values: [[$queryClient, queryClient]] })
    const r = renderWithScope(scope, <Indicator />)
    expect(r.getByTestId('count').textContent).toBe('0')

    // A second client with an in-flight fetch.
    const otherClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    })
    otherClient.mount()
    void otherClient
      .fetchQuery({
        queryKey: ['other', 'inflight'],
        queryFn: () => sleep(50).then(() => 'x'),
      })
      .catch(() => {})

    await act(async () => {
      await allSettled(setQueryClient, { scope, params: otherClient })
    })

    // The hook re-subscribed to otherClient's cache and reports its in-flight count.
    expect(r.getByTestId('count').textContent).toBe('1')

    // Let the fetch settle so nothing dangles into teardown.
    await act(async () => {
      await vi.advanceTimersByTimeAsync(51)
    })
    expect(r.getByTestId('count').textContent).toBe('0')
    otherClient.clear()
  })

  it('returns 0 when no QueryClient is set (SSR / no scope client)', () => {
    const scope = fork() // no $queryClient value
    const r = renderWithScope(scope, <Indicator />)
    expect(r.getByTestId('count').textContent).toBe('0')
  })
})
