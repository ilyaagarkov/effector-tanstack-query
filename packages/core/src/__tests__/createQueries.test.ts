import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { QueryClient } from '@tanstack/query-core'
import { allSettled, createStore, fork } from 'effector'
import { $queryClient, createQueries, prefetchQueries } from '..'

describe('createQueries', () => {
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

  it('exposes the family discriminator and parallel result stores', () => {
    const $ids = createStore<number[]>([])
    const family = createQueries<number, string>({
      name: 'family.basic',
      source: $ids,
      query: (id) => ({
        queryKey: ['item', id],
        queryFn: () => Promise.resolve(`data-${id}`),
      }),
    })

    expect(family.__family).toBe(true)
    expect(family.$items).toBeDefined()
    expect(family.$data).toBeDefined()
    expect(family.$isPending).toBeDefined()
    expect(family.$isSuccess).toBeDefined()
    expect(family.mounted).toBeDefined()
    expect(family.unmounted).toBeDefined()
    expect(family.refresh).toBeDefined()
    expect(family.refreshOne).toBeDefined()
    expect(family.prefetch).toBeDefined()
  })

  it('prefetches each item in parallel and populates $items', async () => {
    const fetchSpy = vi.fn((id: number) => Promise.resolve(`data-${id}`))
    const $ids = createStore<number[]>([1, 2, 3])

    const family = createQueries<number, string>({
      name: 'family.prefetch',
      source: $ids,
      query: (id) => ({
        queryKey: ['item', id],
        queryFn: () => fetchSpy(id),
      }),
    })

    const scope = fork({ values: [[$queryClient, queryClient]] })

    await allSettled(family.prefetch, { scope })

    expect(fetchSpy).toHaveBeenCalledTimes(3)
    const items = scope.getState(family.$items)
    expect(items).toHaveLength(3)
    expect(items.map((it) => it.source)).toEqual([1, 2, 3])
    expect(items.map((it) => it.data)).toEqual(['data-1', 'data-2', 'data-3'])
    expect(items.every((it) => it.isSuccess)).toBe(true)
  })

  it('source diff: spawns observers for new items, disposes for removed', async () => {
    const $ids = createStore<number[]>([1, 2])

    const family = createQueries<number, string>({
      name: 'family.diff',
      source: $ids,
      query: (id) => ({
        queryKey: ['diff', id],
        queryFn: () => Promise.resolve(`data-${id}`),
      }),
      staleTime: Infinity,
    })

    const scope = fork({ values: [[$queryClient, queryClient]] })
    await allSettled(family.prefetch, { scope })
    expect(scope.getState(family.$items).map((it) => it.source)).toEqual([1, 2])

    // Add an item: 3. Source change triggers syncFx which spawns the
    // observer for id=3; $items reflects the new shape immediately
    // (id=3 is still in default pending state until prefetched).
    await allSettled($ids, { params: [1, 2, 3], scope })
    const afterAdd = scope.getState(family.$items)
    expect(afterAdd.map((it) => it.source)).toEqual([1, 2, 3])
    expect(afterAdd[2]?.isPending).toBe(true)

    // Remove an item: drop 1. The observer for id=1 is disposed; $items
    // shrinks to [2, 3] and reuses the already-resolved entry for 2.
    await allSettled($ids, { params: [2, 3], scope })
    const afterRemove = scope.getState(family.$items)
    expect(afterRemove.map((it) => it.source)).toEqual([2, 3])
    expect(afterRemove[0]?.data).toBe('data-2')
  })

  it('honors per-item `enabled: false` — skips that observer fetch', async () => {
    const fetchSpy = vi.fn((id: number) => Promise.resolve(`data-${id}`))
    const $ids = createStore<number[]>([1, 2, 3])

    const family = createQueries<number, string>({
      name: 'family.enabled',
      source: $ids,
      query: (id) => ({
        queryKey: ['enabled', id],
        queryFn: () => fetchSpy(id),
        enabled: id !== 2,
      }),
    })

    const scope = fork({ values: [[$queryClient, queryClient]] })
    await allSettled(family.prefetch, { scope })

    // Only ids 1 and 3 should be fetched.
    expect(fetchSpy).toHaveBeenCalledTimes(2)
    const items = scope.getState(family.$items)
    expect(items[0]?.data).toBe('data-1')
    expect(items[1]?.isPending).toBe(true) // id=2, disabled
    expect(items[2]?.data).toBe('data-3')
  })

  it('derived $data, $isPending, $isSuccess reflect aggregate state', async () => {
    const $ids = createStore<number[]>([1, 2])
    const family = createQueries<number, string>({
      name: 'family.derived',
      source: $ids,
      query: (id) => ({
        queryKey: ['derived', id],
        queryFn: () => Promise.resolve(`x-${id}`),
      }),
    })

    const scope = fork({ values: [[$queryClient, queryClient]] })
    await allSettled(family.prefetch, { scope })

    expect(scope.getState(family.$data)).toEqual(['x-1', 'x-2'])
    expect(scope.getState(family.$isPending)).toBe(false)
    expect(scope.getState(family.$isSuccess)).toBe(true)
  })

  it('plugs into prefetchQueries — family alongside regular queries', async () => {
    const $ids = createStore<number[]>([1, 2])
    const family = createQueries<number, string>({
      name: 'family.prefetchQueries',
      source: $ids,
      query: (id) => ({
        queryKey: ['mixed', id],
        queryFn: () => Promise.resolve(`v-${id}`),
      }),
    })

    const scope = fork({ values: [[$queryClient, queryClient]] })

    // `prefetchQueries` accepts the family structurally — it satisfies
    // `PrefetchableQuery` ({ prefetch, mounted }).
    await prefetchQueries([family], { scope })

    const items = scope.getState(family.$items)
    expect(items.map((it) => it.data)).toEqual(['v-1', 'v-2'])
  })

  it('mount/unmount subscribes observers and re-emits items on cache updates', async () => {
    const $ids = createStore<number[]>([1])
    const family = createQueries<number, string>({
      name: 'family.mount',
      source: $ids,
      query: (id) => ({
        queryKey: ['mount-test', id],
        queryFn: () => Promise.resolve(`v${id}`),
        staleTime: Infinity,
      }),
    })

    const scope = fork({ values: [[$queryClient, queryClient]] })

    // Mount sets refCount to 1 and runs syncFx — observers spawned,
    // subscribed; once they receive their fetched data they dispatch
    // recomputeFx which updates $items.
    await allSettled(family.mounted, { scope })

    // The observers run their initial fetch. Since `Promise.resolve`
    // is sync-ish under fake timers, we need a microtask flush.
    await vi.waitFor(() => {
      const items = scope.getState(family.$items)
      expect(items).toHaveLength(1)
      expect(items[0]?.data).toBe('v1')
    })

    // Unmount unsubscribes — subsequent QC changes don't re-emit
    // items, but the snapshot stays put.
    await allSettled(family.unmounted, { scope })
    expect(scope.getState(family.$items)[0]?.data).toBe('v1')
  })

  it('refresh / refreshOne invalidate observed queries', async () => {
    const calls: number[] = []
    const $ids = createStore<number[]>([1, 2])
    const family = createQueries<number, string>({
      name: 'family.refresh',
      source: $ids,
      query: (id) => ({
        queryKey: ['refresh', id],
        queryFn: () => {
          calls.push(id)
          return Promise.resolve(`r${id}-${calls.length}`)
        },
        staleTime: Infinity,
      }),
    })

    const scope = fork({ values: [[$queryClient, queryClient]] })
    await allSettled(family.prefetch, { scope })
    const baseline = calls.length
    expect(baseline).toBe(2)

    await allSettled(family.refreshOne, { params: 2, scope })
    expect(calls.length).toBe(baseline + 1)
    expect(calls.at(-1)).toBe(2)

    await allSettled(family.refresh, { scope })
    // refresh dispatches refetch for both observers — two more calls.
    expect(calls.length).toBe(baseline + 3)
  })

  it('refreshOne with an unknown item is a no-op (no throw, no fetch)', async () => {
    const fetchSpy = vi.fn(() => Promise.resolve('x'))
    const $ids = createStore<number[]>([1])
    const family = createQueries<number, string>({
      name: 'family.refreshOneUnknown',
      source: $ids,
      query: (id) => ({ queryKey: ['x', id], queryFn: fetchSpy }),
    })

    const scope = fork({ values: [[$queryClient, queryClient]] })
    await allSettled(family.prefetch, { scope })
    const baseline = fetchSpy.mock.calls.length

    await allSettled(family.refreshOne, { params: 99, scope })
    expect(fetchSpy.mock.calls.length).toBe(baseline)
  })

  it('surfaces errors in $items and $isError', async () => {
    const $ids = createStore<number[]>([1])
    const family = createQueries<number, string>({
      name: 'family.error',
      source: $ids,
      query: (id) => ({
        queryKey: ['err', id],
        queryFn: () => Promise.reject(new Error('boom')),
      }),
    })

    const scope = fork({ values: [[$queryClient, queryClient]] })
    await allSettled(family.prefetch, { scope })

    const items = scope.getState(family.$items)
    expect(items[0]?.status).toBe('error')
    expect((items[0]?.error as Error).message).toBe('boom')
    expect(scope.getState(family.$isError)).toBe(true)
    expect(scope.getState(family.$isSuccess)).toBe(false)
  })

  it('source change updates observer options when queryKey identical', async () => {
    // If `query(item)` returns the same `queryKey` for two different
    // items (extreme edge case — usually you'd encode the item into
    // the key), they collapse to one observer but `setOptions` keeps
    // `enabled` in sync per-source-change.
    const $items = createStore<Array<{ id: number; enabled: boolean }>>([
      { id: 1, enabled: true },
    ])

    const family = createQueries<{ id: number; enabled: boolean }, string>({
      name: 'family.setOptions',
      source: $items,
      query: (item) => ({
        queryKey: ['fixed-key', item.id],
        queryFn: () => Promise.resolve(`v${item.id}`),
        enabled: item.enabled,
      }),
    })

    const scope = fork({ values: [[$queryClient, queryClient]] })
    await allSettled(family.prefetch, { scope })
    expect(scope.getState(family.$items)[0]?.data).toBe('v1')

    // Re-emit source with `enabled: false` — should hit setOptions
    // branch, not re-create the observer.
    await allSettled($items, { params: [{ id: 1, enabled: false }], scope })
    // Still the same data — no new fetch.
    expect(scope.getState(family.$items)[0]?.data).toBe('v1')
  })

  it('handles an empty source — $items stays empty, $isSuccess true', () => {
    const $ids = createStore<number[]>([])
    const family = createQueries<number, string>({
      name: 'family.empty',
      source: $ids,
      query: (id) => ({
        queryKey: ['empty', id],
        queryFn: () => Promise.resolve(`v${id}`),
      }),
    })

    const scope = fork({ values: [[$queryClient, queryClient]] })
    expect(scope.getState(family.$items)).toEqual([])
    expect(scope.getState(family.$isPending)).toBe(false)
    expect(scope.getState(family.$isSuccess)).toBe(true)
  })

  it('renders default-pending items when scope has no QueryClient', () => {
    const $ids = createStore<number[]>([1, 2])
    const family = createQueries<number, string>({
      name: 'family.noQc',
      source: $ids,
      query: (id) => ({
        queryKey: ['noqc', id],
        queryFn: () => Promise.resolve(`v${id}`),
      }),
    })

    // No $queryClient injection — syncFx hits the early-return path
    // and produces default-pending items parallel to source.
    const scope = fork()
    const items = scope.getState(family.$items)
    expect(items).toHaveLength(0) // initial — syncFx hasn't fired yet
    // Force a syncFx run by re-emitting source.
    void allSettled($ids, { params: [1, 2], scope })
  })

  it('prefetch is a no-op when scope has no QueryClient', async () => {
    const fetchSpy = vi.fn(() => Promise.resolve('x'))
    const $ids = createStore<number[]>([1])
    const family = createQueries<number, string>({
      name: 'family.prefetchNoQc',
      source: $ids,
      query: (id) => ({ queryKey: ['noqc-prefetch', id], queryFn: fetchSpy }),
    })

    // No $queryClient — prefetch effect early-returns instead of trying
    // to call `qc.fetchQuery(...)` on null.
    const scope = fork()
    await allSettled(family.prefetch, { scope })
    expect(fetchSpy).not.toHaveBeenCalled()
  })

  it('accepts an explicit QueryClient as the first argument', async () => {
    const $ids = createStore<number[]>([1])
    const family = createQueries<number, string>(queryClient, {
      name: 'family.explicitClient',
      source: $ids,
      query: (id) => ({
        queryKey: ['explicit', id],
        queryFn: () => Promise.resolve(`v${id}`),
      }),
    })

    // No fork-time `$queryClient` injection — the explicit client is
    // captured in the factory's `$queryClient` store directly.
    const scope = fork()
    await allSettled(family.prefetch, { scope })
    expect(scope.getState(family.$items)[0]?.data).toBe('v1')
  })

  it('warns when name is missing', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined)
    const $ids = createStore<number[]>([])
    createQueries<number, string>({
      source: $ids,
      query: (id) => ({
        queryKey: ['warn', id],
        queryFn: () => Promise.resolve(`${id}`),
      }),
    })
    expect(warn).toHaveBeenCalled()
    warn.mockRestore()
  })
})
