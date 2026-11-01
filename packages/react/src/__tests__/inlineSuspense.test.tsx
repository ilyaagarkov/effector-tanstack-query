import { Suspense } from 'react'
import { afterEach, describe, expect, it } from 'vitest'
import {
  act,
  cleanup,
  render,
  waitFor,
  fireEvent,
} from '@testing-library/react'
import { allSettled, createEvent, createStore, fork } from 'effector'
import { Provider } from 'effector-react'
import { QueryClient } from '@tanstack/query-core'
import { createInfiniteQuery, createQuery } from '@effector-tanstack-query/core'
import {
  useSuspenseInfiniteQuery,
  useSuspenseQueries,
  useSuspenseQuery,
} from '../index'

const clients: QueryClient[] = []
afterEach(() => {
  cleanup()
  for (const client of clients.splice(0)) client.clear()
})

function setup() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false, staleTime: 60_000 } },
  })
  clients.push(client)
  const changed = createEvent<number>()
  const $id = createStore(1).on(changed, (_, n) => n)
  const scope = fork({ values: [[$id, 3]] })
  const calls: number[] = []
  return { client, changed, $id, scope, calls }
}

describe('inline queries in Suspense', () => {
  it.each(['single', 'tuple'] as const)(
    '%s reads scoped keys before mount and follows key changes',
    async (mode) => {
      const { client, changed, $id, scope, calls } = setup()
      const query = createQuery(client, {
        queryKey: ['suspense', $id],
        queryFn: async ({ queryKey }) => {
          calls.push(queryKey[1])
          return queryKey[1] * 10
        },
      })
      const queries = [query] as const
      function Single() {
        const { data } = useSuspenseQuery(query)
        return <span>{data}</span>
      }
      function Tuple() {
        const [result] = useSuspenseQueries(queries)
        return <span>{result.data}</span>
      }
      const view = render(
        <Provider value={scope}>
          <Suspense fallback="pending">
            {mode === 'single' ? <Single /> : <Tuple />}
          </Suspense>
        </Provider>,
      )
      await waitFor(() => view.getByText('30'))
      expect(calls).toEqual([3])
      await act(() => allSettled(changed, { scope, params: 4 }))
      await waitFor(() => view.getByText('40'))
      expect(calls).toEqual([3, 4])
      view.unmount()
      expect(scope.getState(query.$observer)).toBeNull()
    },
  )

  it('infinite reads scoped keys, follows key changes and loads next pages', async () => {
    const { client, changed, $id, scope, calls } = setup()
    const query = createInfiniteQuery(client, {
      queryKey: ['suspense', $id],
      initialPageParam: 0,
      queryFn: async ({ queryKey, pageParam }) => {
        calls.push(queryKey[1])
        return queryKey[1] * 10 + pageParam
      },
      getNextPageParam: () => 1,
    })
    function Page() {
      const { data, fetchNextPage } = useSuspenseInfiniteQuery(query)
      return (
        <>
          <span>{JSON.stringify(data)}</span>
          <button onClick={fetchNextPage}>next</button>
        </>
      )
    }
    const view = render(
      <Provider value={scope}>
        <Suspense fallback="pending">
          <Page />
        </Suspense>
      </Provider>,
    )
    await waitFor(() =>
      view.getByText('{"pages":[30],"pageParams":[0]}'),
    )
    expect(calls).toEqual([3])
    await act(() => allSettled(changed, { scope, params: 4 }))
    await waitFor(() =>
      view.getByText('{"pages":[40],"pageParams":[0]}'),
    )
    expect(calls).toEqual([3, 4])
    fireEvent.click(view.getByText('next'))
    await waitFor(() =>
      view.getByText('{"pages":[40,41],"pageParams":[0,1]}'),
    )
    expect(calls).toEqual([3, 4, 4])
    view.unmount()
    expect(scope.getState(query.$observer)).toBeNull()
  })
})
