import { allSettled, fork } from 'effector'
import { QueryClient } from '@tanstack/query-core'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createQuery } from '../createQuery'
import { createMutation } from '../createMutation'
import { createInfiniteQuery } from '../createInfiniteQuery'
import { $queryClient, setQueryClient } from '../queryClient'
import { queryKey, sleep } from './test-utils'

// $queryClient default-client behavior:
// - When no client is passed to a factory, it reads from the global
//   $queryClient store. Under fork({ values: [[$queryClient, qc]] }) every
//   scope gets its own client → its own per-scope Observer.
// - Explicit-client factories ignore $queryClient: the explicit one wins.

describe('$queryClient default queryClient', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('uses the QueryClient from setQueryClient when factory is called without one (no fork)', async () => {
    const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
    qc.mount()
    setQueryClient(qc)

    const key = queryKey()
    const query = createQuery<string>({
      name: 'defaultClientUser',
      queryKey: key,
      queryFn: () => sleep(5).then(() => 'global'),
    })

    query.mounted()
    await vi.advanceTimersByTimeAsync(6)

    expect(query.$data.getState()).toBe('global')
    qc.clear()
    // Reset for next test
    setQueryClient(null as unknown as QueryClient)
  })

  it('isolates per-scope queryClient via fork({ values })', async () => {
    const qcA = new QueryClient({ defaultOptions: { queries: { retry: false } } })
    qcA.mount()
    qcA.setQueryData(['shared'], 'from-A')

    const qcB = new QueryClient({ defaultOptions: { queries: { retry: false } } })
    qcB.mount()
    qcB.setQueryData(['shared'], 'from-B')

    const query = createQuery<string>({
      name: 'perScopeQuery',
      queryKey: ['shared'],
      queryFn: () => sleep(5).then(() => 'fresh'),
      staleTime: Infinity,
    })

    const scopeA = fork({ values: [[$queryClient, qcA]] })
    const scopeB = fork({ values: [[$queryClient, qcB]] })

    await allSettled(query.mounted, { scope: scopeA })
    await allSettled(query.mounted, { scope: scopeB })

    expect(scopeA.getState(query.$data)).toBe('from-A')
    expect(scopeB.getState(query.$data)).toBe('from-B')

    // Per-scope observers are distinct instances bound to their own qc.
    const obsA = scopeA.getState(query.$observer)
    const obsB = scopeB.getState(query.$observer)
    expect(obsA).not.toBe(obsB)
    expect(obsA).not.toBeNull()
    expect(obsB).not.toBeNull()

    qcA.clear()
    qcB.clear()
  })

  it('explicit-client factory ignores $queryClient overrides', async () => {
    const explicit = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    })
    explicit.mount()
    explicit.setQueryData(['shared'], 'explicit')

    const other = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    })
    other.mount()
    other.setQueryData(['shared'], 'other')

    const query = createQuery<string>(explicit, {
      name: 'explicitWins',
      queryKey: ['shared'],
      queryFn: () => sleep(5).then(() => 'fresh'),
      staleTime: Infinity,
    })

    // fork() values try to override $queryClient — must not affect explicit
    // because $effectiveClient is a brand-new store, not the global one.
    const scope = fork({ values: [[$queryClient, other]] })
    await allSettled(query.mounted, { scope })

    expect(scope.getState(query.$data)).toBe('explicit')

    explicit.clear()
    other.clear()
  })

  it('createMutation uses per-scope $queryClient via fork values', async () => {
    const qc = new QueryClient({
      defaultOptions: { mutations: { retry: false } },
    })
    qc.mount()

    const mutation = createMutation<string, Error, string>({
      name: 'defaultClientMutation',
      mutationFn: (text) => sleep(5).then(() => text.toUpperCase()),
    })

    const scope = fork({ values: [[$queryClient, qc]] })
    await allSettled(mutation.start, { scope })
    await allSettled(mutation.mutate, { scope, params: 'hi' })
    await vi.advanceTimersByTimeAsync(6)

    expect(scope.getState(mutation.$data)).toBe('HI')

    qc.clear()
  })

  it('createInfiniteQuery uses per-scope $queryClient via fork values', async () => {
    const qc = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    })
    qc.mount()

    const query = createInfiniteQuery<number, Error, number>({
      name: 'defaultClientInfinite',
      queryKey: ['inf'],
      queryFn: ({ pageParam }: { pageParam: any }) =>
        sleep(5).then(() => pageParam),
      getNextPageParam: (last: number) => last + 1,
      initialPageParam: 0,
    })

    const scope = fork({ values: [[$queryClient, qc]] })
    await allSettled(query.mounted, { scope })
    await vi.advanceTimersByTimeAsync(6)

    expect(scope.getState(query.$status)).toBe('success')
    expect(scope.getState(query.$hasNextPage)).toBe(true)

    qc.clear()
  })

  it('rejects mountFx when no QueryClient is set in scope', async () => {
    const query = createQuery({
      name: 'noClientErr',
      queryKey: ['err'],
      queryFn: () => sleep(1).then(() => 'x'),
    })

    const scope = fork()
    const result = await allSettled(query.mounted, { scope })
    // mountFx threw — observer never populated.
    expect(scope.getState(query.$observer)).toBeNull()
    // The fx-level rejection is captured but doesn't fail the test scope.
    void result
  })
})
