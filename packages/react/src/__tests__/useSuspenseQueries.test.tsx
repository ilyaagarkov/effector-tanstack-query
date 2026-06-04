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
import { useSuspenseQueries } from '..'
import { queryKey, sleep } from './test-utils'
import type { Scope, StoreWritable } from 'effector'

// See suspense.test.tsx for rationale: factory result stores are
// exposed read-only on the public type, but writable at runtime.
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

describe('useSuspenseQueries', () => {
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

  // --- tuple ----------------------------------------------------------------

  it('tuple: suspends until every query resolves, then renders all', async () => {
    const userQuery = createQuery<string>({
      name: 'sus.tuple.user',
      queryKey: queryKey(),
      queryFn: () => sleep(10).then(() => 'alice'),
    })
    const postsQuery = createQuery<number[]>({
      name: 'sus.tuple.posts',
      queryKey: queryKey(),
      queryFn: () => sleep(5).then(() => [1, 2]),
    })

    const scope = fork({ values: [[$queryClient, queryClient]] })

    function Page() {
      const [user, posts] = useSuspenseQueries([userQuery, postsQuery] as const)
      return (
        <span>
          {user.data} / {posts.data.join(',')}
        </span>
      )
    }

    const rendered = renderWithScope(
      scope,
      <React.Suspense fallback={<span>loading</span>}>
        <Page />
      </React.Suspense>,
    )
    rendered.getByText('loading')
    await act(async () => {
      await vi.advanceTimersByTimeAsync(15)
    })
    rendered.getByText('alice / 1,2')
  })

  it('tuple: throws the first error to ErrorBoundary', async () => {
    const ok = createQuery<string>({
      name: 'sus.tuple.ok',
      queryKey: queryKey(),
      queryFn: () => sleep(5).then(() => 'fine'),
    })
    const boom = createQuery<number>({
      name: 'sus.tuple.boom',
      queryKey: queryKey(),
      queryFn: () => sleep(5).then(() => Promise.reject(new Error('nope'))),
    })

    const scope = fork({ values: [[$queryClient, queryClient]] })

    function Page() {
      const [u, p] = useSuspenseQueries([ok, boom] as const)
      return (
        <span>
          {u.data} / {p.data}
        </span>
      )
    }

    const rendered = renderWithScope(
      scope,
      <ErrorBoundary fallback={(e) => <span>boundary: {e.message}</span>}>
        <React.Suspense fallback={<span>loading</span>}>
          <Page />
        </React.Suspense>
      </ErrorBoundary>,
    )
    await act(async () => {
      await vi.advanceTimersByTimeAsync(10)
    })
    rendered.getByText('boundary: nope')
  })

  // --- family ---------------------------------------------------------------

  it('family: suspends until every item resolves', async () => {
    const $ids = createStore<number[]>([1, 2, 3])
    const family = createQueries<number, string>({
      name: 'sus.family.basic',
      source: $ids,
      query: (id) => ({
        queryKey: ['sus-family', id],
        queryFn: () => sleep(5).then(() => `v-${id}`),
      }),
    })

    const scope = fork({ values: [[$queryClient, queryClient]] })

    function Page() {
      const items = useSuspenseQueries(family)
      return <span>{items.map((it) => it.data).join(',')}</span>
    }

    const rendered = renderWithScope(
      scope,
      <React.Suspense fallback={<span>loading</span>}>
        <Page />
      </React.Suspense>,
    )
    rendered.getByText('loading')
    await act(async () => {
      await vi.advanceTimersByTimeAsync(10)
    })
    rendered.getByText('v-1,v-2,v-3')
  })

  it('family: returns prefetched data without flashing fallback', async () => {
    const $ids = createStore<number[]>([1, 2])
    const family = createQueries<number, string>({
      name: 'sus.family.prefetched',
      source: $ids,
      query: (id) => ({
        queryKey: ['sus-family-pref', id],
        // No timer — must resolve under fake-timers without
        // `advanceTimersByTimeAsync`.
        queryFn: () => Promise.resolve(`p-${id}`),
      }),
    })

    const scope = fork({ values: [[$queryClient, queryClient]] })
    await allSettled(family.prefetch, { scope })

    function Page() {
      const items = useSuspenseQueries(family)
      return <span>{items.map((it) => it.data).join(',')}</span>
    }

    const rendered = renderWithScope(
      scope,
      <React.Suspense fallback={<span>loading</span>}>
        <Page />
      </React.Suspense>,
    )
    // No "loading" flash — data is already in $items.
    rendered.getByText('p-1,p-2')
  })

  it('tuple: serves data from stores when no observer and no QC in scope', async () => {
    // Server-RSC scenario for tuple — both queries' $data / $status
    // are pre-populated, $observer + $queryClient are null.
    const q1 = createQuery<{ name: string }>({
      name: 'sus.tuple.serverStore.q1',
      queryKey: queryKey(),
      queryFn: () => Promise.resolve({ name: 'unused-1' }),
    })
    const q2 = createQuery<{ name: string }>({
      name: 'sus.tuple.serverStore.q2',
      queryKey: queryKey(),
      queryFn: () => Promise.resolve({ name: 'unused-2' }),
    })

    const scope = fork({
      values: [
        [q1.$data, { name: 'pre-1' }],
        [q1.$status, 'success'],
        [q2.$data, { name: 'pre-2' }],
        [q2.$status, 'success'],
      ] as StoreSeed[],
    })

    function Page() {
      const [a, b] = useSuspenseQueries([q1, q2] as const)
      return (
        <span>
          {a.data.name} / {b.data.name}
        </span>
      )
    }

    const rendered = renderWithScope(
      scope,
      <React.Suspense fallback={<span>loading</span>}>
        <Page />
      </React.Suspense>,
    )
    rendered.getByText('pre-1 / pre-2')
  })

  it('tuple: throws store-derived error when no observer in scope', async () => {
    const q = createQuery<{ name: string }>({
      name: 'sus.tuple.serverStore.err',
      queryKey: queryKey(),
      queryFn: () => Promise.resolve({ name: 'unused' }),
    })

    const failure = new Error('store-error')
    const scope = fork({
      values: [
        [q.$error, failure],
        [q.$status, 'error'],
      ] as StoreSeed[],
    })

    function Page() {
      const [a] = useSuspenseQueries([q] as const)
      return <span>{a.data.name}</span>
    }

    const rendered = renderWithScope(
      scope,
      <ErrorBoundary fallback={(e) => <span>boundary: {e.message}</span>}>
        <React.Suspense fallback={<span>loading</span>}>
          <Page />
        </React.Suspense>
      </ErrorBoundary>,
    )
    rendered.getByText('boundary: store-error')
  })

  it('tuple: throws "no QueryClient" if pending without observer or QC', async () => {
    const consoleError = vi
      .spyOn(console, 'error')
      .mockImplementation(() => undefined)

    const q = createQuery<string>({
      name: 'sus.tuple.noClient',
      queryKey: queryKey(),
      queryFn: () => Promise.resolve('x'),
    })

    // Default $status is 'pending'; no $queryClient injection.
    const scope = fork()

    function Page() {
      const [a] = useSuspenseQueries([q] as const)
      return <span>{a.data}</span>
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

  it('family: throws "no QueryClient" when pending and no QC in scope', () => {
    const consoleError = vi
      .spyOn(console, 'error')
      .mockImplementation(() => undefined)
    const $ids = createStore<number[]>([1])
    const family = createQueries<number, string>({
      name: 'sus.family.noQc',
      source: $ids,
      query: (id) => ({
        queryKey: ['noqc', id],
        queryFn: () => Promise.resolve(`v${id}`),
      }),
    })

    const scope = fork() // no $queryClient

    function Page() {
      const items = useSuspenseQueries(family)
      return <span>{items.map((it) => it.data).join(',')}</span>
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

  it('family: per-item refresh from suspense result routes through refreshOne', async () => {
    const fetchSpy = vi.fn((id: number) =>
      Promise.resolve(`v${id}-${fetchSpy.mock.calls.length}`),
    )
    const $ids = createStore<number[]>([1, 2])
    const family = createQueries<number, string>({
      name: 'sus.family.refresh',
      source: $ids,
      query: (id) => ({
        queryKey: ['sus-fam-ref', id],
        queryFn: () => fetchSpy(id),
        staleTime: Infinity,
      }),
    })

    const scope = fork({ values: [[$queryClient, queryClient]] })
    await allSettled(family.prefetch, { scope })
    const baseline = fetchSpy.mock.calls.length

    let refreshSecond: (() => void) | null = null
    function Page() {
      const items = useSuspenseQueries(family)
      refreshSecond = items[1]?.refresh ?? null
      return <span>{items.map((it) => it.data).join(',')}</span>
    }

    renderWithScope(
      scope,
      <React.Suspense fallback={<span>loading</span>}>
        <Page />
      </React.Suspense>,
    )

    await act(async () => {
      refreshSecond?.()
    })
    expect(fetchSpy.mock.calls.length).toBe(baseline + 1)
    expect(fetchSpy.mock.calls.at(-1)?.[0]).toBe(2)
  })

  it('family: error from any item propagates to ErrorBoundary', async () => {
    const $ids = createStore<number[]>([1, 2])
    const family = createQueries<number, string>({
      name: 'sus.family.error',
      source: $ids,
      query: (id) => ({
        queryKey: ['sus-family-err', id],
        queryFn: () =>
          sleep(5).then(() =>
            id === 2 ? Promise.reject(new Error('id-2-broke')) : `v-${id}`,
          ),
      }),
    })

    const scope = fork({ values: [[$queryClient, queryClient]] })

    function Page() {
      const items = useSuspenseQueries(family)
      return <span>{items.map((it) => it.data).join(',')}</span>
    }

    const rendered = renderWithScope(
      scope,
      <ErrorBoundary fallback={(e) => <span>boundary: {e.message}</span>}>
        <React.Suspense fallback={<span>loading</span>}>
          <Page />
        </React.Suspense>
      </ErrorBoundary>,
    )
    await act(async () => {
      await vi.advanceTimersByTimeAsync(10)
    })
    rendered.getByText('boundary: id-2-broke')
  })
})
