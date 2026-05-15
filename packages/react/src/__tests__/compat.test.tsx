import { describe, it } from 'vitest'
import { render } from '@testing-library/react'
import { Provider } from 'effector-react'
import { allSettled, fork } from 'effector'
import { QueryClient } from '@tanstack/query-core'
import { useQueryClient } from '@tanstack/react-query'
import { $queryClient } from '@effector-tanstack-query/core'
import { QueryClientCompatProvider } from '../compat'

describe('QueryClientCompatProvider (client paths)', () => {
  it("hands the scope's $queryClient to react-query's context", async () => {
    const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
    qc.mount()
    const scope = fork()
    await allSettled($queryClient, { params: qc, scope })

    function Probe() {
      const fromReactQuery = useQueryClient()
      return <span>{fromReactQuery === qc ? 'match' : 'mismatch'}</span>
    }

    const rendered = render(
      <Provider value={scope}>
        <QueryClientCompatProvider>
          <Probe />
        </QueryClientCompatProvider>
      </Provider>,
    )

    rendered.getByText('match')
    qc.clear()
  })

  it('renders children without a provider when scope has no client and not on server', () => {
    // Default jsdom env → isServer is false → serverFallback stays null.
    // Default scope's $queryClient is null. Children should still render.
    const scope = fork()
    const rendered = render(
      <Provider value={scope}>
        <QueryClientCompatProvider>
          <span>child</span>
        </QueryClientCompatProvider>
      </Provider>,
    )
    rendered.getByText('child')
  })
})
