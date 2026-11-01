import * as React from 'react'
import { act, render } from '@testing-library/react'
import { Provider } from 'effector-react'
import { allSettled, createEvent, createStore, fork } from 'effector'
import { QueryClient } from '@tanstack/query-core'
import { afterEach, beforeEach, describe, it, vi } from 'vitest'
import { createQuery } from '@effector-tanstack-query/core'
import { useQuery, useSuspenseQueries, useSuspenseQuery } from '../index'

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

describe('factory exceptions in React consumers', () => {
  let client: QueryClient
  beforeEach(() => {
    client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
    client.mount()
    // React logs errors caught by boundaries; keep the output readable.
    vi.spyOn(console, 'error').mockImplementation(() => {})
  })
  afterEach(() => {
    client.unmount()
    client.clear()
    vi.restoreAllMocks()
  })

  function createTodoQuery() {
    const changed = createEvent<number>()
    const $id = createStore(1).on(changed, (_, id) => id)
    const query = createQuery(client, {
      name: 'react.factoryErrors',
      source: $id,
      query: (id: number) => {
        if (id < 0) throw new Error(`invalid id ${id}`)
        return { queryKey: ['todo', id], queryFn: () => `todo-${id}` }
      },
    })
    return { changed, query }
  }

  it.each(['single', 'tuple'] as const)(
    'sends a factory exception to the error boundary in %s Suspense consumers',
    async (mode) => {
      const { changed, query } = createTodoQuery()
      const scope = fork()
      await allSettled(changed, { scope, params: -1 })
      const tuple = [query] as const
      function Single() {
        return <span>{useSuspenseQuery(query).data}</span>
      }
      function Tuple() {
        return <span>{useSuspenseQueries(tuple)[0].data}</span>
      }
      const view = render(
        <Provider value={scope}>
          <ErrorBoundary>
            <React.Suspense fallback={<span>loading</span>}>
              {mode === 'single' ? <Single /> : <Tuple />}
            </React.Suspense>
          </ErrorBoundary>
        </Provider>,
      )
      view.getByText('boundary: invalid id -1')
      view.unmount()
    },
  )

  it('exposes a factory exception as the query error in useQuery and recovers', async () => {
    const { changed, query } = createTodoQuery()
    const scope = fork()
    function Todo() {
      const { status, data, error } = useQuery(query)
      return <span>{status === 'error' ? `error: ${error?.message}` : String(data)}</span>
    }
    const view = render(
      <Provider value={scope}>
        <Todo />
      </Provider>,
    )
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 0))
    })
    view.getByText('todo-1')

    await act(async () => {
      await allSettled(changed, { scope, params: -1 })
    })
    view.getByText('error: invalid id -1')

    await act(async () => {
      await allSettled(changed, { scope, params: 2 })
      await new Promise((resolve) => setTimeout(resolve, 0))
    })
    view.getByText('todo-2')
    view.unmount()
  })
})
