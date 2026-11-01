import {
  act,
  cleanup,
  fireEvent,
  render,
  waitFor,
} from '@testing-library/react'
import { Provider, useUnit } from 'effector-react'
import { allSettled, createEvent, createStore, fork } from 'effector'
import { QueryClient } from '@tanstack/query-core'
import {
  QueryClientProvider,
  infiniteQueryOptions as nativeInfiniteOptions,
  queryOptions as nativeOptions,
  useInfiniteQuery as useNativeInfiniteQuery,
  useQuery as useNativeQuery,
} from '@tanstack/react-query'
import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  createInfiniteQuery,
  createQuery,
  infiniteQueryOptions,
  queryOptions,
} from '@effector-tanstack-query/core'
import { useInfiniteQuery, useQuery } from '../index'

const clients: QueryClient[] = []
afterEach(() => {
  cleanup()
  for (const client of clients.splice(0)) client.clear()
})
function setup() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  clients.push(client)
  const changed = createEvent<number>()
  const $id = createStore(1).on(changed, (_, id) => id)
  return { client, changed, $id, scope: fork() }
}

// Test both origins: existing native factories and our optional core helpers.
const variants: Array<{
  name: string
  options: typeof queryOptions
  pages: typeof infiniteQueryOptions
}> = [
  { name: 'native', options: nativeOptions, pages: nativeInfiniteOptions },
  { name: 'core', options: queryOptions, pages: infiniteQueryOptions },
]

describe.each(variants)(
  '$name factory with Effector and native hooks',
  ({ name, options, pages }) => {
    it('shares an in-flight request, follows source changes and observes cache writes', async () => {
      const { client, changed, $id, scope } = setup()
      const pending: Array<() => void> = []
      const fetchTodo = vi.fn(
        (id: number) =>
          new Promise<{ id: number }>((resolve) => {
            pending.push(() => resolve({ id }))
          }),
      )
      const todoOptions = (id: number) =>
        options({
          queryKey: ['todo', { id }],
          queryFn: () => fetchTodo(id),
          staleTime: Infinity,
        })
      const query = createQuery(client, { source: $id, query: todoOptions })
      function Page() {
        const id = useUnit($id)
        const adapter = useQuery(query)
        const native = useNativeQuery(todoOptions(id))
        return (
          <span>
            {adapter.data?.id}/{native.data?.id}
          </span>
        )
      }
      const view = render(
        <Provider value={scope}>
          <QueryClientProvider client={client}>
            <Page />
          </QueryClientProvider>
        </Provider>,
      )
      expect(fetchTodo.mock.calls).toEqual([[1]])
      await act(async () => pending[0]!())
      await waitFor(() => view.getByText('1/1'))
      await act(() => allSettled(changed, { scope, params: 2 }))
      expect(fetchTodo.mock.calls).toEqual([[1], [2]])
      await act(async () => pending[1]!())
      await waitFor(() => view.getByText('2/2'))
      act(() => client.setQueryData(todoOptions(2).queryKey, { id: 20 }))
      await waitFor(() => view.getByText('20/20'))
      expect(client.getQueryData(todoOptions(1).queryKey)).toEqual({ id: 1 })
      view.unmount()
      expect(scope.getState(query.$observer)).toBeNull()
    })

    if (name === 'native') {
      it('keeps consumer selectors separate from raw cache data without refetching', async () => {
        const { client, changed, $id, scope } = setup()
        const fetchTodo = vi.fn(async () => ({ id: 1, title: 'todo' }))
        const todoOptions = () =>
          options({
            queryKey: ['selected'],
            queryFn: fetchTodo,
            staleTime: Infinity,
          })
        const query = createQuery(client, {
          source: $id,
          query: (multiplier: number) => ({
            ...todoOptions(),
            select: (todo) => `${todo.title}:${todo.id * multiplier}`,
          }),
        })
        function Page() {
          const adapter = useQuery(query)
          const native = useNativeQuery({
            ...todoOptions(),
            select: (todo) => todo.id,
          })
          return (
            <span>
              {adapter.data}/{native.data}
            </span>
          )
        }
        const view = render(
          <Provider value={scope}>
            <QueryClientProvider client={client}>
              <Page />
            </QueryClientProvider>
          </Provider>,
        )
        await waitFor(() => view.getByText('todo:1/1'))
        await act(() => allSettled(changed, { scope, params: 2 }))
        view.getByText('todo:2/1')
        expect(fetchTodo).toHaveBeenCalledTimes(1)
        expect(client.getQueryData(todoOptions().queryKey)).toEqual({
          id: 1,
          title: 'todo',
        })
      })
    }

    it('shares infinite pages fetched through either consumer', async () => {
      const { client, $id, scope } = setup()
      const fetchPage = vi.fn(async (id: number, page: number) => ({
        id,
        page,
      }))
      const pageOptions = (id: number) =>
        pages({
          queryKey: ['pages', id],
          initialPageParam: 0,
          queryFn: ({ pageParam }) => fetchPage(id, pageParam),
          getNextPageParam: (last) =>
            last.page < 2 ? last.page + 1 : undefined,
          staleTime: Infinity,
        })
      const query = createInfiniteQuery(client, {
        source: $id,
        query: pageOptions,
      })
      function Page() {
        const id = useUnit($id)
        const adapter = useInfiniteQuery(query)
        const native = useNativeInfiniteQuery(pageOptions(id))
        return (
          <>
            <span>
              {adapter.data?.pages.map((p) => p.page).join(',')}/
              {native.data?.pages.map((p) => p.page).join(',')}
            </span>
            <button onClick={adapter.fetchNextPage}>adapter next</button>
            <button onClick={() => void native.fetchNextPage()}>
              native next
            </button>
          </>
        )
      }
      const view = render(
        <Provider value={scope}>
          <QueryClientProvider client={client}>
            <Page />
          </QueryClientProvider>
        </Provider>,
      )
      await waitFor(() => view.getByText('0/0'))
      fireEvent.click(view.getByText('native next'))
      await waitFor(() => view.getByText('0,1/0,1'))
      fireEvent.click(view.getByText('adapter next'))
      await waitFor(() => view.getByText('0,1,2/0,1,2'))
      expect(fetchPage.mock.calls).toEqual([
        [1, 0],
        [1, 1],
        [1, 2],
      ])
      expect(client.getQueryData(pageOptions(1).queryKey)?.pageParams).toEqual([
        0, 1, 2,
      ])
    })
  },
)
