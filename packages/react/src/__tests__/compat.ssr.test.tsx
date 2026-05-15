import { describe, expect, it, vi } from 'vitest'

// Force the `isServer` path of `QueryClientCompatProvider` so the server
// fallback `QueryClient` branch is exercised. Must be hoisted (vi.mock is
// auto-hoisted) so the module under test sees the mocked value at import.
vi.mock('@tanstack/react-query', async (importOriginal) => {
  const actual =
    await importOriginal<typeof import('@tanstack/react-query')>()
  return { ...actual, isServer: true }
})

describe('QueryClientCompatProvider (SSR fallback)', () => {
  it('builds a per-render QueryClient when scope has no client and isServer is true', async () => {
    const [{ render }, { Provider }, { fork }, { useQueryClient }, mod] =
      await Promise.all([
        import('@testing-library/react'),
        import('effector-react'),
        import('effector'),
        import('@tanstack/react-query'),
        import('../compat'),
      ])

    const scope = fork() // no $queryClient → fromEffector is null

    let captured: import('@tanstack/query-core').QueryClient | null = null
    function Probe() {
      captured = useQueryClient()
      return <span>ok</span>
    }

    const rendered = render(
      <Provider value={scope}>
        <mod.QueryClientCompatProvider
          defaultOptions={{ queries: { staleTime: 999 } }}
        >
          <Probe />
        </mod.QueryClientCompatProvider>
      </Provider>,
    )

    rendered.getByText('ok')
    // Fallback constructed via the `defaultOptions` we passed in.
    expect(captured).not.toBeNull()
    expect(captured!.getDefaultOptions().queries?.staleTime).toBe(999)
  })
})
