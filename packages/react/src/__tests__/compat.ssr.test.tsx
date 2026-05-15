// @vitest-environment node
//
// Node env (no jsdom) means `typeof window === 'undefined'` is genuinely
// true at module load, so `isServer` from `@tanstack/react-query`
// evaluates to `true` without any mocking. Deterministic in cold-start
// CI runs (unlike `vi.mock` with an async factory, which can race the
// import graph).
import { describe, expect, it } from 'vitest'
import { renderToString } from 'react-dom/server'
import { Provider } from 'effector-react'
import { fork } from 'effector'
import { useQueryClient } from '@tanstack/react-query'
import type { QueryClient } from '@tanstack/query-core'
import { QueryClientCompatProvider } from '../compat'

describe('QueryClientCompatProvider (SSR fallback)', () => {
  it('builds a per-render QueryClient when scope has no client and isServer is true', () => {
    const scope = fork() // no $queryClient → useUnit returns null

    let captured: QueryClient | null = null
    function Probe() {
      captured = useQueryClient()
      return null
    }

    renderToString(
      <Provider value={scope}>
        <QueryClientCompatProvider
          defaultOptions={{ queries: { staleTime: 999 } }}
        >
          <Probe />
        </QueryClientCompatProvider>
      </Provider>,
    )

    expect(captured).not.toBeNull()
    expect(captured!.getDefaultOptions().queries?.staleTime).toBe(999)
  })
})
