// Past the Suspense gate a query's error is thrown to the boundary only when
// there is no data to show — `@tanstack/react-query`'s default
// (`throwOnError: query => query.state.data === undefined`). A failed refetch
// with data keeps rendering it, with `status: 'error'`, `isError` and
// `error` set.
//
// Counting and fetch-control helpers live in ./tracked-utils.
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { fireEvent } from '@testing-library/react'
import * as React from 'react'
import { createStore, fork } from 'effector'
import type { StoreWritable } from 'effector'
import { QueryClient } from '@tanstack/query-core'
import type { InfiniteData } from '@tanstack/query-core'
import { queryKey } from './test-utils'
import { controlledFn, flush, renderCounted } from './tracked-utils'
import type { Todo } from './tracked-utils'
import {
  $queryClient,
  createInfiniteQuery,
  createQueries,
  createQuery,
} from '@effector-tanstack-query/core'
import {
  useSuspenseInfiniteQuery,
  useSuspenseQueries,
  useSuspenseQuery,
} from '..'

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

type StoreSeed = [StoreWritable<any>, any]

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

function seededQuery(name: string, id = 1) {
  const key = queryKey()
  const response = controlledFn<Todo>()
  queryClient.setQueryData(key, { id })
  const query = createQuery(queryClient, {
    name,
    queryKey: key,
    queryFn: response.fn,
    staleTime: Infinity,
  })
  const refetch = async (outcome: { data: Todo } | { error: Error }) => {
    void queryClient.refetchQueries({ queryKey: key, exact: true })
    await flush()
    if ('data' in outcome) response.last().resolve(outcome.data)
    else response.last().reject(outcome.error)
    await flush()
  }
  return { key, query, response, refetch }
}

describe('useSuspenseQuery — errors past the gate', () => {
  it('keeps rendering data when a refetch fails, with the error exposed', async () => {
    const q = seededQuery('suspenseErrors.query.refetch')

    function Consumer() {
      const result = useSuspenseQuery(q.query)
      return (
        <span>
          id: {result.data.id} · {result.status} ·{' '}
          {result.isError ? result.error.message : 'no error'}
        </span>
      )
    }

    const { getByText, queryByText } = renderCounted(
      <Gate>
        <Consumer />
      </Gate>,
      { scope: fork() },
    )
    await flush()
    getByText('id: 1 · success · no error')

    await q.refetch({ error: new Error('boom') })
    expect(queryByText(/boundary/)).toBeNull()
    getByText('id: 1 · error · boom')

    // The next successful refetch clears the error.
    await q.refetch({ data: { id: 2 } })
    getByText('id: 2 · success · no error')
  })

  it('keeps rendering data when a refetch fails and only data is read', async () => {
    const q = seededQuery('suspenseErrors.query.dataOnly')

    function Consumer() {
      const { data } = useSuspenseQuery(q.query)
      return <span>id: {data.id}</span>
    }

    const { getByText, queryByText } = renderCounted(
      <Gate>
        <Consumer />
      </Gate>,
      { scope: fork() },
    )
    await flush()

    await q.refetch({ error: new Error('boom') })
    expect(queryByText(/boundary/)).toBeNull()
    getByText('id: 1')
  })

  it('throws to the boundary when the query fails without data', async () => {
    const response = controlledFn<Todo>()
    const query = createQuery(queryClient, {
      name: 'suspenseErrors.query.noData',
      queryKey: queryKey(),
      queryFn: response.fn,
    })

    function Consumer() {
      const { data } = useSuspenseQuery(query)
      return <span>id: {data.id}</span>
    }

    const { getByText } = renderCounted(
      <Gate>
        <Consumer />
      </Gate>,
      { scope: fork() },
    )
    await flush()
    getByText('loading')

    response.last().reject(new Error('first load failed'))
    await flush()
    getByText('boundary: first load failed')
  })

  it('renders serialized stores with data and an error instead of throwing', () => {
    const query = createQuery<Todo>({
      name: 'suspenseErrors.query.store',
      queryKey: queryKey(),
      queryFn: async () => ({ id: 0 }),
    })
    // A scope rebuilt from `serialize()` — no client, no observer.
    const scope = fork({
      values: [
        [query.$data, { id: 4 }],
        [query.$status, 'error'],
        [query.$error, new Error('stale')],
      ] as StoreSeed[],
    })

    function Consumer() {
      const result = useSuspenseQuery(query)
      return (
        <span>
          id: {result.data.id} · {result.isError ? result.error.message : '-'}
        </span>
      )
    }

    const { getByText } = renderCounted(
      <Gate>
        <Consumer />
      </Gate>,
      { scope },
    )
    getByText('id: 4 · stale')
  })
})

describe('useSuspenseInfiniteQuery — errors past the gate', () => {
  it('keeps the loaded pages when fetchNextPage fails', async () => {
    const key = queryKey()
    const response = controlledFn<number[]>()
    const seed: InfiniteData<number[], number> = {
      pages: [[1, 2]],
      pageParams: [0],
    }
    queryClient.setQueryData(key, seed)
    const query = createInfiniteQuery(queryClient, {
      name: 'suspenseErrors.infinite.next',
      queryKey: key,
      queryFn: response.fn,
      initialPageParam: 0,
      getNextPageParam: (_last: number[], pages: number[][]) => pages.length,
      staleTime: Infinity,
    })

    function Consumer() {
      const result = useSuspenseInfiniteQuery(query)
      return (
        <button onClick={result.fetchNextPage}>
          {result.data.pages.flat().join(',')} ·{' '}
          {result.isFetchNextPageError ? result.error!.message : 'ok'}
        </button>
      )
    }

    const { getByRole, getByText, queryByText } = renderCounted(
      <Gate>
        <Consumer />
      </Gate>,
      { scope: fork() },
    )
    await flush()
    getByText('1,2 · ok')

    fireEvent.click(getByRole('button'))
    await flush()
    response.last().reject(new Error('page failed'))
    await flush()

    expect(queryByText(/boundary/)).toBeNull()
    getByText('1,2 · page failed')
  })
})

describe('useSuspenseQueries — errors past the gate', () => {
  it('tuple: keeps rendering when one query’s refetch fails', async () => {
    const first = seededQuery('suspenseErrors.tuple.first', 1)
    const second = seededQuery('suspenseErrors.tuple.second', 2)

    function Consumer() {
      const [a, b] = useSuspenseQueries([first.query, second.query] as const)
      return (
        <span>
          {a.data.id},{b.data.id} · {b.isError ? b.error.message : 'ok'}
        </span>
      )
    }

    const { getByText, queryByText } = renderCounted(
      <Gate>
        <Consumer />
      </Gate>,
      { scope: fork() },
    )
    await flush()
    getByText('1,2 · ok')

    await second.refetch({ error: new Error('second failed') })
    expect(queryByText(/boundary/)).toBeNull()
    getByText('1,2 · second failed')
  })

  it('family: keeps rendering when an item’s refetch fails', async () => {
    const prefix = queryKey()[0]!
    const keyFor = (id: number) => [prefix, id]
    const responses = new Map<number, ReturnType<typeof controlledFn<Todo>>>()
    const responseFor = (id: number) => {
      if (!responses.has(id)) responses.set(id, controlledFn<Todo>())
      return responses.get(id)!
    }
    for (const id of [1, 2]) queryClient.setQueryData(keyFor(id), { id })
    const $ids = createStore([1, 2])
    const family = createQueries<number, Todo>({
      name: 'suspenseErrors.family',
      source: $ids,
      query: (id) => ({
        queryKey: keyFor(id),
        queryFn: () => responseFor(id).fn(),
        staleTime: Infinity,
      }),
    })
    const scope = fork({ values: [[$queryClient, queryClient]] })

    function Consumer() {
      const items = useSuspenseQueries(family)
      return (
        <span>
          {items
            .map((it) => `${it.data.id}:${it.isError ? it.error.message : 'ok'}`)
            .join(',')}
        </span>
      )
    }

    const { getByText, queryByText } = renderCounted(
      <Gate>
        <Consumer />
      </Gate>,
      { scope },
    )
    await flush()
    getByText('1:ok,2:ok')

    void queryClient.refetchQueries({ queryKey: keyFor(2), exact: true })
    await flush()
    responseFor(2).last().reject(new Error('item failed'))
    await flush()

    expect(queryByText(/boundary/)).toBeNull()
    getByText('1:ok,2:item failed')
  })
})
