import * as React from 'react'
import { act, render } from '@testing-library/react'
import { Provider } from 'effector-react'
import { allSettled, createEvent, createStore, fork } from 'effector'
import { QueryClient } from '@tanstack/query-core'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  createQuery,
  createInfiniteQuery,
  infiniteQueryOptions,
} from '@effector-tanstack-query/core'
import {
  useSuspenseQuery,
  useSuspenseQueries,
  useSuspenseInfiniteQuery,
} from '../index'

describe('factory options before the Suspense observer mounts', () => {
  let client: QueryClient
  beforeEach(() => {
    vi.useFakeTimers()
    client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
    client.mount()
  })
  afterEach(() => {
    client.unmount()
    client.clear()
    vi.useRealTimers()
  })

  it.each(['single', 'tuple'] as const)(
    'uses current same-key closure and selector in %s consumers',
    async (mode) => {
      const changed = createEvent<number>()
      const $id = createStore(1).on(changed, (_, id) => id)
      const fetched: number[] = []
      const query = createQuery(client, {
        source: $id,
        query: (id: number) => ({
          queryKey: ['same-key'],
          staleTime: Infinity,
          queryFn: () =>
            new Promise<number>((resolve) =>
              setTimeout(() => {
                fetched.push(id)
                resolve(id)
              }, 10),
            ),
          select: (value) => `todo-${value * id}`,
        }),
      })
      const scope = fork()
      await allSettled(changed, { scope, params: 3 })
      const tuple = [query] as const
      function Single() {
        return <span>{useSuspenseQuery(query).data}</span>
      }
      function Tuple() {
        return <span>{useSuspenseQueries(tuple)[0].data}</span>
      }
      const view = render(
        <Provider value={scope}>
          <React.Suspense fallback={<span>loading</span>}>
            {mode === 'single' ? <Single /> : <Tuple />}
          </React.Suspense>
        </Provider>,
      )
      view.getByText('loading')
      await act(async () => {
        await vi.advanceTimersByTimeAsync(11)
      })
      view.getByText('todo-9')
      expect(fetched).toEqual([3])
      await act(async () => {
        await allSettled(changed, { scope, params: 4 })
      })
      view.getByText('todo-12')
      expect(fetched).toEqual([3])
      view.unmount()
    },
  )

  it('reads infinite page options from the current source before mount', async () => {
    const $start = createStore(1)
    const query = createInfiniteQuery(client, {
      source: $start,
      query: (start) =>
        infiniteQueryOptions({
          queryKey: ['infinite-suspense'],
          initialPageParam: start,
          staleTime: Infinity,
          queryFn: ({ pageParam }) =>
            new Promise<number>((resolve) =>
              setTimeout(() => resolve(pageParam * start), 10),
            ),
          getNextPageParam: () => undefined,
          select: (data) => data.pages.join(','),
        }),
    })
    const scope = fork({ values: [[$start, 3]] })
    function Page() {
      return <span>pages:{useSuspenseInfiniteQuery(query).data}</span>
    }
    const view = render(
      <Provider value={scope}>
        <React.Suspense fallback={<span>loading</span>}>
          <Page />
        </React.Suspense>
      </Provider>,
    )
    await act(async () => {
      await vi.advanceTimersByTimeAsync(11)
    })
    view.getByText('pages:9')
    view.unmount()
  })
})
