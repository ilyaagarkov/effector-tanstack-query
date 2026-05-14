import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { render } from '@testing-library/react'
import { Provider } from 'effector-react'
import { fork } from 'effector'
import { QueryClient, dehydrate } from '@tanstack/query-core'
import {
  $queryClient,
  createQuery,
} from '@effector-tanstack-query/core'
import { queryKey } from './test-utils'
import { HydrationBoundary, useQuery } from '..'

describe('HydrationBoundary', () => {
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

  it('should hydrate the scope queryClient before children render', () => {
    const key = queryKey()
    const userData = { id: 1, name: 'Alice' }

    // Server-side: a separate QueryClient gets prefetched, then dehydrated.
    const serverClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    })
    serverClient.mount()
    serverClient.setQueryData(key, userData)
    const dehydratedState = dehydrate(serverClient)
    serverClient.clear()

    const scope = fork({ values: [[$queryClient, queryClient]] })

    const queryFn = vi.fn(() => Promise.resolve({ id: 1, name: 'Stale' }))
    const query = createQuery<typeof userData>(queryClient, {
      name: 'hydrationBoundary.user',
      queryKey: key,
      queryFn,
      staleTime: Infinity,
    })

    function Page() {
      const { data, isPending } = useQuery(query)
      if (isPending) return <span>loading</span>
      return <span>{data?.name}</span>
    }

    const rendered = render(
      <Provider value={scope}>
        <HydrationBoundary state={dehydratedState}>
          <Page />
        </HydrationBoundary>
      </Provider>,
    )

    // No loading flash: HydrationBoundary's useMemo populated the cache
    // during the render phase, so `useQuery` reads the value on first paint.
    rendered.getByText('Alice')
    expect(queryFn).not.toHaveBeenCalled()
  })

  it('should be a no-op when state is undefined', () => {
    const scope = fork({ values: [[$queryClient, queryClient]] })
    const rendered = render(
      <Provider value={scope}>
        <HydrationBoundary>
          <span>child</span>
        </HydrationBoundary>
      </Provider>,
    )
    rendered.getByText('child')
  })

  it('should skip hydration when no queryClient is in scope', () => {
    // No $queryClient in scope → no qc available. Should not throw; children render.
    const scope = fork()
    const rendered = render(
      <Provider value={scope}>
        <HydrationBoundary state={{ queries: [], mutations: [] }}>
          <span>child</span>
        </HydrationBoundary>
      </Provider>,
    )
    rendered.getByText('child')
  })
})
