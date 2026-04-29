import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { act, render } from '@testing-library/react'
import * as React from 'react'
import { Provider } from 'effector-react'
import { allSettled, createEvent, createStore, fork } from 'effector'
import { QueryClient } from '@tanstack/query-core'
import { queryKey, sleep } from './test-utils'
import { createQuery } from '../createQuery'
import { createInfiniteQuery } from '../createInfiniteQuery'
import { useSuspenseInfiniteQuery, useSuspenseQuery } from '../react'
import type { Scope } from 'effector'

function renderWithScope(scope: Scope, ui: React.ReactElement) {
  return render(<Provider value={scope}>{ui}</Provider>)
}

class ErrorBoundary extends React.Component<
  { children: React.ReactNode; fallback: (error: Error) => React.ReactNode },
  { error: Error | null }
> {
  override state = { error: null as Error | null }
  static getDerivedStateFromError(error: Error) {
    return { error }
  }
  override render() {
    if (this.state.error) return this.props.fallback(this.state.error)
    return this.props.children
  }
}

describe('useSuspenseQuery', () => {
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

  it('should suspend until data resolves and then render it', async () => {
    const key = queryKey()
    const scope = fork()

    const query = createQuery(queryClient, {
      name: 'suspendedQuery',
      queryKey: key,
      queryFn: () => sleep(10).then(() => 'hello'),
    })

    function Page() {
      const data = useSuspenseQuery(query)
      return <span>data: {data}</span>
    }

    const rendered = renderWithScope(
      scope,
      <React.Suspense fallback={<span>loading</span>}>
        <Page />
      </React.Suspense>,
    )

    rendered.getByText('loading')

    await act(async () => {
      await vi.advanceTimersByTimeAsync(11)
    })

    rendered.getByText('data: hello')
  })

  it('should propagate error to ErrorBoundary', async () => {
    const key = queryKey()
    const scope = fork()
    const error = new Error('fetch failed')

    const query = createQuery(queryClient, {
      name: 'failingQuery',
      queryKey: key,
      queryFn: () => sleep(10).then(() => Promise.reject(error)),
    })

    function Page() {
      const data = useSuspenseQuery(query)
      return <span>data: {String(data)}</span>
    }

    const rendered = renderWithScope(
      scope,
      <ErrorBoundary fallback={(e) => <span>boundary: {e.message}</span>}>
        <React.Suspense fallback={<span>loading</span>}>
          <Page />
        </React.Suspense>
      </ErrorBoundary>,
    )

    rendered.getByText('loading')

    await act(async () => {
      await vi.advanceTimersByTimeAsync(11)
    })

    rendered.getByText('boundary: fetch failed')
  })

  it('should serve cached data immediately without suspending', async () => {
    const key = queryKey()
    const scope = fork()

    queryClient.setQueryData(key, 'cached')

    const queryFn = vi.fn(() => Promise.resolve('fresh'))
    const query = createQuery<string>(queryClient, {
      name: 'cachedQuery',
      queryKey: key,
      queryFn,
      staleTime: Infinity,
    })

    function Page() {
      const data = useSuspenseQuery(query)
      return <span>data: {data}</span>
    }

    const rendered = renderWithScope(
      scope,
      <React.Suspense fallback={<span>loading</span>}>
        <Page />
      </React.Suspense>,
    )

    // Should NOT show loading — cache hit
    rendered.getByText('data: cached')
    expect(queryFn).not.toHaveBeenCalled()
  })

  it('should re-suspend when queryKey store changes to a new key', async () => {
    const key = queryKey()
    const scope = fork()
    const setId = createEvent<number>()
    const $id = createStore(1).on(setId, (_, v) => v)

    const query = createQuery(queryClient, {
      name: 'reactiveSuspense',
      queryKey: [...key, $id],
      queryFn: ({ queryKey: qk }) =>
        sleep(10).then(() => `id-${qk[qk.length - 1]}`),
    })

    function Page() {
      const data = useSuspenseQuery(query)
      return <span>data: {data}</span>
    }

    const rendered = renderWithScope(
      scope,
      <React.Suspense fallback={<span>loading</span>}>
        <Page />
      </React.Suspense>,
    )

    rendered.getByText('loading')
    await act(async () => {
      await vi.advanceTimersByTimeAsync(11)
    })
    rendered.getByText('data: id-1')

    // Switch key — observer's data immediately becomes pending for new key
    await act(async () => {
      await allSettled(setId, { scope, params: 2 })
      await vi.advanceTimersByTimeAsync(11)
    })

    rendered.getByText('data: id-2')
  })
})

describe('useSuspenseInfiniteQuery', () => {
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

  it('should suspend until first page resolves and then render the InfiniteData', async () => {
    const scope = fork()

    const query = createInfiniteQuery<number, Error, number>(queryClient, {
      name: 'suspenseInfinite',
      queryKey: ['infinite'],
      queryFn: ({ pageParam }: { pageParam: any }) =>
        sleep(10).then(() => pageParam),
      getNextPageParam: (lastPage: number) => lastPage + 1,
      initialPageParam: 0,
    })

    function Page() {
      const data = useSuspenseInfiniteQuery(query)
      return <span>pages: {data.pages.join(',')}</span>
    }

    const rendered = renderWithScope(
      scope,
      <React.Suspense fallback={<span>loading</span>}>
        <Page />
      </React.Suspense>,
    )

    rendered.getByText('loading')
    await act(async () => {
      await vi.advanceTimersByTimeAsync(11)
    })
    rendered.getByText('pages: 0')
  })

  it('should propagate infinite-query error to ErrorBoundary', async () => {
    const scope = fork()
    const failure = new Error('infinite fail')

    const query = createInfiniteQuery<number, Error, number>(queryClient, {
      name: 'suspenseInfiniteFail',
      queryKey: ['fail'],
      queryFn: () => sleep(5).then(() => Promise.reject(failure)),
      getNextPageParam: (lastPage: number) => lastPage + 1,
      initialPageParam: 0,
    })

    function Page() {
      const data = useSuspenseInfiniteQuery(query)
      return <span>pages: {data.pages.length}</span>
    }

    const rendered = renderWithScope(
      scope,
      <ErrorBoundary fallback={(e) => <span>boundary: {e.message}</span>}>
        <React.Suspense fallback={<span>loading</span>}>
          <Page />
        </React.Suspense>
      </ErrorBoundary>,
    )

    rendered.getByText('loading')
    await act(async () => {
      await vi.advanceTimersByTimeAsync(6)
    })
    rendered.getByText('boundary: infinite fail')
  })
})
