import { Suspense } from 'react'
import { act, cleanup, fireEvent, render, waitFor } from '@testing-library/react'
import { Provider, useUnit } from 'effector-react'
import { allSettled, createEvent, createStore, fork } from 'effector'
import { QueryClient } from '@tanstack/query-core'
import {
  QueryClientProvider,
  queryOptions,
  useQuery as useNativeQuery,
} from '@tanstack/react-query'
import { afterEach, expect, it } from 'vitest'
import {
  createInfiniteQuery,
  createQuery,
  infiniteQueryOptions,
} from '@effector-tanstack-query/core'
import {
  useInfiniteQuery,
  useQuery,
  useSuspenseInfiniteQuery,
  useSuspenseQueries,
  useSuspenseQuery,
} from '../index'

const clients: QueryClient[] = []
afterEach(() => {
  cleanup()
  for (const client of clients.splice(0)) client.clear()
})

function createClient() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false, staleTime: Infinity } },
  })
  clients.push(client)
  return client
}

it.each(['single', 'tuple'] as const)(
  'reads scoped tuple options before %s Suspense mount',
  async (mode) => {
    const $id = createStore(1)
    const $filter = createStore('default')
    const query = createQuery(createClient(), {
      source: [$id, $filter],
      query: ([id, filter]) => ({
        queryKey: ['source', id, filter],
        queryFn: async () => `${id}:${filter}`,
      }),
    })
    const scope = fork({ values: [[$id, 3], [$filter, 'scoped']] })
    function Single() {
      return <span>{useSuspenseQuery(query).data}</span>
    }
    function Tuple() {
      const [result] = useSuspenseQueries([query] as const)
      return <span>{result.data}</span>
    }
    const view = render(
      <Provider value={scope}>
        <Suspense fallback="pending">
          {mode === 'single' ? <Single /> : <Tuple />}
        </Suspense>
      </Provider>,
    )
    await waitFor(() => view.getByText('3:scoped'))
    view.unmount()
    expect(scope.getState(query.$observer)).toBeNull()
  },
)

it('reads tuple page options and selector before infinite Suspense mount', async () => {
  const $start = createStore(1)
  const $label = createStore('default')
  const query = createInfiniteQuery(createClient(), {
    source: [$start, $label],
    query: ([start, label]) =>
      infiniteQueryOptions({
        queryKey: ['pages', start, label],
        initialPageParam: start,
        queryFn: async ({ pageParam }) => pageParam * start,
        getNextPageParam: () => undefined,
        select: (data) => `${label}:${data.pages.join(',')}`,
      }),
  })
  const scope = fork({ values: [[$start, 3], [$label, 'scope']] })
  function Page() {
    return <span>{useSuspenseInfiniteQuery(query).data}</span>
  }
  const view = render(
    <Provider value={scope}>
      <Suspense fallback="pending"><Page /></Suspense>
    </Provider>,
  )
  await waitFor(() => view.getByText('scope:9'))
  view.unmount()
  expect(scope.getState(query.$observer)).toBeNull()
})

it('shares native cache entries across tuple source updates', async () => {
  const client = createClient()
  const changed = createEvent<number>()
  const $id = createStore(1).on(changed, (_, value) => value)
  const $label = createStore('item')
  const calls: number[] = []
  const options = (id: number, label: string) =>
    queryOptions({
      queryKey: ['interop', id, label],
      queryFn: async () => {
        calls.push(id)
        return `${label}:${id}`
      },
    })
  const query = createQuery(client, {
    source: [$id, $label],
    query: ([id, label]) => options(id, label),
  })
  const scope = fork()
  function Page() {
    const id = useUnit($id)
    const label = useUnit($label)
    const adapter = useQuery(query)
    const native = useNativeQuery(options(id, label))
    return <span>{adapter.data}/{native.data}</span>
  }
  const view = render(
    <Provider value={scope}>
      <QueryClientProvider client={client}><Page /></QueryClientProvider>
    </Provider>,
  )
  await waitFor(() => view.getByText('item:1/item:1'))
  await act(() => allSettled(changed, { scope, params: 2 }))
  await waitFor(() => view.getByText('item:2/item:2'))
  expect(calls).toEqual([1, 2])
})

it('provides pagination through the regular infinite hook with tuple source', async () => {
  const $start = createStore(3)
  const $label = createStore('item')
  const query = createInfiniteQuery(createClient(), {
    source: [$start, $label],
    query: ([start, label]) =>
      infiniteQueryOptions({
        queryKey: ['regular-pages', start],
        initialPageParam: start,
        queryFn: async ({ pageParam }) => `${label}:${pageParam}`,
        getNextPageParam: (_last, _pages, previous) => previous + 1,
      }),
  })
  const scope = fork()
  function Page() {
    const { data, fetchNextPage } = useInfiniteQuery(query)
    return (
      <>
        <span>{data?.pages.join(',')}</span>
        <button onClick={fetchNextPage}>next</button>
      </>
    )
  }
  const view = render(<Provider value={scope}><Page /></Provider>)
  await waitFor(() => view.getByText('item:3'))
  fireEvent.click(view.getByText('next'))
  await waitFor(() => view.getByText('item:3,item:4'))
})
