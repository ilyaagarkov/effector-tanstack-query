import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { act, render } from '@testing-library/react'
import * as React from 'react'
import { Provider } from 'effector-react'
import { allSettled, createEvent, createStore, fork } from 'effector'
import { QueryClient } from '@tanstack/query-core'
import { queryKey, sleep } from './test-utils'
import { createQuery } from '@effector-tanstack-query/core'
import { createInfiniteQuery } from '@effector-tanstack-query/core'
import { useSuspenseInfiniteQuery, useSuspenseQuery } from '..'
import type { Scope, StoreWritable } from 'effector'

// `fork({ values })` expects `[StoreWritable<T>, T]` pairs. Our public
// query result interfaces expose `$data` / `$status` / … as read-only
// `Store<T>`, but at runtime they ARE writable (effector's `createStore`
// always returns a writable store). The cast bridges the type-level
// read-only stance to the runtime reality — only used in tests that
// pre-populate scope state without going through a `mounted()` cycle.
type StoreSeed = [StoreWritable<any>, any]

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
      const { data } = useSuspenseQuery(query)
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
      const { data } = useSuspenseQuery(query)
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
      const { data } = useSuspenseQuery(query)
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
      const { data } = useSuspenseQuery(query)
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

  it('throws error from stores to ErrorBoundary when status is error and no observer in scope', async () => {
    const query = createQuery<{ name: string }>({
      name: 'suspense.serverStoreError',
      queryKey: queryKey(),
      queryFn: () => Promise.resolve({ name: 'unused' }),
    })

    const failure = new Error('from-store-error')
    const scope = fork({
      values: [
        [query.$error, failure],
        [query.$status, 'error'],
      ] as StoreSeed[],
    })

    function Page() {
      const { data } = useSuspenseQuery(query)
      return <span>{data.name}</span>
    }

    const rendered = renderWithScope(
      scope,
      <ErrorBoundary fallback={(e) => <span>boundary: {e.message}</span>}>
        <React.Suspense fallback={<span>loading</span>}>
          <Page />
        </React.Suspense>
      </ErrorBoundary>,
    )

    rendered.getByText('boundary: from-store-error')
  })

  it('serves data from effector stores when no QueryClient and no observer are in scope', async () => {
    // Server-RSC scenario: `<EffectorNext values={serialize(scope)}>`
    // rebuilds the rendering scope from a snapshot that excludes
    // `$queryClient` and `$observer` (both `serialize: 'ignore'`). The
    // query result stores (`$data`, `$status`, …) ARE in the snapshot,
    // populated by a server-side `prefetchQueries(...)`. The hook has
    // to read those directly — no observer, no QC.
    const query = createQuery<{ name: string }>({
      name: 'suspense.serverStore',
      queryKey: queryKey(),
      queryFn: () => Promise.resolve({ name: 'should not run' }),
    })

    // Simulate the post-`serialize(scope)` rendering scope: data + status
    // are populated, $queryClient is not.
    const scope = fork({
      values: [
        [query.$data, { name: 'from-store' }],
        [query.$status, 'success'],
      ] as StoreSeed[],
    })

    function Page() {
      const { data } = useSuspenseQuery(query)
      return <span>{data.name}</span>
    }

    const rendered = renderWithScope(
      scope,
      <React.Suspense fallback={<span>loading</span>}>
        <Page />
      </React.Suspense>,
    )

    rendered.getByText('from-store')
  })

  it('throws a helpful error if no QueryClient is set anywhere', async () => {
    // Factory created without an explicit QC — falls back to the global
    // `$queryClient`, which is null in a fresh scope. Both `observerInScope`
    // (mount hasn't run yet under Suspense) and the transient observer
    // (needs a qc) are null → useSuspenseObserver throws.
    const consoleError = vi
      .spyOn(console, 'error')
      .mockImplementation(() => {})

    const query = createQuery<string>({
      name: 'suspense.noClient',
      queryKey: queryKey(),
      queryFn: () => Promise.resolve('x'),
    })

    function Page() {
      const { data } = useSuspenseQuery(query)
      return <span>{data}</span>
    }

    const scope = fork() // no $queryClient injection

    const rendered = renderWithScope(
      scope,
      <ErrorBoundary fallback={(e) => <span>boundary: {e.message}</span>}>
        <React.Suspense fallback={<span>loading</span>}>
          <Page />
        </React.Suspense>
      </ErrorBoundary>,
    )

    // The error message is pinned in the source — assert a stable substring.
    const match = rendered.container.textContent ?? ''
    expect(match).toMatch(/no QueryClient is set/)

    consoleError.mockRestore()
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
      const { data } = useSuspenseInfiniteQuery(query)
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
      const { data } = useSuspenseInfiniteQuery(query)
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

  it('throws error from stores when infinite status is error and no observer in scope', async () => {
    const query = createInfiniteQuery<number, Error, number>({
      name: 'suspense.infiniteServerStoreError',
      queryKey: ['infinite-store-error'],
      queryFn: () => Promise.resolve(0),
      getNextPageParam: (last) => last + 1,
      initialPageParam: 0,
    })

    const failure = new Error('infinite-store-error')
    const scope = fork({
      values: [
        [query.$error, failure],
        [query.$status, 'error'],
      ] as StoreSeed[],
    })

    function Page() {
      const { data } = useSuspenseInfiniteQuery(query)
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

    rendered.getByText('boundary: infinite-store-error')
  })

  it('throws "no QueryClient" when infinite status is pending and no observer in scope', async () => {
    const consoleError = vi
      .spyOn(console, 'error')
      .mockImplementation(() => {})

    const query = createInfiniteQuery<number, Error, number>({
      name: 'suspense.infiniteNoClient',
      queryKey: ['infinite-no-client'],
      queryFn: () => Promise.resolve(0),
      getNextPageParam: (last) => last + 1,
      initialPageParam: 0,
    })

    // Default $status is 'pending'; no $queryClient injection.
    const scope = fork()

    function Page() {
      const { data } = useSuspenseInfiniteQuery(query)
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

    expect(rendered.container.textContent ?? '').toMatch(/no QueryClient is set/)

    consoleError.mockRestore()
  })

  it('serves infinite data from effector stores when no QueryClient and no observer are in scope', async () => {
    // Same SSR store fallback as `useSuspenseQuery`, but for infinite — the
    // pagination fields (`$hasNextPage`, `$isFetchingNextPage`, …) also
    // have to be read from stores when the observer can't be built.
    const query = createInfiniteQuery<number, Error, number>({
      name: 'suspense.infiniteServerStore',
      queryKey: ['infinite-server'],
      queryFn: () => Promise.resolve(0),
      getNextPageParam: (last) => last + 1,
      initialPageParam: 0,
    })

    const scope = fork({
      values: [
        [query.$data, { pages: [1, 2], pageParams: [0, 1] }],
        [query.$status, 'success'],
        [query.$hasNextPage, true],
      ] as StoreSeed[],
    })

    function Page() {
      const { data, hasNextPage } = useSuspenseInfiniteQuery(query)
      return (
        <span>
          pages: {data.pages.join(',')} | next: {String(hasNextPage)}
        </span>
      )
    }

    const rendered = renderWithScope(
      scope,
      <React.Suspense fallback={<span>loading</span>}>
        <Page />
      </React.Suspense>,
    )

    rendered.getByText('pages: 1,2 | next: true')
  })
})
