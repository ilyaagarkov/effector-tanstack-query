import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { act, render } from '@testing-library/react'
import * as React from 'react'
import { Provider, useUnit } from 'effector-react'
import { allSettled, createEvent, createStore, fork } from 'effector'
import { QueryClient, keepPreviousData } from '@tanstack/query-core'
import { queryKey, sleep } from './test-utils'
import { createQuery } from '../createQuery'
import type { Scope } from 'effector'

function renderWithScope(scope: Scope, ui: React.ReactElement) {
  const result = render(<Provider value={scope}>{ui}</Provider>)
  return {
    ...result,
    rerender: (rerenderUi: React.ReactElement) =>
      result.rerender(<Provider value={scope}>{rerenderUi}</Provider>),
  }
}

interface QueryState<TData = unknown, TError = Error> {
  data: TData | undefined
  error: TError | null
  status: string
  isPending: boolean
  isFetching: boolean
  isSuccess: boolean
  isError: boolean
  fetchStatus: string
}

describe('createQuery (React integration)', () => {
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

  it('should return the correct states for a successful query', async () => {
    const key = queryKey()
    const states: Array<QueryState<string>> = []
    const scope = fork()

    const query = createQuery(queryClient, {
      queryKey: key,
      queryFn: async () => {
        await sleep(10)
        return 'test'
      },
    })

    function Page() {
      const state = useUnit({
        data: query.$data,
        error: query.$error,
        status: query.$status,
        isPending: query.$isPending,
        isFetching: query.$isFetching,
        isSuccess: query.$isSuccess,
        isError: query.$isError,
        fetchStatus: query.$fetchStatus,
      })

      states.push(state)

      if (state.isPending) {
        return <span>pending</span>
      }

      return <span>{state.data}</span>
    }

    renderWithScope(scope, <Page />)
    await allSettled(query.mounted, { scope })
    await vi.advanceTimersByTimeAsync(11)

    expect(states.length).toBeGreaterThanOrEqual(2)

    expect(states[0]).toMatchObject({
      data: undefined,
      error: null,
      status: 'pending',
      isPending: true,
      isFetching: false,
      isSuccess: false,
      isError: false,
      fetchStatus: 'idle',
    })

    const lastState = states[states.length - 1]!
    expect(lastState).toMatchObject({
      data: 'test',
      error: null,
      status: 'success',
      isPending: false,
      isFetching: false,
      isSuccess: true,
      isError: false,
      fetchStatus: 'idle',
    })
  })

  it('should return the correct states for an unsuccessful query', async () => {
    const key = queryKey()
    const states: Array<QueryState<string>> = []
    const error = new Error('fetch failed')
    const scope = fork()

    const query = createQuery(queryClient, {
      queryKey: key,
      queryFn: async () => {
        await sleep(10)
        throw error
      },
    })

    function Page() {
      const state = useUnit({
        data: query.$data,
        error: query.$error,
        status: query.$status,
        isPending: query.$isPending,
        isFetching: query.$isFetching,
        isSuccess: query.$isSuccess,
        isError: query.$isError,
        fetchStatus: query.$fetchStatus,
      })

      states.push(state)

      return <span>{state.status}</span>
    }

    renderWithScope(scope, <Page />)
    await allSettled(query.mounted, { scope })
    await vi.advanceTimersByTimeAsync(11)

    const lastState = states[states.length - 1]!
    expect(lastState).toMatchObject({
      data: undefined,
      error,
      status: 'error',
      isPending: false,
      isSuccess: false,
      isError: true,
      fetchStatus: 'idle',
    })
  })

  it('should not fetch when enabled is false', async () => {
    const key = queryKey()
    const queryFn = vi.fn().mockResolvedValue('data')
    const scope = fork()

    const query = createQuery(queryClient, {
      queryKey: key,
      queryFn,
      enabled: false,
    })

    function Page() {
      const state = useUnit({
        status: query.$status,
        fetchStatus: query.$fetchStatus,
      })
      return (
        <span>
          {state.status} {state.fetchStatus}
        </span>
      )
    }

    renderWithScope(scope, <Page />)
    await allSettled(query.mounted, { scope })
    await vi.advanceTimersByTimeAsync(20)

    expect(queryFn).not.toHaveBeenCalled()
  })

  it('should start fetching when Store<boolean> enabled changes to true', async () => {
    const key = queryKey()
    const setEnabled = createEvent<boolean>()
    const $enabled = createStore(false).on(setEnabled, (_, v) => v)
    const queryFn = vi
      .fn()
      .mockImplementation(() => sleep(10).then(() => 'data'))
    const scope = fork()

    const query = createQuery(queryClient, {
      queryKey: key,
      queryFn,
      enabled: $enabled,
    })

    function Page() {
      const { data, status } = useUnit({
        data: query.$data,
        status: query.$status,
      })
      return (
        <div>
          <span>
            {status}: {data ?? 'none'}
          </span>
        </div>
      )
    }

    const rendered = renderWithScope(scope, <Page />)
    await allSettled(query.mounted, { scope })
    await vi.advanceTimersByTimeAsync(20)
    expect(queryFn).not.toHaveBeenCalled()

    await act(async () => {
      await allSettled(setEnabled, { scope, params: true })
      await vi.advanceTimersByTimeAsync(11)
    })

    expect(queryFn).toHaveBeenCalledTimes(1)
    rendered.getByText('success: data')
  })

  it('should refetch when a Store inside queryKey changes', async () => {
    const key = queryKey()
    const setId = createEvent<number>()
    const $id = createStore(1).on(setId, (_, v) => v)
    const scope = fork()

    const query = createQuery(queryClient, {
      queryKey: [...key, $id],
      queryFn: ({ queryKey: qk }) =>
        sleep(10).then(() => `item-${qk[qk.length - 1]}`),
    })

    function Page() {
      const { data } = useUnit({ data: query.$data })
      return <span>{data ?? 'loading'}</span>
    }

    const rendered = renderWithScope(scope, <Page />)
    await allSettled(query.mounted, { scope })
    await vi.advanceTimersByTimeAsync(11)

    rendered.getByText('item-1')

    await act(async () => {
      await allSettled(setId, { scope, params: 2 })
      await vi.advanceTimersByTimeAsync(11)
    })

    rendered.getByText('item-2')
  })

  it('should deduplicate inflight requests for the same key', async () => {
    const key = queryKey()
    const queryFn = vi
      .fn()
      .mockImplementation(() => sleep(10).then(() => 'data'))
    const scope = fork()

    const q1 = createQuery(queryClient, { queryKey: key, queryFn })
    const q2 = createQuery(queryClient, { queryKey: key, queryFn })

    function Page() {
      const { data1, data2 } = useUnit({
        data1: q1.$data,
        data2: q2.$data,
      })
      return (
        <span>
          {data1 ?? 'none'}-{data2 ?? 'none'}
        </span>
      )
    }

    renderWithScope(scope, <Page />)
    await allSettled(q1.mounted, { scope })
    await allSettled(q2.mounted, { scope })
    await vi.advanceTimersByTimeAsync(11)

    expect(queryFn).toHaveBeenCalledTimes(1)
  })

  it('should trigger a background refetch on refresh', async () => {
    const key = queryKey()
    let count = 0

    const query = createQuery(queryClient, {
      queryKey: key,
      queryFn: () => sleep(10).then(() => ++count),
      staleTime: Infinity,
    })

    function Page() {
      const { data } = useUnit({ data: query.$data })
      return <span>{data ?? 'loading'}</span>
    }

    // Use global scope — refresh fires invalidateQueries which returns
    // a Promise that resolves only after the refetch completes.
    const rendered = render(<Page />)

    query.mounted()
    await act(async () => {
      await vi.advanceTimersByTimeAsync(11)
    })

    rendered.getByText('1')

    query.refresh()
    await act(async () => {
      await vi.advanceTimersByTimeAsync(11)
    })

    rendered.getByText('2')
  })

  it('should use cached data from a previous prefetch', async () => {
    const key = queryKey()
    const scope = fork()

    void queryClient.prefetchQuery({
      queryKey: key,
      queryFn: () => sleep(5).then(() => 'prefetched'),
    })
    await vi.advanceTimersByTimeAsync(6)

    const query = createQuery(queryClient, {
      queryKey: key,
      queryFn: () => sleep(10).then(() => 'fresh'),
    })

    function Page() {
      const { data, status } = useUnit({
        data: query.$data,
        status: query.$status,
      })
      return (
        <span>
          {status}: {data ?? 'none'}
        </span>
      )
    }

    const rendered = renderWithScope(scope, <Page />)
    await allSettled(query.mounted, { scope })

    // Should immediately have prefetched data after observer subscribes
    await act(async () => {
      await vi.advanceTimersByTimeAsync(0)
    })

    rendered.getByText('success: prefetched')
  })

  it('should track state transitions via re-renders', async () => {
    const key = queryKey()
    const statuses: Array<string> = []
    const scope = fork()

    const query = createQuery(queryClient, {
      queryKey: key,
      queryFn: () => sleep(10).then(() => 'result'),
    })

    function Page() {
      const { status } = useUnit({ status: query.$status })
      statuses.push(status)
      return <span>{status}</span>
    }

    renderWithScope(scope, <Page />)
    await allSettled(query.mounted, { scope })
    await vi.advanceTimersByTimeAsync(11)

    expect(statuses[0]).toBe('pending')
    expect(statuses[statuses.length - 1]).toBe('success')
  })

  it('should support initialData', async () => {
    const key = queryKey()
    const states: Array<QueryState<string>> = []
    const scope = fork()

    const query = createQuery(queryClient, {
      queryKey: key,
      queryFn: () => sleep(10).then(() => 'fetched'),
      initialData: 'initial',
    })

    function Page() {
      const state = useUnit({
        data: query.$data,
        error: query.$error,
        status: query.$status,
        isPending: query.$isPending,
        isFetching: query.$isFetching,
        isSuccess: query.$isSuccess,
        isError: query.$isError,
        fetchStatus: query.$fetchStatus,
      })
      states.push(state)
      return <span>{state.data}</span>
    }

    const rendered = renderWithScope(scope, <Page />)
    await allSettled(query.mounted, { scope })

    // After mount, should have initial data immediately with success status
    await vi.advanceTimersByTimeAsync(0)

    const stateAfterMount = states.find((s) => s.data === 'initial')
    expect(stateAfterMount).toBeDefined()
    expect(stateAfterMount).toMatchObject({
      data: 'initial',
      status: 'success',
      isSuccess: true,
    })

    // After fetch completes, should have fresh data
    await vi.advanceTimersByTimeAsync(11)
    const lastState = states[states.length - 1]!
    expect(lastState).toMatchObject({
      data: 'fetched',
      status: 'success',
    })
    rendered.getByText('fetched')
  })

  it('should support select to transform data', async () => {
    const key = queryKey()
    const scope = fork()

    const query = createQuery(queryClient, {
      queryKey: key,
      queryFn: () => sleep(10).then(() => ({ name: 'test', age: 25 })),
      select: (data) => data.name,
    })

    function Page() {
      const { data } = useUnit({ data: query.$data })
      return <span>{String(data ?? 'loading')}</span>
    }

    const rendered = renderWithScope(scope, <Page />)
    await allSettled(query.mounted, { scope })
    await vi.advanceTimersByTimeAsync(11)

    rendered.getByText('test')
  })

  it('should support staleTime and not refetch fresh data', async () => {
    const key = queryKey()
    const queryFn = vi
      .fn()
      .mockImplementation(() => sleep(5).then(() => 'fresh'))

    queryClient.setQueryData(key, 'cached')

    const query = createQuery<string>(queryClient, {
      queryKey: key,
      queryFn,
      staleTime: 60_000,
    })

    function Page() {
      const { data } = useUnit({ data: query.$data })
      return <span>{data ?? 'loading'}</span>
    }

    const scope = fork()
    const rendered = renderWithScope(scope, <Page />)
    await allSettled(query.mounted, { scope })
    await vi.advanceTimersByTimeAsync(10)

    rendered.getByText('cached')
    expect(queryFn).not.toHaveBeenCalled()
  })

  it('should support dependent queries via Store<boolean> enabled', async () => {
    const scope = fork()
    const key1 = queryKey()
    const key2 = queryKey()

    const query1 = createQuery(queryClient, {
      queryKey: key1,
      queryFn: () => sleep(10).then(() => 'first'),
    })

    // query2 is enabled only when query1 succeeds
    const query2 = createQuery(queryClient, {
      queryKey: key2,
      queryFn: () => sleep(10).then(() => 'second'),
      enabled: query1.$isSuccess,
    })

    function Page() {
      const { data1, data2 } = useUnit({
        data1: query1.$data,
        data2: query2.$data,
      })
      return (
        <div>
          <span>first: {data1 ?? 'loading'}</span>
          <span>second: {data2 ?? 'loading'}</span>
        </div>
      )
    }

    const rendered = renderWithScope(scope, <Page />)
    await allSettled(query1.mounted, { scope })
    await allSettled(query2.mounted, { scope })

    // Initially both are loading
    rendered.getByText('first: loading')
    rendered.getByText('second: loading')

    // After query1 completes, query2 should start fetching
    await act(async () => {
      await vi.advanceTimersByTimeAsync(11)
    })
    rendered.getByText('first: first')

    // After query2 completes
    await act(async () => {
      await vi.advanceTimersByTimeAsync(11)
    })
    rendered.getByText('second: second')
  })

  it('should support retry with retryDelay', async () => {
    const key = queryKey()
    let attempts = 0
    const scope = fork()

    const query = createQuery(queryClient, {
      queryKey: key,
      queryFn: async () => {
        attempts++
        if (attempts < 3) {
          throw new Error(`attempt ${attempts}`)
        }
        return 'success'
      },
      retry: 2,
      retryDelay: 10,
    })

    function Page() {
      const { data, status } = useUnit({
        data: query.$data,
        status: query.$status,
      })
      return (
        <div>
          <span>status: {status}</span>
          <span>data: {data ?? 'none'}</span>
        </div>
      )
    }

    const rendered = renderWithScope(scope, <Page />)
    await allSettled(query.mounted, { scope })

    // Wait for all retries (attempt 1 fails, wait 10ms, attempt 2 fails, wait 10ms, attempt 3 succeeds)
    await act(async () => {
      await vi.advanceTimersByTimeAsync(50)
    })

    rendered.getByText('status: success')
    rendered.getByText('data: success')
    expect(attempts).toBe(3)
  })

  it('should support a mixed queryKey of stores and plain values', async () => {
    const key = queryKey()
    const setSection = createEvent<string>()
    const $section = createStore('posts').on(setSection, (_, v) => v)
    const scope = fork()

    const query = createQuery(queryClient, {
      queryKey: [...key, 42, $section],
      queryFn: ({ queryKey: qk }) =>
        sleep(10).then(() => `${qk[qk.length - 2]}-${qk[qk.length - 1]}`),
    })

    function Page() {
      const { data } = useUnit({ data: query.$data })
      return <span>{data ?? 'loading'}</span>
    }

    const rendered = renderWithScope(scope, <Page />)
    await allSettled(query.mounted, { scope })
    await vi.advanceTimersByTimeAsync(11)

    rendered.getByText('42-posts')

    await act(async () => {
      await allSettled(setSection, { scope, params: 'comments' })
      await vi.advanceTimersByTimeAsync(11)
    })

    rendered.getByText('42-comments')
  })

  it('should stop re-fetching when Store<boolean> enabled changes to false', async () => {
    const key = queryKey()
    const setEnabled = createEvent<boolean>()
    const $enabled = createStore(true).on(setEnabled, (_, v) => v)
    const queryFn = vi
      .fn()
      .mockImplementation(() => sleep(10).then(() => 'data'))
    const scope = fork()

    const query = createQuery(queryClient, {
      queryKey: key,
      queryFn,
      enabled: $enabled,
      staleTime: 0,
    })

    function Page() {
      const { data } = useUnit({ data: query.$data })
      return <span>{data ?? 'loading'}</span>
    }

    renderWithScope(scope, <Page />)
    await allSettled(query.mounted, { scope })
    await vi.advanceTimersByTimeAsync(11)

    expect(queryFn).toHaveBeenCalledTimes(1)

    await allSettled(setEnabled, { scope, params: false })
    await queryClient.invalidateQueries({ queryKey: key })
    await vi.advanceTimersByTimeAsync(11)

    // Should not have refetched
    expect(queryFn).toHaveBeenCalledTimes(1)
  })

  it('should render data in component when using useUnit subscription', async () => {
    const key = queryKey()
    const scope = fork()

    const query = createQuery(queryClient, {
      queryKey: key,
      queryFn: () => sleep(10).then(() => 'hello world'),
    })

    function Page() {
      const { data, isPending } = useUnit({
        data: query.$data,
        isPending: query.$isPending,
      })

      if (isPending) return <span>loading...</span>
      return <span>{data}</span>
    }

    const rendered = renderWithScope(scope, <Page />)
    rendered.getByText('loading...')

    await allSettled(query.mounted, { scope })
    await act(async () => {
      await vi.advanceTimersByTimeAsync(11)
    })

    rendered.getByText('hello world')
  })

  it('should handle error recovery on refetch', async () => {
    const key = queryKey()
    let shouldFail = true

    const query = createQuery(queryClient, {
      queryKey: key,
      queryFn: async () => {
        await sleep(10)
        if (shouldFail) throw new Error('fail')
        return 'recovered'
      },
    })

    function Page() {
      const { data, error, status } = useUnit({
        data: query.$data,
        error: query.$error,
        status: query.$status,
      })
      return (
        <div>
          <span>status: {status}</span>
          <span>data: {data ?? 'none'}</span>
          <span>error: {error?.message ?? 'none'}</span>
        </div>
      )
    }

    // Use global scope for refresh test — refresh fires invalidateQueries
    // which returns a Promise that needs interleaving with timer advance
    const rendered = render(<Page />)

    query.mounted()
    await act(async () => {
      await vi.advanceTimersByTimeAsync(11)
    })

    rendered.getByText('status: error')
    rendered.getByText('error: fail')

    // Fix the error and refetch
    shouldFail = false
    query.refresh()
    await act(async () => {
      await vi.advanceTimersByTimeAsync(11)
    })

    rendered.getByText('status: success')
    rendered.getByText('data: recovered')
    rendered.getByText('error: none')
  })

  it('should handle multiple components subscribing to the same query', async () => {
    const key = queryKey()
    const scope = fork()

    const query = createQuery(queryClient, {
      queryKey: key,
      queryFn: () => sleep(10).then(() => 'shared data'),
    })

    function ComponentA() {
      const { data } = useUnit({ data: query.$data })
      return <span>A: {data ?? 'loading'}</span>
    }

    function ComponentB() {
      const { status } = useUnit({ status: query.$status })
      return <span>B: {status}</span>
    }

    function Page() {
      return (
        <div>
          <ComponentA />
          <ComponentB />
        </div>
      )
    }

    const rendered = renderWithScope(scope, <Page />)
    await allSettled(query.mounted, { scope })

    rendered.getByText('A: loading')
    rendered.getByText('B: pending')

    await act(async () => {
      await vi.advanceTimersByTimeAsync(11)
    })

    rendered.getByText('A: shared data')
    rendered.getByText('B: success')
  })

  it('should allow setting default data value via JS default', async () => {
    const key = queryKey()
    const scope = fork()

    const query = createQuery(queryClient, {
      queryKey: key,
      queryFn: () => sleep(10).then(() => 'test'),
    })

    function Page() {
      const { data: rawData } = useUnit({ data: query.$data })
      const data = rawData ?? 'default'
      return <span>{data}</span>
    }

    const rendered = renderWithScope(scope, <Page />)
    await allSettled(query.mounted, { scope })

    rendered.getByText('default')

    await act(async () => {
      await vi.advanceTimersByTimeAsync(11)
    })

    rendered.getByText('test')
  })

  it('should update component when query key store changes rapidly', async () => {
    const key = queryKey()
    const setId = createEvent<number>()
    const $id = createStore(1).on(setId, (_, v) => v)
    const scope = fork()

    const query = createQuery(queryClient, {
      queryKey: [...key, $id],
      queryFn: ({ queryKey: qk }) =>
        sleep(10).then(() => `data-${qk[qk.length - 1]}`),
    })

    function Page() {
      const { data } = useUnit({ data: query.$data })
      return <span>{data ?? 'loading'}</span>
    }

    const rendered = renderWithScope(scope, <Page />)
    await allSettled(query.mounted, { scope })
    await vi.advanceTimersByTimeAsync(11)
    rendered.getByText('data-1')

    // Rapidly change keys
    await act(async () => {
      await allSettled(setId, { scope, params: 2 })
      await allSettled(setId, { scope, params: 3 })
      await vi.advanceTimersByTimeAsync(11)
    })

    rendered.getByText('data-3')
  })

  it('should work with conditional rendering based on query state', async () => {
    const key = queryKey()
    const scope = fork()

    const query = createQuery(queryClient, {
      queryKey: key,
      queryFn: () => sleep(10).then(() => ['item1', 'item2', 'item3']),
    })

    function Page() {
      const { data, isPending, isError } = useUnit({
        data: query.$data,
        isPending: query.$isPending,
        isError: query.$isError,
      })

      if (isPending) return <div>Loading...</div>
      if (isError) return <div>Error!</div>

      return (
        <ul>
          {data!.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      )
    }

    const rendered = renderWithScope(scope, <Page />)
    await allSettled(query.mounted, { scope })

    rendered.getByText('Loading...')

    await act(async () => {
      await vi.advanceTimersByTimeAsync(11)
    })

    rendered.getByText('item1')
    rendered.getByText('item2')
    rendered.getByText('item3')
  })

  // ── initialData variants ─────────────────────────────────────────────

  it('should fetch even when initialData is set', async () => {
    const key = queryKey()
    const scope = fork()
    const states: Array<QueryState<string>> = []

    const query = createQuery(queryClient, {
      queryKey: key,
      queryFn: async () => {
        await sleep(10)
        return 'fetched'
      },
      initialData: 'initial',
    })

    function Page() {
      const state = useUnit({
        data: query.$data,
        error: query.$error,
        status: query.$status,
        isPending: query.$isPending,
        isFetching: query.$isFetching,
        isSuccess: query.$isSuccess,
        isError: query.$isError,
        fetchStatus: query.$fetchStatus,
      })
      states.push(state)
      return <span>{state.data}</span>
    }

    const rendered = renderWithScope(scope, <Page />)
    await allSettled(query.mounted, { scope })

    // Should immediately have initial data with success status
    const initialState = states.find((s) => s.data === 'initial')
    expect(initialState).toBeDefined()
    expect(initialState).toMatchObject({
      data: 'initial',
      status: 'success',
      isSuccess: true,
    })

    await vi.advanceTimersByTimeAsync(11)

    // Should update with fetched data
    rendered.getByText('fetched')
    const lastState = states[states.length - 1]!
    expect(lastState).toMatchObject({
      data: 'fetched',
      isFetching: false,
    })
  })

  it('should not fetch if initial data is set with a staleTime', async () => {
    const key = queryKey()
    const scope = fork()
    const queryFn = vi.fn().mockResolvedValue('fetched')

    const query = createQuery(queryClient, {
      queryKey: key,
      queryFn,
      staleTime: 50,
      initialData: 'initial',
    })

    function Page() {
      const { data } = useUnit({ data: query.$data })
      return <span>{data ?? 'loading'}</span>
    }

    const rendered = renderWithScope(scope, <Page />)
    await allSettled(query.mounted, { scope })
    await vi.advanceTimersByTimeAsync(10)

    rendered.getByText('initial')
    // Should NOT fetch because data is fresh within staleTime
    expect(queryFn).not.toHaveBeenCalled()
  })

  it('should fetch if initialDataUpdatedAt is older than staleTime', async () => {
    const key = queryKey()
    const scope = fork()

    const query = createQuery(queryClient, {
      queryKey: key,
      queryFn: async () => {
        await sleep(10)
        return 'fetched'
      },
      staleTime: 50,
      initialData: 'initial',
      initialDataUpdatedAt: Date.now() - 1000, // 1 second ago
    })

    function Page() {
      const { data, isFetching } = useUnit({
        data: query.$data,
        isFetching: query.$isFetching,
      })
      return (
        <span>
          {data}, fetching: {String(isFetching)}
        </span>
      )
    }

    const rendered = renderWithScope(scope, <Page />)
    await allSettled(query.mounted, { scope })

    // initialData shown but fetch triggered because updatedAt is old
    await vi.advanceTimersByTimeAsync(11)
    rendered.getByText('fetched, fetching: false')
  })

  it('should fetch if initialDataUpdatedAt is exactly 0', async () => {
    const key = queryKey()
    const scope = fork()

    const query = createQuery(queryClient, {
      queryKey: key,
      queryFn: async () => {
        await sleep(10)
        return 'fetched'
      },
      staleTime: 10_000,
      initialData: 'initial',
      initialDataUpdatedAt: 0,
    })

    function Page() {
      const { data } = useUnit({ data: query.$data })
      return <span>{data}</span>
    }

    const rendered = renderWithScope(scope, <Page />)
    await allSettled(query.mounted, { scope })
    await vi.advanceTimersByTimeAsync(11)

    // Should have fetched because updatedAt=0 is considered stale
    rendered.getByText('fetched')
  })

  it('should initialize state properly when initialData is falsy (0)', async () => {
    const key = queryKey()
    const scope = fork()
    const states: Array<{ data: number | undefined; isFetching: boolean }> = []

    const query = createQuery(queryClient, {
      queryKey: key,
      queryFn: async () => {
        await sleep(10)
        return 1
      },
      initialData: 0,
    })

    function Page() {
      const state = useUnit({
        data: query.$data,
        isFetching: query.$isFetching,
      })
      states.push(state)
      return <span>data: {state.data}</span>
    }

    const rendered = renderWithScope(scope, <Page />)
    await allSettled(query.mounted, { scope })

    // 0 is falsy but should be treated as valid initial data
    const initialState = states.find((s) => s.data === 0)
    expect(initialState).toBeDefined()

    await vi.advanceTimersByTimeAsync(11)
    rendered.getByText('data: 1')
  })

  it('should not override initial data in independent queries', async () => {
    const key1 = queryKey()
    const key2 = queryKey()
    const scope = fork()

    const query1 = createQuery(queryClient, {
      queryKey: key1,
      queryFn: () => 'data1',
      enabled: false,
      initialData: 'init1',
    })

    const query2 = createQuery(queryClient, {
      queryKey: key2,
      queryFn: () => 'data2',
      enabled: false,
      initialData: 'init2',
    })

    function Page() {
      const { data1, data2 } = useUnit({
        data1: query1.$data,
        data2: query2.$data,
      })
      return (
        <div>
          <span>first: {data1}</span>
          <span>second: {data2}</span>
        </div>
      )
    }

    const rendered = renderWithScope(scope, <Page />)
    await allSettled(query1.mounted, { scope })
    await allSettled(query2.mounted, { scope })

    rendered.getByText('first: init1')
    rendered.getByText('second: init2')
  })

  it('should mark query as fetching when using initialData', async () => {
    const key = queryKey()
    const scope = fork()

    const query = createQuery(queryClient, {
      queryKey: key,
      queryFn: async () => {
        await sleep(10)
        return 'serverData'
      },
      initialData: 'initialData',
    })

    function Page() {
      const { data, isFetching } = useUnit({
        data: query.$data,
        isFetching: query.$isFetching,
      })
      return (
        <span>
          {data}, fetching: {String(isFetching)}
        </span>
      )
    }

    const rendered = renderWithScope(scope, <Page />)
    await allSettled(query.mounted, { scope })

    // Initially shows initialData and is fetching
    await vi.advanceTimersByTimeAsync(1)
    expect(scope.getState(query.$data)).toBe('initialData')
    expect(scope.getState(query.$isFetching)).toBe(true)

    await vi.advanceTimersByTimeAsync(11)
    rendered.getByText('serverData, fetching: false')
  })

  it('should use cached data over initialData', async () => {
    const key = queryKey()
    const scope = fork()

    // Pre-populate cache
    queryClient.setQueryData(key, 'cached')

    const query = createQuery(queryClient, {
      queryKey: key,
      queryFn: async () => {
        await sleep(10)
        return 'fetched'
      },
      initialData: 'initial',
      staleTime: Infinity,
    })

    function Page() {
      const { data } = useUnit({ data: query.$data })
      return <span>{data ?? 'loading'}</span>
    }

    const rendered = renderWithScope(scope, <Page />)
    await allSettled(query.mounted, { scope })
    await vi.advanceTimersByTimeAsync(1)

    // Cached data takes precedence over initialData
    rendered.getByText('cached')
  })

  // ── Error handling & retry ───────────────────────────────────────────

  it('should retry specified number of times', async () => {
    const key = queryKey()
    const scope = fork()
    let attempts = 0

    const query = createQuery(queryClient, {
      queryKey: key,
      queryFn: async () => {
        attempts++
        throw new Error(`attempt ${attempts}`)
      },
      retry: 2,
      retryDelay: 1,
    })

    function Page() {
      const { status, error } = useUnit({
        status: query.$status,
        error: query.$error,
      })
      return (
        <div>
          <span>status: {status}</span>
          <span>error: {error?.message ?? 'none'}</span>
        </div>
      )
    }

    const rendered = renderWithScope(scope, <Page />)
    await allSettled(query.mounted, { scope })
    await act(async () => {
      await vi.advanceTimersByTimeAsync(50)
    })

    rendered.getByText('status: error')
    rendered.getByText('error: attempt 3')
    expect(attempts).toBe(3) // 1 initial + 2 retries
  })

  it('should not retry if retry function returns false', async () => {
    const key = queryKey()
    const scope = fork()
    let attempts = 0

    const query = createQuery(queryClient, {
      queryKey: key,
      queryFn: async () => {
        attempts++
        throw new Error('fail')
      },
      retry: (_count, error) => {
        // Only retry specific errors
        return error.message !== 'fail'
      },
    })

    function Page() {
      const { status } = useUnit({ status: query.$status })
      return <span>{status}</span>
    }

    const rendered = renderWithScope(scope, <Page />)
    await allSettled(query.mounted, { scope })
    await act(async () => {
      await vi.advanceTimersByTimeAsync(50)
    })

    rendered.getByText('error')
    expect(attempts).toBe(1) // No retry
  })

  it('should reset failureCount on successful fetch', async () => {
    const key = queryKey()
    let shouldFail = true

    const query = createQuery(queryClient, {
      queryKey: key,
      queryFn: async () => {
        await sleep(5)
        if (shouldFail) throw new Error('fail')
        return 'success'
      },
      retry: 1,
      retryDelay: 1,
    })

    function Page() {
      const { status, data } = useUnit({
        status: query.$status,
        data: query.$data,
      })
      return (
        <span>
          {status}: {data ?? 'none'}
        </span>
      )
    }

    const rendered = render(<Page />)

    query.mounted()
    await act(async () => {
      await vi.advanceTimersByTimeAsync(50)
    })
    rendered.getByText('error: none')

    // Fix and refetch
    shouldFail = false
    query.refresh()
    await act(async () => {
      await vi.advanceTimersByTimeAsync(50)
    })
    rendered.getByText('success: success')
  })

  // ── Refetch behavior ────────────────────────────────────────────────

  it('should fetch when refetchOnMount is false and nothing has been fetched yet', async () => {
    const key = queryKey()
    const scope = fork()

    const query = createQuery(queryClient, {
      queryKey: key,
      queryFn: () => sleep(5).then(() => 'test'),
      refetchOnMount: false,
    })

    function Page() {
      const { data } = useUnit({ data: query.$data })
      return <span>{data ?? 'loading'}</span>
    }

    const rendered = renderWithScope(scope, <Page />)
    await allSettled(query.mounted, { scope })
    await vi.advanceTimersByTimeAsync(6)

    // Should still fetch because nothing is cached yet
    rendered.getByText('test')
  })

  it('should not refetch when refetchOnMount is false and data has been fetched', async () => {
    const key = queryKey()
    const scope = fork()
    const queryFn = vi.fn().mockResolvedValue('test')

    // Pre-populate cache
    queryClient.setQueryData(key, 'prefetched')

    const query = createQuery(queryClient, {
      queryKey: key,
      queryFn,
      refetchOnMount: false,
    })

    function Page() {
      const { data } = useUnit({ data: query.$data })
      return <span>{data ?? 'loading'}</span>
    }

    const rendered = renderWithScope(scope, <Page />)
    await allSettled(query.mounted, { scope })
    await vi.advanceTimersByTimeAsync(10)

    rendered.getByText('prefetched')
    expect(queryFn).not.toHaveBeenCalled()
  })

  // ── Query lifecycle ─────────────────────────────────────────────────

  it('should not refetch disabled query when invalidated', async () => {
    const key = queryKey()
    const scope = fork()
    const queryFn = vi.fn().mockResolvedValue('data')

    const query = createQuery(queryClient, {
      queryKey: key,
      queryFn,
      enabled: false,
      initialData: 'initial',
    })

    function Page() {
      const { data } = useUnit({ data: query.$data })
      return <span>{data}</span>
    }

    const rendered = renderWithScope(scope, <Page />)
    await allSettled(query.mounted, { scope })

    await queryClient.invalidateQueries({ queryKey: key })
    await vi.advanceTimersByTimeAsync(20)

    rendered.getByText('initial')
    expect(queryFn).not.toHaveBeenCalled()
  })

  // ── Enabled state edge cases ────────────────────────────────────────

  it('should start with status pending and fetchStatus idle if enabled is false', async () => {
    const key = queryKey()
    const scope = fork()

    const query = createQuery(queryClient, {
      queryKey: key,
      queryFn: () => 'data',
      enabled: false,
    })

    function Page() {
      const { status, fetchStatus } = useUnit({
        status: query.$status,
        fetchStatus: query.$fetchStatus,
      })
      return (
        <span>
          {status}, {fetchStatus}
        </span>
      )
    }

    const rendered = renderWithScope(scope, <Page />)
    await allSettled(query.mounted, { scope })
    await vi.advanceTimersByTimeAsync(10)

    rendered.getByText('pending, idle')
  })

  it('should persist data when enabled changes to false', async () => {
    const key = queryKey()
    const scope = fork()
    const setEnabled = createEvent<boolean>()
    const $enabled = createStore(true).on(setEnabled, (_, v) => v)

    const query = createQuery(queryClient, {
      queryKey: key,
      queryFn: () => sleep(5).then(() => 'fetched'),
      enabled: $enabled,
    })

    function Page() {
      const { data, status } = useUnit({
        data: query.$data,
        status: query.$status,
      })
      return (
        <span>
          {data ?? 'none'}, {status}
        </span>
      )
    }

    const rendered = renderWithScope(scope, <Page />)
    await allSettled(query.mounted, { scope })
    await vi.advanceTimersByTimeAsync(6)

    rendered.getByText('fetched, success')

    // Disable — data should persist
    await act(async () => {
      await allSettled(setEnabled, { scope, params: false })
      await vi.advanceTimersByTimeAsync(1)
    })

    rendered.getByText('fetched, success')
  })

  // ── Select edge cases ───────────────────────────────────────────────

  it('should set error status when select throws', async () => {
    const key = queryKey()
    const scope = fork()
    const selectError = new Error('Select Error')

    const query = createQuery(queryClient, {
      queryKey: key,
      queryFn: () => sleep(5).then(() => ({ name: 'test' })),
      select: () => {
        throw selectError
      },
    })

    function Page() {
      const { status, error } = useUnit({
        status: query.$status,
        error: query.$error,
      })
      return (
        <div>
          <span>status: {status}</span>
          <span>error: {error?.message ?? 'none'}</span>
        </div>
      )
    }

    const rendered = renderWithScope(scope, <Page />)
    await allSettled(query.mounted, { scope })
    await vi.advanceTimersByTimeAsync(6)

    rendered.getByText('status: error')
    rendered.getByText('error: Select Error')
  })

  // ── Error state transitions ─────────────────────────────────────────

  it('should refetch when enabled changes to true from error state', async () => {
    const key = queryKey()
    const scope = fork()
    const setEnabled = createEvent<boolean>()
    const $enabled = createStore(true).on(setEnabled, (_, v) => v)
    let shouldFail = true

    const query = createQuery(queryClient, {
      queryKey: key,
      queryFn: async () => {
        await sleep(5)
        if (shouldFail) throw new Error('fail')
        return 'recovered'
      },
      enabled: $enabled,
    })

    function Page() {
      const { data, status } = useUnit({
        data: query.$data,
        status: query.$status,
      })
      return (
        <span>
          {status}: {data ?? 'none'}
        </span>
      )
    }

    const rendered = renderWithScope(scope, <Page />)
    await allSettled(query.mounted, { scope })
    await vi.advanceTimersByTimeAsync(6)
    rendered.getByText('error: none')

    // Disable, fix, then re-enable
    await allSettled(setEnabled, { scope, params: false })
    shouldFail = false
    await act(async () => {
      await allSettled(setEnabled, { scope, params: true })
      await vi.advanceTimersByTimeAsync(6)
    })

    rendered.getByText('success: recovered')
  })

  it('should refetch when queryKey changes from error state', async () => {
    const key = queryKey()
    const scope = fork()
    const setId = createEvent<number>()
    const $id = createStore(1).on(setId, (_, v) => v)

    const query = createQuery(queryClient, {
      queryKey: [...key, $id],
      queryFn: async ({ queryKey: qk }) => {
        await sleep(5)
        const id = qk[qk.length - 1] as number
        if (id === 1) throw new Error('fail for 1')
        return `data-${id}`
      },
    })

    function Page() {
      const { data, status, error } = useUnit({
        data: query.$data,
        status: query.$status,
        error: query.$error,
      })
      return (
        <span>
          {status}: {data ?? error?.message ?? 'none'}
        </span>
      )
    }

    const rendered = renderWithScope(scope, <Page />)
    await allSettled(query.mounted, { scope })
    await vi.advanceTimersByTimeAsync(6)
    rendered.getByText('error: fail for 1')

    // Switch to a working key
    await act(async () => {
      await allSettled(setId, { scope, params: 2 })
      await vi.advanceTimersByTimeAsync(6)
    })

    rendered.getByText('success: data-2')
  })

  // ── Query key edge cases ────────────────────────────────────────────

  it('should accept an empty string as query key', async () => {
    const scope = fork()

    const query = createQuery(queryClient, {
      queryKey: [''],
      queryFn: () => sleep(5).then(() => 'empty key data'),
    })

    function Page() {
      const { data } = useUnit({ data: query.$data })
      return <span>{data ?? 'loading'}</span>
    }

    const rendered = renderWithScope(scope, <Page />)
    await allSettled(query.mounted, { scope })
    await vi.advanceTimersByTimeAsync(6)

    rendered.getByText('empty key data')
  })

  it('should accept an object as part of query key', async () => {
    const scope = fork()

    const query = createQuery(queryClient, {
      queryKey: [{ page: 1, filter: 'active' }],
      queryFn: () => sleep(5).then(() => 'object key data'),
    })

    function Page() {
      const { data } = useUnit({ data: query.$data })
      return <span>{data ?? 'loading'}</span>
    }

    const rendered = renderWithScope(scope, <Page />)
    await allSettled(query.mounted, { scope })
    await vi.advanceTimersByTimeAsync(6)

    rendered.getByText('object key data')
  })

  it('should refetch when quickly switching to a failed query', async () => {
    const key = queryKey()
    const scope = fork()
    const setId = createEvent<number>()
    const $id = createStore(1).on(setId, (_, v) => v)
    let count = 0

    const query = createQuery(queryClient, {
      queryKey: [...key, $id],
      queryFn: async ({ queryKey: qk }) => {
        const id = qk[qk.length - 1] as number
        count++
        await sleep(5)
        if (id === 2) throw new Error(`fail-${count}`)
        return `data-${id}-${count}`
      },
    })

    function Page() {
      const { data, status } = useUnit({
        data: query.$data,
        status: query.$status,
      })
      return (
        <span>
          {status}: {data ?? 'none'}
        </span>
      )
    }

    const rendered = renderWithScope(scope, <Page />)
    await allSettled(query.mounted, { scope })
    await vi.advanceTimersByTimeAsync(6)
    rendered.getByText('success: data-1-1')

    // Switch to failing key
    await act(async () => {
      await allSettled(setId, { scope, params: 2 })
      await vi.advanceTimersByTimeAsync(6)
    })
    expect(scope.getState(query.$status)).toBe('error')

    // Switch back to working key — should refetch
    await act(async () => {
      await allSettled(setId, { scope, params: 1 })
      await vi.advanceTimersByTimeAsync(6)
    })
    rendered.getByText('success: data-1-3')
  })

  // ── placeholderData ─────────────────────────────────────────────────

  it('should keep previous data when placeholderData is keepPreviousData', async () => {
    const key = queryKey()
    const scope = fork()
    const setCount = createEvent<number>()
    const $count = createStore(0).on(setCount, (_, v) => v)

    const query = createQuery(queryClient, {
      queryKey: [...key, $count],
      queryFn: async ({ queryKey: qk }) => {
        await sleep(10)
        return qk[qk.length - 1] as number
      },
      placeholderData: keepPreviousData,
    })

    function Page() {
      const { data, isFetching, isSuccess, isPlaceholderData } = useUnit({
        data: query.$data,
        isFetching: query.$isFetching,
        isSuccess: query.$isSuccess,
        isPlaceholderData: query.$isPlaceholderData,
      })
      return (
        <div>
          <span>data: {data ?? 'none'}</span>
          <span>placeholder: {String(isPlaceholderData)}</span>
          <span>fetching: {String(isFetching)}</span>
          <span>success: {String(isSuccess)}</span>
        </div>
      )
    }

    const rendered = renderWithScope(scope, <Page />)
    await allSettled(query.mounted, { scope })

    // Initially no data, fetching
    rendered.getByText('data: none')

    await vi.advanceTimersByTimeAsync(11)

    // First fetch complete
    rendered.getByText('data: 0')
    rendered.getByText('placeholder: false')

    // Change key — previous data should be shown as placeholder
    await act(async () => {
      await allSettled(setCount, { scope, params: 1 })
    })

    // During fetch, previous data is shown as placeholder
    rendered.getByText('data: 0')
    rendered.getByText('placeholder: true')
    rendered.getByText('fetching: true')
    rendered.getByText('success: true')

    await act(async () => {
      await vi.advanceTimersByTimeAsync(11)
    })

    // New data arrived
    rendered.getByText('data: 1')
    rendered.getByText('placeholder: false')
  })

  it('should keep previous data with placeholderData and select transform', async () => {
    const key = queryKey()
    const scope = fork()
    const setCount = createEvent<number>()
    const $count = createStore(0).on(setCount, (_, v) => v)

    const query = createQuery(queryClient, {
      queryKey: [...key, $count],
      queryFn: async ({ queryKey: qk }) => {
        await sleep(10)
        return { count: qk[qk.length - 1] as number }
      },
      select: (data) => data.count,
      placeholderData: keepPreviousData,
    })

    function Page() {
      const { data, isPlaceholderData } = useUnit({
        data: query.$data,
        isPlaceholderData: query.$isPlaceholderData,
      })
      return (
        <span>
          data: {String(data ?? 'none')}, placeholder:{' '}
          {String(isPlaceholderData)}
        </span>
      )
    }

    const rendered = renderWithScope(scope, <Page />)
    await allSettled(query.mounted, { scope })
    await vi.advanceTimersByTimeAsync(11)

    rendered.getByText('data: 0, placeholder: false')

    await act(async () => {
      await allSettled(setCount, { scope, params: 1 })
    })

    // Previous selected data shown as placeholder
    rendered.getByText('data: 0, placeholder: true')

    await act(async () => {
      await vi.advanceTimersByTimeAsync(11)
    })

    rendered.getByText('data: 1, placeholder: false')
  })

  it('should transition to error state when placeholderData is set', async () => {
    const key = queryKey()
    const scope = fork()
    const setCount = createEvent<number>()
    const $count = createStore(0).on(setCount, (_, v) => v)

    const query = createQuery<number, Error>(queryClient, {
      queryKey: [...key, $count],
      queryFn: async ({ queryKey: qk }) => {
        await sleep(10)
        const count = qk[qk.length - 1] as number
        if (count === 2) throw new Error('Error test')
        return count
      },
      placeholderData: keepPreviousData,
    })

    function Page() {
      const { data, status, error, isPlaceholderData } = useUnit({
        data: query.$data,
        status: query.$status,
        error: query.$error,
        isPlaceholderData: query.$isPlaceholderData,
      })
      return (
        <div>
          <span>status: {status}</span>
          <span>data: {data ?? 'none'}</span>
          <span>error: {error?.message ?? 'none'}</span>
          <span>placeholder: {String(isPlaceholderData)}</span>
        </div>
      )
    }

    const rendered = renderWithScope(scope, <Page />)
    await allSettled(query.mounted, { scope })
    await vi.advanceTimersByTimeAsync(11)

    rendered.getByText('data: 0')
    rendered.getByText('status: success')

    // Switch to count=1 (success)
    await act(async () => {
      await allSettled(setCount, { scope, params: 1 })
      await vi.advanceTimersByTimeAsync(11)
    })

    rendered.getByText('data: 1')

    // Switch to count=2 (error) — placeholder shown during fetch
    await act(async () => {
      await allSettled(setCount, { scope, params: 2 })
    })

    rendered.getByText('placeholder: true')
    rendered.getByText('data: 1')

    await act(async () => {
      await vi.advanceTimersByTimeAsync(11)
    })

    // Error replaces placeholder
    rendered.getByText('status: error')
    rendered.getByText('error: Error test')
    rendered.getByText('placeholder: false')
  })

  it('should show placeholderData between multiple key changes', async () => {
    const key = queryKey()
    const scope = fork()
    const setCount = createEvent<number>()
    const $count = createStore(0).on(setCount, (_, v) => v)

    const query = createQuery(queryClient, {
      queryKey: [...key, $count],
      queryFn: async ({ queryKey: qk }) => {
        await sleep(10)
        return qk[qk.length - 1] as number
      },
      placeholderData: keepPreviousData,
    })

    function Page() {
      const { data, isPlaceholderData } = useUnit({
        data: query.$data,
        isPlaceholderData: query.$isPlaceholderData,
      })
      return (
        <span>
          data: {data ?? 'none'}, placeholder: {String(isPlaceholderData)}
        </span>
      )
    }

    const rendered = renderWithScope(scope, <Page />)
    await allSettled(query.mounted, { scope })
    await vi.advanceTimersByTimeAsync(11)

    rendered.getByText('data: 0, placeholder: false')

    // Rapidly switch keys — placeholder should always show previous data
    await act(async () => {
      await allSettled(setCount, { scope, params: 1 })
      await allSettled(setCount, { scope, params: 2 })
      await allSettled(setCount, { scope, params: 3 })
    })

    // Should show original data as placeholder during all rapid changes
    rendered.getByText('data: 0, placeholder: true')

    await act(async () => {
      await vi.advanceTimersByTimeAsync(11)
    })

    // Final data should be for count=3
    rendered.getByText('data: 3, placeholder: false')
  })

  it('should use static placeholderData value', async () => {
    const key = queryKey()
    const scope = fork()

    const query = createQuery(queryClient, {
      queryKey: key,
      queryFn: async () => {
        await sleep(10)
        return 'fetched'
      },
      placeholderData: 'placeholder',
    })

    function Page() {
      const { data, isPlaceholderData } = useUnit({
        data: query.$data,
        isPlaceholderData: query.$isPlaceholderData,
      })
      return (
        <span>
          {data ?? 'none'}, placeholder: {String(isPlaceholderData)}
        </span>
      )
    }

    const rendered = renderWithScope(scope, <Page />)
    await allSettled(query.mounted, { scope })
    await vi.advanceTimersByTimeAsync(1)

    // Static placeholder shown while fetching
    rendered.getByText('placeholder, placeholder: true')

    await vi.advanceTimersByTimeAsync(11)

    rendered.getByText('fetched, placeholder: false')
  })

  it('should run placeholderData through select', async () => {
    const key = queryKey()
    const scope = fork()

    const query = createQuery(queryClient, {
      queryKey: key,
      queryFn: async () => {
        await sleep(10)
        return { name: 'fetched' }
      },
      placeholderData: { name: 'placeholder' },
      select: (data) => data.name,
    })

    function Page() {
      const { data, isPlaceholderData } = useUnit({
        data: query.$data,
        isPlaceholderData: query.$isPlaceholderData,
      })
      return (
        <span>
          {String(data ?? 'none')}, placeholder: {String(isPlaceholderData)}
        </span>
      )
    }

    const rendered = renderWithScope(scope, <Page />)
    await allSettled(query.mounted, { scope })
    await vi.advanceTimersByTimeAsync(1)

    // Placeholder went through select
    rendered.getByText('placeholder, placeholder: true')

    await vi.advanceTimersByTimeAsync(11)

    rendered.getByText('fetched, placeholder: false')
  })

  it('should keep previous data when placeholderData is set and cache is reused', async () => {
    const key = queryKey()
    const scope = fork()
    const setStep = createEvent<number>()
    const $step = createStore(0).on(setStep, (_, v) => v)

    const steps = [0, 1, 0, 2]

    const query = createQuery(queryClient, {
      queryKey: [...key, $step.map((s) => steps[s])],
      queryFn: async ({ queryKey: qk }) => {
        await sleep(10)
        return qk[qk.length - 1] as number
      },
      placeholderData: keepPreviousData,
      staleTime: Infinity,
    })

    function Page() {
      const { data } = useUnit({ data: query.$data })
      return <span>data: {data ?? 'none'}</span>
    }

    const rendered = renderWithScope(scope, <Page />)
    await allSettled(query.mounted, { scope })
    await vi.advanceTimersByTimeAsync(11)

    rendered.getByText('data: 0')

    // step=1 → key=1 (new, fetches)
    await act(async () => {
      await allSettled(setStep, { scope, params: 1 })
      await vi.advanceTimersByTimeAsync(11)
    })
    rendered.getByText('data: 1')

    // step=2 → key=0 (cached, staleTime=Infinity, no fetch)
    await act(async () => {
      await allSettled(setStep, { scope, params: 2 })
      await vi.advanceTimersByTimeAsync(1)
    })
    rendered.getByText('data: 0')

    // step=3 → key=2 (new, fetches)
    await act(async () => {
      await allSettled(setStep, { scope, params: 3 })
      await vi.advanceTimersByTimeAsync(11)
    })
    rendered.getByText('data: 2')
  })

  // ── refetchInterval ─────────────────────────────────────────────────

  it('should refetch at a given interval', async () => {
    const key = queryKey()
    let count = 0

    const query = createQuery(queryClient, {
      queryKey: key,
      queryFn: () => ++count,
      refetchInterval: 20,
    })

    function Page() {
      const { data } = useUnit({ data: query.$data })
      return <span>count: {data ?? 0}</span>
    }

    const rendered = render(<Page />)

    query.mounted()
    await act(async () => {
      await vi.advanceTimersByTimeAsync(1)
    })
    rendered.getByText('count: 1')

    // Wait for interval refetch
    await act(async () => {
      await vi.advanceTimersByTimeAsync(21)
    })
    rendered.getByText('count: 2')

    // Another interval
    await act(async () => {
      await vi.advanceTimersByTimeAsync(21)
    })
    rendered.getByText('count: 3')
  })

  it('should not interval fetch with a refetchInterval of 0', async () => {
    const key = queryKey()
    const queryFn = vi.fn().mockResolvedValue('data')

    const query = createQuery(queryClient, {
      queryKey: key,
      queryFn,
      refetchInterval: 0,
    })

    function Page() {
      const { data } = useUnit({ data: query.$data })
      return <span>{data ?? 'loading'}</span>
    }

    const rendered = render(<Page />)

    query.mounted()
    await act(async () => {
      await vi.advanceTimersByTimeAsync(1)
    })
    rendered.getByText('data')

    const callCount = queryFn.mock.calls.length

    // Wait a while — should not refetch
    await act(async () => {
      await vi.advanceTimersByTimeAsync(100)
    })

    expect(queryFn.mock.calls.length).toBe(callCount)
  })

  it('should support dynamic refetchInterval based on data', async () => {
    const key = queryKey()
    let count = 0

    const query = createQuery(queryClient, {
      queryKey: key,
      queryFn: () => ++count,
      refetchInterval: (query) => {
        const data = query.state.data
        // Stop polling when count reaches 3
        if (data !== undefined && data >= 3) return false
        return 10
      },
    })

    function Page() {
      const { data } = useUnit({ data: query.$data })
      return <span>count: {data ?? 0}</span>
    }

    const rendered = render(<Page />)

    query.mounted()
    await act(async () => {
      await vi.advanceTimersByTimeAsync(1)
    })
    rendered.getByText('count: 1')

    await act(async () => {
      await vi.advanceTimersByTimeAsync(11)
    })
    rendered.getByText('count: 2')

    await act(async () => {
      await vi.advanceTimersByTimeAsync(11)
    })
    rendered.getByText('count: 3')

    // Should stop polling since count >= 3
    await act(async () => {
      await vi.advanceTimersByTimeAsync(50)
    })
    rendered.getByText('count: 3')
  })

  // ── Query cancellation & unmount ────────────────────────────────────

  it('should cancel the query when unmounted is called', async () => {
    const key = queryKey()
    const scope = fork()
    let aborted = false

    const query = createQuery<string>(queryClient, {
      queryKey: key,
      queryFn: ({ signal }) => {
        return new Promise<string>((resolve) => {
          const timer = setTimeout(() => resolve('data'), 50)
          signal.addEventListener('abort', () => {
            clearTimeout(timer)
            aborted = true
          })
        })
      },
    })

    function Page() {
      const { data, status } = useUnit({
        data: query.$data,
        status: query.$status,
      })
      return (
        <span>
          {status}: {data ?? 'none'}
        </span>
      )
    }

    renderWithScope(scope, <Page />)
    await allSettled(query.mounted, { scope })
    await vi.advanceTimersByTimeAsync(5)

    // Still fetching
    expect(scope.getState(query.$status)).toBe('pending')

    // Unmount — should cancel
    await allSettled(query.unmounted, { scope })

    expect(aborted).toBe(true)
  })

  it('should stop refetchInterval when unmounted is called', async () => {
    const key = queryKey()
    let count = 0

    const query = createQuery(queryClient, {
      queryKey: key,
      queryFn: () => ++count,
      refetchInterval: 10,
    })

    function Page() {
      const { data } = useUnit({ data: query.$data })
      return <span>count: {data ?? 0}</span>
    }

    const rendered = render(<Page />)

    query.mounted()
    await act(async () => {
      await vi.advanceTimersByTimeAsync(1)
    })
    rendered.getByText('count: 1')

    // Unmount — should stop interval
    query.unmounted()

    const countAfterUnmount = count

    await act(async () => {
      await vi.advanceTimersByTimeAsync(100)
    })

    // No more fetches after unmount
    expect(count).toBe(countAfterUnmount)
  })

  it('should be able to remount after unmount', async () => {
    const key = queryKey()
    let count = 0

    const query = createQuery(queryClient, {
      queryKey: key,
      queryFn: () => sleep(5).then(() => ++count),
    })

    function Page() {
      const { data } = useUnit({ data: query.$data })
      return <span>count: {data ?? 0}</span>
    }

    const rendered = render(<Page />)

    query.mounted()
    await act(async () => {
      await vi.advanceTimersByTimeAsync(6)
    })
    rendered.getByText('count: 1')

    query.unmounted()

    // Remount — should create a new observer subscription and refetch
    query.mounted()
    await act(async () => {
      await vi.advanceTimersByTimeAsync(6)
    })
    rendered.getByText('count: 2')
  })

  // ── gcTime / cache eviction ─────────────────────────────────────────

  it('should garbage-collect cached data after gcTime when no observers remain', async () => {
    const key = queryKey()
    const queryFn = vi.fn().mockImplementation(() => sleep(5).then(() => 'fresh'))

    const query = createQuery(queryClient, {
      queryKey: key,
      queryFn,
      gcTime: 100,
      staleTime: Infinity,
    })

    query.mounted()
    await vi.advanceTimersByTimeAsync(6)
    expect(queryFn).toHaveBeenCalledTimes(1)
    expect(queryClient.getQueryData(key)).toBe('fresh')

    query.unmounted()

    // gcTime hasn't elapsed yet — cache still present
    await vi.advanceTimersByTimeAsync(50)
    expect(queryClient.getQueryData(key)).toBe('fresh')

    // After gcTime elapses, the query is removed from the cache
    await vi.advanceTimersByTimeAsync(60)
    expect(queryClient.getQueryData(key)).toBeUndefined()
  })

  it('should not garbage-collect when gcTime is Infinity', async () => {
    const key = queryKey()

    const query = createQuery(queryClient, {
      queryKey: key,
      queryFn: () => sleep(5).then(() => 'forever'),
      gcTime: Infinity,
    })

    query.mounted()
    await vi.advanceTimersByTimeAsync(6)
    query.unmounted()

    await vi.advanceTimersByTimeAsync(60_000)
    expect(queryClient.getQueryData(key)).toBe('forever')
  })

  // ── select with structural sharing ──────────────────────────────────

  it('should structurally share selected data so $data reference is stable across refetches', async () => {
    const key = queryKey()

    const query = createQuery(queryClient, {
      queryKey: key,
      queryFn: () => sleep(5).then(() => [1, 2, 3]),
      select: (data) => data.map((x) => x + 1),
      staleTime: 0,
    })

    query.mounted()
    await vi.advanceTimersByTimeAsync(6)
    const firstRef = query.$data.getState()
    expect(firstRef).toEqual([2, 3, 4])

    // Refresh — same query result reaches select; with structural sharing,
    // the resulting array reference should be preserved.
    query.refresh()
    await vi.advanceTimersByTimeAsync(6)
    const secondRef = query.$data.getState()

    expect(secondRef).toBe(firstRef)
  })

  // ── placeholderData function with prevQuery ─────────────────────────

  it('should pass previous data and previous query to placeholderData function', async () => {
    const key = queryKey()
    const scope = fork()
    const setCount = createEvent<number>()
    const $count = createStore(0).on(setCount, (_, v) => v)
    const seenPrevKeys: Array<unknown> = []

    const query = createQuery(queryClient, {
      queryKey: [...key, $count],
      queryFn: ({ queryKey: qk }) =>
        sleep(10).then(() => ({ count: qk[qk.length - 1] as number })),
      select: (data) => data.count,
      placeholderData: (prevData, prevQuery) => {
        if (prevQuery) {
          seenPrevKeys.push(prevQuery.queryKey)
        }
        return prevData
      },
    })

    function Page() {
      const { data } = useUnit({ data: query.$data })
      return <span>data: {String(data ?? 'none')}</span>
    }

    const rendered = renderWithScope(scope, <Page />)
    await allSettled(query.mounted, { scope })
    await vi.advanceTimersByTimeAsync(11)
    rendered.getByText('data: 0')

    await act(async () => {
      await allSettled(setCount, { scope, params: 1 })
      await allSettled(setCount, { scope, params: 2 })
      await vi.advanceTimersByTimeAsync(11)
    })

    rendered.getByText('data: 2')

    // placeholderData factory should have received the prevQuery on each switch
    expect(seenPrevKeys.length).toBeGreaterThan(0)
    seenPrevKeys.forEach((k) => {
      expect(Array.isArray(k)).toBe(true)
    })
  })
})
