// Issue #27 for the suspense hooks: past the Suspense gate a component
// re-renders only for the result fields it read. The gate itself — suspending
// on pending, throwing errors to the boundary — must keep working whatever
// the component reads, because the hook inspects `status` internally.
//
// Counting and fetch-control helpers live in ./tracked-utils.
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { fireEvent } from '@testing-library/react'
import * as React from 'react'
import { fork } from 'effector'
import { QueryClient } from '@tanstack/query-core'
import type { InfiniteData } from '@tanstack/query-core'
import { queryKey } from './test-utils'
import {
  commitsDuring,
  controlledFn,
  flush,
  renderCounted,
} from './tracked-utils'
import type { Todo } from './tracked-utils'
import {
  createInfiniteQuery,
  createQuery,
} from '@effector-tanstack-query/core'
import { useSuspenseInfiniteQuery, useSuspenseQuery } from '..'

class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { error: Error | null }
> {
  override state = { error: null as Error | null }
  static getDerivedStateFromError(error: Error) {
    return { error }
  }
  override render() {
    if (this.state.error) return <span>boundary: {this.state.error.message}</span>
    return this.props.children
  }
}

function Gate({ children }: { children: React.ReactNode }) {
  return (
    <ErrorBoundary>
      <React.Suspense fallback={<span>loading</span>}>{children}</React.Suspense>
    </ErrorBoundary>
  )
}

describe('useSuspenseQuery — tracked result', () => {
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

  function seededQuery(name: string) {
    const key = queryKey()
    const response = controlledFn<Todo>()
    queryClient.setQueryData(key, { id: 1 })
    const query = createQuery(queryClient, {
      name,
      queryKey: key,
      queryFn: response.fn,
      staleTime: Infinity,
    })
    const refetch = () =>
      queryClient.refetchQueries({ queryKey: key, exact: true })
    return { key, query, response, refetch }
  }

  async function backgroundRefetch(
    { response, refetch }: ReturnType<typeof seededQuery>,
    outcome: { data: Todo } | { error: Error },
  ) {
    void refetch()
    await flush()
    if ('data' in outcome) response.last().resolve(outcome.data)
    else response.last().reject(outcome.error)
    await flush()
  }

  it('skips a background refetch that returns identical data', async () => {
    const q = seededQuery('suspense.tracked.identical')

    function Consumer() {
      const { data } = useSuspenseQuery(q.query)
      return <span>id: {data.id}</span>
    }

    const { counter, getByText } = renderCounted(
      <Gate>
        <Consumer />
      </Gate>,
      { scope: fork() },
    )
    await flush()
    getByText('id: 1')

    const commits = await commitsDuring(counter, () =>
      backgroundRefetch(q, { data: { id: 1 } }),
    )
    expect(commits).toBe(0)
  })

  it('re-renders once when the read data changes', async () => {
    const q = seededQuery('suspense.tracked.changed')

    function Consumer() {
      const { data } = useSuspenseQuery(q.query)
      return <span>id: {data.id}</span>
    }

    const { counter, getByText } = renderCounted(
      <Gate>
        <Consumer />
      </Gate>,
      { scope: fork() },
    )
    await flush()

    const commits = await commitsDuring(counter, () =>
      backgroundRefetch(q, { data: { id: 2 } }),
    )
    expect(commits).toBe(1)
    getByText('id: 2')
  })

  it('re-renders on isFetching when it is read', async () => {
    const q = seededQuery('suspense.tracked.isFetching')

    function Consumer() {
      const { isFetching } = useSuspenseQuery(q.query)
      return <span>{isFetching ? 'refreshing' : 'idle'}</span>
    }

    const { counter, getByText } = renderCounted(
      <Gate>
        <Consumer />
      </Gate>,
      { scope: fork() },
    )
    await flush()

    const commits = await commitsDuring(counter, async () => {
      void q.refetch()
      await flush()
      getByText('refreshing')
      q.response.last().resolve({ id: 1 })
      await flush()
    })
    expect(commits).toBe(2)
    getByText('idle')
  })

  it("re-renders on every field with 'all'", async () => {
    const q = seededQuery('suspense.all')

    function Consumer() {
      const { data } = useSuspenseQuery(q.query, { notifyOnChangeProps: 'all' })
      return <span>id: {data.id}</span>
    }

    const { counter } = renderCounted(
      <Gate>
        <Consumer />
      </Gate>,
      { scope: fork() },
    )
    await flush()

    const commits = await commitsDuring(counter, () =>
      backgroundRefetch(q, { data: { id: 1 } }),
    )
    expect(commits).toBeGreaterThan(0)
  })

  it('re-renders a data-only consumer once when a refetch fails with data', async () => {
    // `status` turns 'error' — the gate always re-renders for it, then lets
    // the data through (see suspenseErrors.test).
    const q = seededQuery('suspense.tracked.error')

    function Consumer() {
      const { data } = useSuspenseQuery(q.query)
      return <span>id: {data.id}</span>
    }

    const { counter, getByText } = renderCounted(
      <Gate>
        <Consumer />
      </Gate>,
      { scope: fork() },
    )
    await flush()

    const commits = await commitsDuring(counter, () =>
      backgroundRefetch(q, { error: new Error('boom') }),
    )
    expect(commits).toBe(1)
    getByText('id: 1')
  })

  it('suspends again when the query goes back to pending', async () => {
    const q = seededQuery('suspense.tracked.reset')

    function Consumer() {
      const { data } = useSuspenseQuery(q.query)
      return <span>id: {data.id}</span>
    }

    const { getByText } = renderCounted(
      <Gate>
        <Consumer />
      </Gate>,
      { scope: fork() },
    )
    await flush()
    getByText('id: 1')

    void queryClient.resetQueries({ queryKey: q.key, exact: true })
    await flush()
    getByText('loading')

    q.response.last().resolve({ id: 5 })
    await flush()
    getByText('id: 5')
  })

  it('skips identical refetches in StrictMode', async () => {
    const q = seededQuery('suspense.tracked.strict')

    function Consumer() {
      const { data } = useSuspenseQuery(q.query)
      return <span>id: {data.id}</span>
    }

    const { counter } = renderCounted(
      <Gate>
        <Consumer />
      </Gate>,
      { scope: fork(), strict: true },
    )
    await flush()

    const commits = await commitsDuring(counter, () =>
      backgroundRefetch(q, { data: { id: 1 } }),
    )
    expect(commits).toBe(0)
  })

  it('skips identical refetches without an effector Provider', async () => {
    const q = seededQuery('suspense.tracked.noProvider')

    function Consumer() {
      const { data } = useSuspenseQuery(q.query)
      return <span>id: {data.id}</span>
    }

    const { counter, getByText } = renderCounted(
      <Gate>
        <Consumer />
      </Gate>,
    )
    await flush()
    getByText('id: 1')

    const commits = await commitsDuring(counter, () =>
      backgroundRefetch(q, { data: { id: 1 } }),
    )
    expect(commits).toBe(0)
  })
})

describe('useSuspenseInfiniteQuery — tracked result', () => {
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

  function seededInfiniteQuery(name: string) {
    const key = queryKey()
    const response = controlledFn<number[]>()
    const seed: InfiniteData<number[], number> = {
      pages: [[1, 2]],
      pageParams: [0],
    }
    queryClient.setQueryData(key, seed)
    const query = createInfiniteQuery(queryClient, {
      name,
      queryKey: key,
      queryFn: response.fn,
      initialPageParam: 0,
      getNextPageParam: (_last: number[], pages: number[][]) => pages.length,
      staleTime: Infinity,
    })
    return { query, response }
  }

  it('skips fetchNextPage progress for a hasNextPage-only consumer', async () => {
    const { query, response } = seededInfiniteQuery('suspense.infinite.next')

    function Consumer() {
      const { hasNextPage, fetchNextPage } = useSuspenseInfiniteQuery(query)
      return <button onClick={fetchNextPage}>{String(hasNextPage)}</button>
    }

    const { counter, getByRole } = renderCounted(
      <Gate>
        <Consumer />
      </Gate>,
      { scope: fork() },
    )
    await flush()

    const commits = await commitsDuring(counter, async () => {
      fireEvent.click(getByRole('button'))
      await flush()
      response.last().resolve([3, 4])
      await flush()
    })
    expect(commits).toBe(0)
  })

  it('re-renders on isFetchingNextPage when it is read', async () => {
    const { query, response } = seededInfiniteQuery('suspense.infinite.flag')

    function Consumer() {
      const { isFetchingNextPage, fetchNextPage } =
        useSuspenseInfiniteQuery(query)
      return (
        <button onClick={fetchNextPage}>
          {isFetchingNextPage ? 'loading more' : 'idle'}
        </button>
      )
    }

    const { counter, getByRole, getByText } = renderCounted(
      <Gate>
        <Consumer />
      </Gate>,
      { scope: fork() },
    )
    await flush()

    const commits = await commitsDuring(counter, async () => {
      fireEvent.click(getByRole('button'))
      await flush()
      getByText('loading more')
      response.last().resolve([3, 4])
      await flush()
    })
    expect(commits).toBe(2)
    getByText('idle')
  })

  it('re-renders when the read pages change', async () => {
    const { query, response } = seededInfiniteQuery('suspense.infinite.data')

    function Consumer() {
      const { data, fetchNextPage } = useSuspenseInfiniteQuery(query)
      return (
        <button onClick={fetchNextPage}>{data.pages.flat().join(',')}</button>
      )
    }

    const { counter, getByRole, getByText } = renderCounted(
      <Gate>
        <Consumer />
      </Gate>,
      { scope: fork() },
    )
    await flush()

    const commits = await commitsDuring(counter, async () => {
      fireEvent.click(getByRole('button'))
      await flush()
      response.last().resolve([3, 4])
      await flush()
    })
    expect(commits).toBe(1)
    getByText('1,2,3,4')
  })

  it("re-renders on every field with 'all'", async () => {
    const { query, response } = seededInfiniteQuery('suspense.infinite.all')

    function Consumer() {
      const { hasNextPage, fetchNextPage } = useSuspenseInfiniteQuery(query, {
        notifyOnChangeProps: 'all',
      })
      return <button onClick={fetchNextPage}>{String(hasNextPage)}</button>
    }

    const { counter, getByRole } = renderCounted(
      <Gate>
        <Consumer />
      </Gate>,
      { scope: fork() },
    )
    await flush()

    const commits = await commitsDuring(counter, async () => {
      fireEvent.click(getByRole('button'))
      await flush()
      response.last().resolve([3, 4])
      await flush()
    })
    expect(commits).toBeGreaterThan(0)
  })
})
