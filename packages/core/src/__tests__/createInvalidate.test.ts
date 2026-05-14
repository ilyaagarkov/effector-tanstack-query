import { allSettled, createEvent, createStore, fork, scopeBind } from 'effector'
import { QueryClient } from '@tanstack/query-core'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createInvalidate } from '../createInvalidate'
import { createQuery } from '../createQuery'
import { $queryClient } from '../queryClient'
import { queryKey, sleep } from './test-utils'

describe('createInvalidate', () => {
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

  it('invalidates a static-key query and triggers a refetch', async () => {
    const key = queryKey()
    let runs = 0
    const query = createQuery(queryClient, {
      name: 'inv.static',
      queryKey: key,
      queryFn: () => sleep(5).then(() => `r-${++runs}`),
      staleTime: Infinity,
    })

    const invalidate = createInvalidate(queryClient, { queryKey: key })

    query.mounted()
    await vi.advanceTimersByTimeAsync(6)
    expect(query.$data.getState()).toBe('r-1')

    invalidate()
    await vi.advanceTimersByTimeAsync(6)
    expect(query.$data.getState()).toBe('r-2')
  })

  it('resolves a reactive queryKey at invocation time', async () => {
    const setId = createEvent<number>()
    const $id = createStore(1).on(setId, (_, v) => v)

    let lastFetched: number | null = null
    const query = createQuery(queryClient, {
      name: 'inv.reactive',
      queryKey: ['user', $id],
      queryFn: ({ queryKey: qk }) =>
        sleep(5).then(() => {
          lastFetched = qk[1] as number
          return qk[1]
        }),
      staleTime: Infinity,
    })

    const invalidate = createInvalidate(queryClient, {
      queryKey: ['user', $id],
    })

    query.mounted()
    await vi.advanceTimersByTimeAsync(6)
    expect(lastFetched).toBe(1)

    // Change the reactive key — query refetches with id=2.
    setId(2)
    await vi.advanceTimersByTimeAsync(6)
    expect(lastFetched).toBe(2)

    // Invalidate without changing the key — refetches with the current id (2).
    invalidate()
    await vi.advanceTimersByTimeAsync(6)
    expect(lastFetched).toBe(2)
  })

  it('honors `exact: false` to invalidate by key prefix', async () => {
    let aRuns = 0
    let bRuns = 0

    const qA = createQuery(queryClient, {
      name: 'inv.prefix.a',
      queryKey: ['user', 1],
      queryFn: () => sleep(5).then(() => `a-${++aRuns}`),
      staleTime: Infinity,
    })
    const qB = createQuery(queryClient, {
      name: 'inv.prefix.b',
      queryKey: ['user', 2],
      queryFn: () => sleep(5).then(() => `b-${++bRuns}`),
      staleTime: Infinity,
    })

    qA.mounted()
    qB.mounted()
    await vi.advanceTimersByTimeAsync(6)
    expect(aRuns).toBe(1)
    expect(bRuns).toBe(1)

    const invalidateAll = createInvalidate(queryClient, {
      queryKey: ['user'],
      exact: false,
    })

    invalidateAll()
    await vi.advanceTimersByTimeAsync(6)
    expect(aRuns).toBe(2)
    expect(bRuns).toBe(2)
  })

  it('per-scope isolation under fork({ values })', async () => {
    const qcA = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    })
    qcA.mount()
    const qcB = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    })
    qcB.mount()

    let aRuns = 0
    let bRuns = 0

    // Default-client query (resolves via $queryClient) and invalidate event —
    // each scope sees its own client.
    const query = createQuery({
      name: 'inv.scope',
      queryKey: ['k'],
      queryFn: () =>
        sleep(5).then(() => {
          // Runs against whichever scope's qc the query is bound to.
          return 'ok'
        }),
      staleTime: Infinity,
    })
    const invalidate = createInvalidate({ queryKey: ['k'] })

    // Per-scope spies: each qc gets its own observer for tracking refetches.
    const subA = qcA.getQueryCache().subscribe((e) => {
      if (e.type === 'updated' && e.action.type === 'fetch') aRuns++
    })
    const subB = qcB.getQueryCache().subscribe((e) => {
      if (e.type === 'updated' && e.action.type === 'fetch') bRuns++
    })

    const scopeA = fork({ values: [[$queryClient, qcA]] })
    const scopeB = fork({ values: [[$queryClient, qcB]] })

    await allSettled(query.mounted, { scope: scopeA })
    await allSettled(query.mounted, { scope: scopeB })
    await vi.advanceTimersByTimeAsync(6)
    const aAfterMount = aRuns
    const bAfterMount = bRuns
    expect(aAfterMount).toBeGreaterThan(0)
    expect(bAfterMount).toBeGreaterThan(0)

    // Invalidate in scope A only — only qcA should refetch.
    //
    // We use scopeBind instead of `allSettled(invalidate, { scope })` because
    // invalidateFx returns the Promise from qc.invalidateQueries — which only
    // resolves after the triggered refetches complete. Under fake timers we
    // need to advance the clock before that can happen, so we fire-and-forget
    // and observe side effects via the cache subscription.
    scopeBind(invalidate, { scope: scopeA })()
    await vi.advanceTimersByTimeAsync(6)
    expect(aRuns).toBeGreaterThan(aAfterMount)
    expect(bRuns).toBe(bAfterMount)

    subA()
    subB()
    qcA.clear()
    qcB.clear()
  })

  it('forwards `refetchType` and `type` filter options to invalidateQueries', async () => {
    const key = queryKey()
    const spy = vi.spyOn(queryClient, 'invalidateQueries')
    const invalidate = createInvalidate(queryClient, {
      queryKey: key,
      refetchType: 'active',
      type: 'all',
    })

    const scope = fork()
    await allSettled(invalidate, { scope })

    expect(spy).toHaveBeenCalledWith(
      expect.objectContaining({
        queryKey: key,
        refetchType: 'active',
        type: 'all',
      }),
    )
    spy.mockRestore()
  })

  it('is a safe no-op when no QueryClient is set in scope or as default', async () => {
    // Single-arg form — falls back to $queryClient. Fresh scope, no client
    // injection → invalidateFx hits the `if (!qc) return` early path.
    const invalidate = createInvalidate({ queryKey: ['nothing'] })
    const scope = fork()

    await allSettled(invalidate, { scope })
    // Nothing throws; nothing fires. Reaching this line is the assertion.
    expect(true).toBe(true)
  })
})
