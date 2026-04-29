import { allSettled, fork, serialize } from 'effector'
import { QueryClient, dehydrate, hydrate } from '@tanstack/query-core'
import { queryKey, sleep } from './test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createQuery } from '../createQuery'

// SSR roundtrip strategy:
// - The library's two persistence layers are independent: data lives in the
//   queryClient cache AND in effector stores held by a fork scope.
// - Server: prefetch into queryClient → dehydrate(); mount the query in a
//   server scope → serialize(serverScope).
// - Client: build a fresh queryClient → hydrate() with the dehydrated payload;
//   build a client scope via fork({ values: serialize(...) }).
// - Effector-scope serialization requires a stable `name` on the query so
//   internal stores get deterministic SIDs.

describe('createQuery (SSR)', () => {
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

  it('should fill $data immediately when queryClient is pre-hydrated and staleTime keeps cache fresh', async () => {
    const key = queryKey()
    const userData = { id: 1, name: 'Alice' }

    const serverClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    })
    serverClient.mount()
    await serverClient.prefetchQuery({
      queryKey: key,
      queryFn: () => Promise.resolve(userData),
    })
    const dehydrated = dehydrate(serverClient)
    serverClient.clear()

    hydrate(queryClient, dehydrated)

    const queryFn = vi.fn(() => Promise.resolve({ id: 1, name: 'Stale' }))
    const query = createQuery(queryClient, {
      name: 'userQuery',
      queryKey: key,
      queryFn,
      staleTime: Infinity,
    })

    const scope = fork()
    await allSettled(query.mounted, { scope })

    expect(scope.getState(query.$data)).toEqual(userData)
    expect(scope.getState(query.$status)).toBe('success')
    expect(scope.getState(query.$isFetching)).toBe(false)
    expect(queryFn).not.toHaveBeenCalled()
  })

  it('should background-refetch hydrated data when staleTime has elapsed', async () => {
    const key = queryKey()

    const serverClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    })
    serverClient.mount()
    await serverClient.prefetchQuery({
      queryKey: key,
      queryFn: () => Promise.resolve('server'),
    })
    const dehydrated = dehydrate(serverClient)
    ;(dehydrated.queries[0] as any).state.dataUpdatedAt = Date.now() - 10_000
    serverClient.clear()

    hydrate(queryClient, dehydrated)

    const queryFn = vi
      .fn()
      .mockImplementation(() => sleep(5).then(() => 'client'))

    const query = createQuery<string>(queryClient, {
      name: 'staleQuery',
      queryKey: key,
      queryFn,
      staleTime: 1_000,
    })

    const scope = fork()
    await allSettled(query.mounted, { scope })

    expect(scope.getState(query.$data)).toBe('server')
    expect(scope.getState(query.$isFetching)).toBe(true)

    await vi.advanceTimersByTimeAsync(6)

    expect(queryFn).toHaveBeenCalledTimes(1)
    expect(scope.getState(query.$data)).toBe('client')
    expect(scope.getState(query.$isFetching)).toBe(false)
  })

  it('should restore $data via serialize/fork roundtrip across effector scopes', async () => {
    const key = queryKey()

    const query = createQuery(queryClient, {
      name: 'roundtripQuery',
      queryKey: key,
      queryFn: () => sleep(5).then(() => 'server-data'),
      staleTime: Infinity,
    })

    const serverScope = fork()
    await allSettled(query.mounted, { scope: serverScope })
    await vi.advanceTimersByTimeAsync(6)
    expect(serverScope.getState(query.$data)).toBe('server-data')

    const serialized = serialize(serverScope)
    expect(Object.keys(serialized).length).toBeGreaterThan(0)

    // The $data store key uses the namespaced SID built from the name
    const dataSid = '@tanstack/query-effector.roundtripQuery.$data'
    expect(serialized[dataSid]).toBe('server-data')

    const clientScope = fork({ values: serialized })

    expect(clientScope.getState(query.$data)).toBe('server-data')
    expect(clientScope.getState(query.$status)).toBe('success')
  })

  it('should not call queryFn on the client when both layers are restored and cache is fresh', async () => {
    const key = queryKey()

    const serverClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    })
    serverClient.mount()
    await serverClient.prefetchQuery({
      queryKey: key,
      queryFn: () => Promise.resolve('seeded'),
    })

    const serverQuery = createQuery(serverClient, {
      name: 'fullSsrQuery',
      queryKey: key,
      queryFn: () => Promise.resolve('seeded'),
      staleTime: Infinity,
    })

    const serverScope = fork()
    await allSettled(serverQuery.mounted, { scope: serverScope })

    const dehydratedQc = dehydrate(serverClient)
    const serializedScope = serialize(serverScope)
    serverClient.clear()

    // Sanity: scope payload contains data from name-derived SIDs
    expect(
      serializedScope['@tanstack/query-effector.fullSsrQuery.$data'],
    ).toBe('seeded')

    hydrate(queryClient, dehydratedQc)

    const clientQueryFn = vi.fn(() => Promise.resolve('refetched'))
    const clientQuery = createQuery(queryClient, {
      name: 'fullSsrQuery',
      queryKey: key,
      queryFn: clientQueryFn,
      staleTime: Infinity,
    })

    const clientScope = fork({ values: serializedScope })
    await allSettled(clientQuery.mounted, { scope: clientScope })

    expect(clientScope.getState(clientQuery.$data)).toBe('seeded')
    expect(clientScope.getState(clientQuery.$status)).toBe('success')
    expect(clientQueryFn).not.toHaveBeenCalled()
  })

  it('should silently skip serialization when name is not provided (back-compat)', async () => {
    const key = queryKey()

    // Suppress the dev warning for this assertion
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})

    const query = createQuery(queryClient, {
      queryKey: key,
      queryFn: () => sleep(5).then(() => 'no-name-data'),
      staleTime: Infinity,
    })

    const scope = fork()
    await allSettled(query.mounted, { scope })
    await vi.advanceTimersByTimeAsync(6)
    expect(scope.getState(query.$data)).toBe('no-name-data')

    const serialized = serialize(scope)
    // Without a name, internal stores have no SIDs and are dropped from output
    expect(serialized).toEqual({})

    warnSpy.mockRestore()
  })
})
