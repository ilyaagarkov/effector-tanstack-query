import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { act, render } from '@testing-library/react'
import * as React from 'react'
import { Provider } from 'effector-react'
import { allSettled, createEvent, createStore, fork } from 'effector'
import { QueryClient } from '@tanstack/query-core'
import { queryKey, sleep } from './test-utils'
import { createQuery } from '../createQuery'
import { createMutation } from '../createMutation'
import { createInfiniteQuery } from '../createInfiniteQuery'
import { useInfiniteQuery, useMutation, useQuery } from '../react'
import type { Scope } from 'effector'

function renderWithScope(scope: Scope, ui: React.ReactElement) {
  return render(<Provider value={scope}>{ui}</Provider>)
}

describe('useQuery hook', () => {
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

  it('should auto-mount the query and resolve data', async () => {
    const key = queryKey()
    const scope = fork()
    const queryFn = vi.fn(() => sleep(10).then(() => 'hello'))

    const query = createQuery(queryClient, {
      name: 'autoMount',
      queryKey: key,
      queryFn,
    })

    function Page() {
      const { data, isPending } = useQuery(query)
      if (isPending) return <span>loading</span>
      return <span>{data}</span>
    }

    const rendered = renderWithScope(scope, <Page />)
    rendered.getByText('loading')

    await act(async () => {
      await vi.advanceTimersByTimeAsync(11)
    })

    rendered.getByText('hello')
    expect(queryFn).toHaveBeenCalledTimes(1)
  })

  it('should auto-unmount the query when component is unmounted', async () => {
    const key = queryKey()
    const scope = fork()
    let aborted = false

    const query = createQuery<string>(queryClient, {
      name: 'autoUnmount',
      queryKey: key,
      queryFn: ({ signal }) =>
        new Promise<string>((resolve) => {
          const timer = setTimeout(() => resolve('done'), 50)
          signal.addEventListener('abort', () => {
            clearTimeout(timer)
            aborted = true
          })
        }),
    })

    function Page() {
      useQuery(query)
      return <span>mounted</span>
    }

    const rendered = renderWithScope(scope, <Page />)
    await act(async () => {
      await vi.advanceTimersByTimeAsync(5)
    })

    rendered.unmount()
    await act(async () => {
      await vi.advanceTimersByTimeAsync(1)
    })

    expect(aborted).toBe(true)
  })

  it('should expose refresh callback that triggers a background refetch', async () => {
    const key = queryKey()
    let count = 0

    const query = createQuery(queryClient, {
      name: 'refreshable',
      queryKey: key,
      queryFn: () => sleep(5).then(() => ++count),
      staleTime: Infinity,
    })

    function Page() {
      const { data, refresh } = useQuery(query)
      return (
        <div>
          <span>count: {data ?? 0}</span>
          <button onClick={refresh}>refresh</button>
        </div>
      )
    }

    const rendered = render(<Page />)
    await act(async () => {
      await vi.advanceTimersByTimeAsync(6)
    })
    rendered.getByText('count: 1')

    await act(async () => {
      rendered.getByRole('button', { name: 'refresh' }).click()
      await vi.advanceTimersByTimeAsync(6)
    })
    rendered.getByText('count: 2')
  })

  it('should re-render when reactive query key store updates', async () => {
    const key = queryKey()
    const scope = fork()
    const setId = createEvent<number>()
    const $id = createStore(1).on(setId, (_, v) => v)

    const query = createQuery(queryClient, {
      name: 'reactiveKey',
      queryKey: [...key, $id],
      queryFn: ({ queryKey: qk }) =>
        sleep(5).then(() => `id-${qk[qk.length - 1]}`),
    })

    function Page() {
      const { data } = useQuery(query)
      return <span>{data ?? 'loading'}</span>
    }

    const rendered = renderWithScope(scope, <Page />)
    await act(async () => {
      await vi.advanceTimersByTimeAsync(6)
    })
    rendered.getByText('id-1')

    await act(async () => {
      await allSettled(setId, { scope, params: 2 })
      await vi.advanceTimersByTimeAsync(6)
    })
    rendered.getByText('id-2')
  })
})

describe('useMutation hook', () => {
  let queryClient: QueryClient

  beforeEach(() => {
    vi.useFakeTimers()
    queryClient = new QueryClient({
      defaultOptions: { mutations: { retry: false } },
    })
    queryClient.mount()
  })

  afterEach(() => {
    queryClient.clear()
    vi.useRealTimers()
  })

  it('should auto-start the mutation observer and update state on mutate', async () => {
    const scope = fork()

    const mutation = createMutation(queryClient, {
      name: 'addTodo',
      mutationFn: (text: string) => sleep(5).then(() => text.toUpperCase()),
    })

    function Page() {
      const { data, status, mutate } = useMutation(mutation)
      return (
        <div>
          <span>
            {status}: {data ?? 'none'}
          </span>
          <button onClick={() => mutate('todo')}>fire</button>
        </div>
      )
    }

    const rendered = renderWithScope(scope, <Page />)
    rendered.getByText('idle: none')

    await act(async () => {
      rendered.getByRole('button', { name: 'fire' }).click()
      await vi.advanceTimersByTimeAsync(6)
    })

    rendered.getByText('success: TODO')
  })

  it('should expose reset that returns mutation to idle state', async () => {
    const scope = fork()

    const mutation = createMutation(queryClient, {
      name: 'resetMutation',
      mutationFn: () => Promise.resolve('result'),
    })

    function Page() {
      const { status, data, mutate, reset } = useMutation(mutation)
      return (
        <div>
          <span>
            {status}: {data ?? 'none'}
          </span>
          <button onClick={() => mutate(undefined as never)}>fire</button>
          <button onClick={reset}>reset</button>
        </div>
      )
    }

    const rendered = renderWithScope(scope, <Page />)

    await act(async () => {
      rendered.getByRole('button', { name: 'fire' }).click()
      await vi.advanceTimersByTimeAsync(0)
    })
    rendered.getByText('success: result')

    await act(async () => {
      rendered.getByRole('button', { name: 'reset' }).click()
      await vi.advanceTimersByTimeAsync(0)
    })
    rendered.getByText('idle: none')
  })
})

describe('useInfiniteQuery hook', () => {
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

  it('should auto-mount and expose pages + fetchNextPage', async () => {
    const scope = fork()

    const query = createInfiniteQuery<number, Error, number>(queryClient, {
      name: 'paged',
      queryKey: ['items'],
      queryFn: ({ pageParam }: { pageParam: any }) =>
        sleep(5).then(() => pageParam),
      getNextPageParam: (lastPage: number) => lastPage + 1,
      initialPageParam: 0,
    })

    function Page() {
      const { data, fetchNextPage, isFetchingNextPage } = useInfiniteQuery(
        query,
      )
      return (
        <div>
          <span>pages: {data?.pages.join(',') ?? 'none'}</span>
          <button onClick={fetchNextPage} disabled={isFetchingNextPage}>
            more
          </button>
        </div>
      )
    }

    const rendered = renderWithScope(scope, <Page />)
    await act(async () => {
      await vi.advanceTimersByTimeAsync(6)
    })
    rendered.getByText('pages: 0')

    await act(async () => {
      rendered.getByRole('button', { name: 'more' }).click()
      await vi.advanceTimersByTimeAsync(6)
    })
    rendered.getByText('pages: 0,1')
  })

  it('should expose fetchPreviousPage and refresh', async () => {
    const scope = fork()
    let totalCalls = 0

    const query = createInfiniteQuery<number, Error, number>(queryClient, {
      name: 'bidirectional',
      queryKey: ['bi'],
      queryFn: ({ pageParam }: { pageParam: any }) => {
        totalCalls++
        return sleep(5).then(() => pageParam)
      },
      getNextPageParam: (lastPage: number) => lastPage + 1,
      getPreviousPageParam: (firstPage: number) => firstPage - 1,
      initialPageParam: 5,
    })

    function Page() {
      const { data, fetchPreviousPage, refresh } = useInfiniteQuery(query)
      return (
        <div>
          <span>pages: {data?.pages.join(',') ?? 'none'}</span>
          <button onClick={fetchPreviousPage}>prev</button>
          <button onClick={refresh}>refresh</button>
        </div>
      )
    }

    const rendered = renderWithScope(scope, <Page />)
    await act(async () => {
      await vi.advanceTimersByTimeAsync(6)
    })
    rendered.getByText('pages: 5')

    await act(async () => {
      rendered.getByRole('button', { name: 'prev' }).click()
      await vi.advanceTimersByTimeAsync(6)
    })
    rendered.getByText('pages: 4,5')

    const before = totalCalls
    await act(async () => {
      rendered.getByRole('button', { name: 'refresh' }).click()
      await vi.advanceTimersByTimeAsync(20)
    })
    expect(totalCalls).toBeGreaterThan(before)
  })
})
