import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { act, render } from '@testing-library/react'
import * as React from 'react'
import { Provider } from 'effector-react'
import { allSettled, createEvent, createStore, fork } from 'effector'
import { QueryClient } from '@tanstack/query-core'
import { queryKey, sleep } from './test-utils'
import { createQuery } from '@effector-tanstack-query/core'
import { useQuery } from '..'
import type { Scope } from 'effector'

function renderWithScope(scope: Scope, ui: React.ReactElement) {
  return render(<Provider value={scope}>{ui}</Provider>)
}

describe('createQuery — setQueryData interactions', () => {
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

  it('should fetch on mount when query was created via setQueryData (no updatedAt)', async () => {
    const key = queryKey()
    queryClient.setQueryData(key, 'prefetched')

    const query = createQuery(queryClient, {
      name: 'setDataMount',
      queryKey: key,
      queryFn: () => sleep(5).then(() => 'fresh'),
    })

    const scope = fork()
    await allSettled(query.mounted, { scope })

    // Initially shows the prefetched data, but is fetching because no updatedAt
    expect(scope.getState(query.$data)).toBe('prefetched')
    expect(scope.getState(query.$isFetching)).toBe(true)

    await vi.advanceTimersByTimeAsync(6)
    expect(scope.getState(query.$data)).toBe('fresh')
  })

  it('should not refetch on mount when setQueryData supplies a recent updatedAt within staleTime', async () => {
    const key = queryKey()
    const queryFn = vi.fn(() => sleep(5).then(() => 'fresh'))

    queryClient.setQueryData(key, 'cached', { updatedAt: Date.now() })

    const query = createQuery<string>(queryClient, {
      name: 'setDataFreshUpdatedAt',
      queryKey: key,
      queryFn,
      staleTime: 60_000,
    })

    const scope = fork()
    await allSettled(query.mounted, { scope })
    await vi.advanceTimersByTimeAsync(10)

    expect(scope.getState(query.$data)).toBe('cached')
    expect(queryFn).not.toHaveBeenCalled()
  })

  it('should react when setQueryData is called externally (cache → store update)', async () => {
    const key = queryKey()

    const query = createQuery(queryClient, {
      name: 'externalSetData',
      queryKey: key,
      queryFn: () => sleep(5).then(() => 'initial'),
      staleTime: Infinity,
    })

    function Page() {
      const { data } = useQuery(query)
      return <span>data: {data ?? 'none'}</span>
    }

    const rendered = render(<Page />)
    await act(async () => {
      await vi.advanceTimersByTimeAsync(6)
    })
    rendered.getByText('data: initial')

    await act(async () => {
      queryClient.setQueryData(key, 'patched')
      await vi.advanceTimersByTimeAsync(0)
    })
    rendered.getByText('data: patched')
  })
})

describe('createQuery — removeQueries / resetQueries', () => {
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

  it('should drop cache when removeQueries is called', async () => {
    const key = queryKey()

    const query = createQuery(queryClient, {
      name: 'removeReset',
      queryKey: key,
      queryFn: () => sleep(5).then(() => 'data'),
      staleTime: Infinity,
    })

    query.mounted()
    await vi.advanceTimersByTimeAsync(6)
    expect(queryClient.getQueryData(key)).toBe('data')

    queryClient.removeQueries({ queryKey: key })
    expect(queryClient.getQueryData(key)).toBeUndefined()
  })

  it('should refetch when reset via resetQueries (active query)', async () => {
    const key = queryKey()
    let count = 0

    const query = createQuery(queryClient, {
      name: 'resetRefetch',
      queryKey: key,
      queryFn: () => sleep(5).then(() => ++count),
      staleTime: Infinity,
    })

    function Page() {
      const { data } = useQuery(query)
      return <span>data: {data ?? 'none'}</span>
    }

    const rendered = render(<Page />)
    await act(async () => {
      await vi.advanceTimersByTimeAsync(6)
    })
    rendered.getByText('data: 1')

    await act(async () => {
      void queryClient.resetQueries({ queryKey: key })
      await vi.advanceTimersByTimeAsync(6)
    })
    rendered.getByText('data: 2')
    expect(count).toBe(2)
  })

  it('should clear state without refetching when resetQueries is called on a disabled query', async () => {
    const key = queryKey()
    const queryFn = vi.fn(() => sleep(5).then(() => 'data'))

    queryClient.setQueryData(key, 'pre-existing')

    const query = createQuery<string>(queryClient, {
      name: 'resetDisabled',
      queryKey: key,
      queryFn,
      enabled: false,
    })

    function Page() {
      const { data } = useQuery(query)
      return <span>data: {String(data ?? 'none')}</span>
    }

    const rendered = render(<Page />)
    await act(async () => {
      await vi.advanceTimersByTimeAsync(0)
    })
    rendered.getByText('data: pre-existing')

    await act(async () => {
      void queryClient.resetQueries({ queryKey: key })
      await vi.advanceTimersByTimeAsync(10)
    })

    rendered.getByText('data: none')
    expect(queryFn).not.toHaveBeenCalled()
  })
})

describe('createQuery — custom queryKeyHashFn', () => {
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

  it('should use custom queryKeyHashFn (e.g. to support bigints in queryKey)', async () => {
    const key = [...queryKey(), 1n]

    function queryKeyHashFn(x: ReadonlyArray<unknown>) {
      return JSON.stringify(x, (_, value) =>
        typeof value === 'bigint' ? value.toString() : value,
      )
    }

    const query = createQuery(queryClient, {
      name: 'bigintHash',
      queryKey: key,
      queryFn: () => 'bigint-data',
      queryKeyHashFn,
    })

    query.mounted()
    await vi.advanceTimersByTimeAsync(0)

    const cached = queryClient
      .getQueryCache()
      .get(queryKeyHashFn(key as ReadonlyArray<unknown>))
    expect(cached?.state.data).toBe('bigint-data')
  })
})

describe('createQuery — refetchInterval dynamic updates', () => {
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

  it('should change refetchInterval when the option function reads updated data', async () => {
    const key = queryKey()
    let count = 0

    const query = createQuery(queryClient, {
      name: 'dynamicInterval',
      queryKey: key,
      queryFn: () => ++count,
      refetchInterval: (q) => {
        const v = q.state.data as number | undefined
        if (v !== undefined && v >= 2) return false
        return 10
      },
    })

    query.mounted()
    await vi.advanceTimersByTimeAsync(1)
    expect(count).toBe(1)

    await vi.advanceTimersByTimeAsync(11)
    expect(count).toBe(2)

    // After data >= 2, refetchInterval returns false → polling stops
    await vi.advanceTimersByTimeAsync(50)
    expect(count).toBe(2)
  })
})

describe('createQuery — select advanced', () => {
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

  it('should preserve select reference between successive refetches when raw data is structurally equal', async () => {
    const key = queryKey()

    const query = createQuery(queryClient, {
      name: 'selectStable',
      queryKey: key,
      queryFn: () => sleep(5).then(() => ({ a: 1, b: 2 })),
      select: (data) => [data.a, data.b],
      staleTime: 0,
    })

    query.mounted()
    await vi.advanceTimersByTimeAsync(6)
    const first = query.$data.getState()

    query.refresh()
    await vi.advanceTimersByTimeAsync(6)
    const second = query.$data.getState()

    expect(second).toBe(first)
  })

  it('should put query into error state when select throws', async () => {
    const key = queryKey()

    const query = createQuery<string, Error>(queryClient, {
      name: 'selectError',
      queryKey: key,
      queryFn: () => sleep(5).then(() => 'raw'),
      select: () => {
        throw new Error('select fail')
      },
    })

    query.mounted()
    await vi.advanceTimersByTimeAsync(6)

    expect(query.$status.getState()).toBe('error')
    expect(query.$error.getState()?.message).toBe('select fail')
  })
})

describe('createQuery — observer without queryFn (cache reader)', () => {
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

  it('should reflect cache writes when observer is created without a queryFn', async () => {
    const key = queryKey()

    const query = createQuery<string>(queryClient, {
      name: 'observerOnly',
      queryKey: key,
    })

    const scope = fork()
    await allSettled(query.mounted, { scope })
    expect(scope.getState(query.$data)).toBeUndefined()

    await act(async () => {
      queryClient.setQueryData(key, 'pushed')
      await vi.advanceTimersByTimeAsync(0)
    })

    expect(scope.getState(query.$data)).toBe('pushed')
  })
})

describe('createQuery — re-render minimization (structural sharing)', () => {
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

  it('should not re-render when refetched data is structurally equal to previous', async () => {
    const key = queryKey()
    let renderCount = 0

    const query = createQuery(queryClient, {
      name: 'noChurn',
      queryKey: key,
      queryFn: () => sleep(5).then(() => ({ items: [1, 2, 3] })),
      staleTime: 0,
    })

    function Page() {
      const { data } = useQuery(query)
      renderCount++
      return <span>items: {data?.items.length ?? 0}</span>
    }

    const rendered = render(<Page />)
    await act(async () => {
      await vi.advanceTimersByTimeAsync(6)
    })
    rendered.getByText('items: 3')

    const baseline = renderCount

    await act(async () => {
      query.refresh()
      await vi.advanceTimersByTimeAsync(6)
    })

    // refetch happened but data is structurally equal — minimal extra renders
    expect(renderCount - baseline).toBeLessThanOrEqual(2)
  })
})

describe('createQuery — reactive enabled with state recovery', () => {
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

  it('should switch to a different error key and recover correctly', async () => {
    const scope = fork()
    const setId = createEvent<number>()
    const $id = createStore(1).on(setId, (_, v) => v)

    const query = createQuery(queryClient, {
      name: 'switchErrors',
      queryKey: ['err', $id],
      queryFn: async ({ queryKey: qk }) => {
        await sleep(5)
        const id = qk[1] as number
        throw new Error(`fail-${id}`)
      },
    })

    function Page() {
      const { error } = useQuery(query)
      return <span>error: {error?.message ?? 'none'}</span>
    }

    const rendered = renderWithScope(scope, <Page />)
    await act(async () => {
      await vi.advanceTimersByTimeAsync(6)
    })
    rendered.getByText('error: fail-1')

    await act(async () => {
      await allSettled(setId, { scope, params: 2 })
      await vi.advanceTimersByTimeAsync(6)
    })

    rendered.getByText('error: fail-2')
  })
})
