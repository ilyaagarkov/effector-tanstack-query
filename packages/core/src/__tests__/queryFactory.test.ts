import {
  allSettled,
  combine,
  createEvent,
  createStore,
  fork,
  sample,
  serialize,
} from 'effector'
import { QueryClient, skipToken } from '@tanstack/query-core'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  $queryClient,
  createQuery,
  prefetchQueries,
  queryOptions,
} from '../index'

describe('createQuery factory form', () => {
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

  it('uses factory options when an optional top-level key is explicitly undefined', async () => {
    const query = createQuery(client, {
      source: createStore(7),
      query: (id) => ({ queryKey: ['optional-key', id], queryFn: () => id }),
      queryKey: undefined,
    })
    const scope = fork()
    await allSettled(query.prefetch, { scope })
    await allSettled(query.mounted, { scope })
    expect(client.getQueryData(['optional-key', 7])).toBe(7)
    expect(scope.getState(query.$data)).toBe(7)
  })

  it('resolves one coherent options object per source transaction, including nested keys', async () => {
    const changed = createEvent<number>()
    const $id = createStore(1).on(changed, (_, id) => id)
    const $label = $id.map((id) => `todo-${id}`)
    const calls: unknown[] = []
    const query = createQuery(client, {
      name: 'factory.coherent',
      source: { id: $id, label: $label },
      query: ({ id, label }) => ({
        queryKey: ['todo', { id, filters: { label } }],
        queryFn: () => {
          calls.push({ id, label })
          return { id, label }
        },
      }),
    })
    const scope = fork()
    await allSettled(query.mounted, { scope })
    await allSettled(changed, { scope, params: 2 })
    await vi.advanceTimersByTimeAsync(1)
    expect(calls).toEqual([
      { id: 1, label: 'todo-1' },
      { id: 2, label: 'todo-2' },
    ])
    expect(scope.getState(query.$data)).toEqual({ id: 2, label: 'todo-2' })
  })

  it('updates selection without fetching, then refreshes using the latest same-key queryFn', async () => {
    const changed = createEvent<number>()
    const $factor = createStore(1).on(changed, (_, n) => n)
    const calls: number[] = []
    const query = createQuery(client, {
      source: $factor,
      query: (factor: number) => ({
        queryKey: ['projection'],
        staleTime: Infinity,
        queryFn: () => {
          calls.push(factor)
          return 10 * factor
        },
        select: (value: number) => value * factor,
      }),
    })
    const scope = fork()
    const $finished = createStore<number[]>([]).on(
      query.finished.success,
      (values, value) => [...values, value],
    )
    await allSettled(query.mounted, { scope })
    const beforeSelect = scope.getState($finished)
    await allSettled(changed, { scope, params: 2 })
    expect(scope.getState(query.$data)).toBe(20)
    expect(calls).toEqual([1])
    expect(scope.getState($finished)).toEqual(beforeSelect)
    await vi.advanceTimersByTimeAsync(1)
    await allSettled(query.refresh, { scope })
    expect(scope.getState(query.$data)).toBe(40)
    expect(client.getQueryData(['projection'])).toBe(20)
    expect(calls).toEqual([1, 2])
    expect(scope.getState($finished).at(-1)).toBe(40)
  })

  it('shares ownership and cancels the old source request and the last unmounted request', async () => {
    const changed = createEvent<number>()
    const $id = createStore(1).on(changed, (_, id) => id)
    const signals: AbortSignal[] = []
    const query = createQuery(client, {
      source: $id,
      query: (id) => ({
        queryKey: ['abort', id],
        queryFn: ({ signal }) => {
          signals.push(signal)
          return new Promise<number>((_, reject) =>
            signal.addEventListener('abort', () =>
              reject(new Error('aborted')),
            ),
          )
        },
      }),
    })
    const scope = fork()
    await allSettled(query.mounted, { scope })
    await allSettled(query.mounted, { scope })
    await allSettled(query.unmounted, { scope })
    expect(signals).toHaveLength(1)
    expect(signals[0]!.aborted).toBe(false)
    await allSettled(changed, { scope, params: 2 })
    expect(signals[0]!.aborted).toBe(true)
    expect(signals[1]!.aborted).toBe(false)
    await allSettled(query.unmounted, { scope })
    expect(signals[1]!.aborted).toBe(true)
  })

  it('awaits factory prefetch triggered by sample using the updated source', async () => {
    const opened = createEvent<number>()
    const $id = createStore(1).on(opened, (_, id) => id)
    const query = createQuery(client, {
      source: $id,
      query: (id) => ({ queryKey: ['awaited', id], queryFn: async () => id }),
    })
    sample({ clock: opened, target: query.prefetch })
    await allSettled(opened, { scope: fork(), params: 7 })
    expect(client.getQueryData(['awaited', 7])).toBe(7)
    expect(client.getQueryData(['awaited', 1])).toBeUndefined()
  })

  it('drops obsolete factory fields and resolves defaults for the new key', async () => {
    const changed = createEvent<boolean>()
    const $first = createStore(true).on(changed, (_, v) => v)
    client.setQueryDefaults(['second'], { staleTime: 123, retry: 2 })
    const query = createQuery(client, {
      source: $first,
      query: (first) => ({
        queryKey: [first ? 'first' : 'second'],
        queryFn: () => 5,
        ...(first
          ? {
              select: (n: number) => n * 2,
              staleTime: Infinity,
              retry: false as const,
              meta: { first: true },
            }
          : {}),
      }),
    })
    const scope = fork()
    await allSettled(query.mounted, { scope })
    expect(scope.getState(query.$data)).toBe(10)
    await allSettled(changed, { scope, params: false })
    await vi.advanceTimersByTimeAsync(1)
    const options = scope.getState(query.$observer)!.options
    expect(options.select).toBeUndefined()
    expect(options.meta).toBeUndefined()
    expect(options.staleTime).toBe(123)
    expect(options.retry).toBe(2)
    expect(scope.getState(query.$data)).toBe(5)
  })

  it('uses boolean overrides and readonly combine stores for derived enabled', async () => {
    const changed = createEvent<boolean>()
    const $ready = createStore(false).on(changed, (_, v) => v)
    const $enabled = combine({ ready: $ready }, ({ ready }) => ready)
    const queryFn = vi.fn(() => 1)
    const query = createQuery(client, {
      source: {},
      query: () => ({ queryKey: ['enabled'], queryFn, enabled: false }),
      enabled: $enabled,
    })
    const scope = fork()
    await allSettled(query.prefetch, { scope })
    await allSettled(query.mounted, { scope })
    expect(queryFn).not.toHaveBeenCalled()
    await allSettled(changed, { scope, params: true })
    expect(queryFn).toHaveBeenCalledTimes(1)
    expect(scope.getState(query.$data)).toBe(1)
  })

  it('inherits factory enabled and lets an explicit false suppress prefetch', async () => {
    const queryFn = vi.fn(() => 1)
    const $enabled = createStore(false)
    const inherited = createQuery(client, {
      source: $enabled,
      query: (enabled) => ({ queryKey: ['inherited'], queryFn, enabled }),
    })
    const overridden = createQuery(client, {
      source: {},
      enabled: false,
      query: () => ({ queryKey: ['overridden'], queryFn, enabled: true }),
    })
    const scope = fork()
    await allSettled(inherited.prefetch, { scope })
    await allSettled(overridden.prefetch, { scope })
    expect(queryFn).not.toHaveBeenCalled()
  })

  it('rejects an actual enabled callback unless overridden with a boolean', async () => {
    const factory = () =>
      queryOptions({
        queryKey: ['callback'],
        queryFn: () => 1,
        enabled: () => true,
      })
    expect(() => createQuery(client, { source: {}, query: factory })).toThrow(
      'Use combine',
    )
    const query = createQuery(client, {
      source: {},
      query: factory,
      enabled: true,
    })
    const scope = fork()
    await allSettled(query.prefetch, { scope })
    expect(client.getQueryData(['callback'])).toBe(1)
  })

  it('resolves a disabled factory and handles skipToken without fetching', async () => {
    const queryFn = vi.fn(() => 1)
    const $id = createStore<number | null>(null)
    const query = createQuery(client, {
      source: $id,
      query: (id) =>
        queryOptions({
          queryKey: ['skip', id],
          queryFn: id === null ? skipToken : queryFn,
        }),
    })
    const scope = fork()
    await allSettled(query.prefetch, { scope })
    await allSettled(query.mounted, { scope })
    await allSettled(query.refresh, { scope })
    expect(queryFn).not.toHaveBeenCalled()
    expect(scope.getState(query.$fetchStatus)).toBe('idle')
  })

  it.each(['factory', 'defaults'] as const)(
    'inherits polling from %s when an override becomes undefined',
    async (origin) => {
      if (origin === 'defaults')
        client.setDefaultOptions({ queries: { refetchInterval: 20 } })
      const intervalChanged = createEvent<number | false | undefined>()
      const $interval = createStore<number | false | undefined>(false, {
        skipVoid: false,
      }).on(intervalChanged, (_, v) => v)
      const queryFn = vi.fn(() => 1)
      const query = createQuery(client, {
        source: {},
        refetchInterval: $interval,
        query: () => ({
          queryKey: ['poll'],
          queryFn,
          ...(origin === 'factory' ? { refetchInterval: 20 } : {}),
        }),
      })
      const scope = fork()
      await allSettled(query.mounted, { scope })
      await vi.advanceTimersByTimeAsync(25)
      expect(queryFn).toHaveBeenCalledTimes(1)
      await allSettled(intervalChanged, { scope, params: undefined })
      await vi.advanceTimersByTimeAsync(21)
      expect(queryFn).toHaveBeenCalledTimes(2)
      await allSettled(intervalChanged, { scope, params: false })
      await vi.advanceTimersByTimeAsync(25)
      expect(queryFn).toHaveBeenCalledTimes(2)
    },
  )

  it('uses current scoped factory closures for SSR and respects an explicit client', async () => {
    const $id = createStore(1, { sid: 'factory.id' })
    const options = (id: number) =>
      queryOptions({
        queryKey: ['scoped', id],
        queryFn: async () => id,
        staleTime: Infinity,
      })
    const query = createQuery({
      name: 'factory.ssr',
      source: $id,
      query: options,
    })
    const other = new QueryClient()
    const a = fork({
      values: [
        [$id, 2],
        [$queryClient, client],
      ],
    })
    const b = fork({
      values: [
        [$id, 3],
        [$queryClient, other],
      ],
    })
    await Promise.all([
      prefetchQueries([query], { scope: a }),
      prefetchQueries([query], { scope: b }),
    ])
    expect(a.getState(query.$data)).toBe(2)
    expect(b.getState(query.$data)).toBe(3)
    expect(client.getQueryData(['scoped', 3])).toBeUndefined()
    expect(other.getQueryData(['scoped', 2])).toBeUndefined()
    const hydrated = fork({ values: serialize(b) })
    expect(hydrated.getState(query.$data)).toBe(3)
    const explicit = createQuery(client, { source: $id, query: options })
    await allSettled(explicit.prefetch, { scope: b })
    expect(client.getQueryData(['scoped', 3])).toBe(3)
    other.clear()
  })

  it('keeps status notifications with a data-only factory/default filter without mutating options', async () => {
    client.setDefaultOptions({
      queries: { notifyOnChangeProps: ['data'], retry: false },
    })
    const data = { id: 1 }
    const options = Object.freeze(
      queryOptions({
        queryKey: ['notifications'],
        staleTime: Infinity,
        initialData: data,
        notifyOnChangeProps: ['data'],
        queryFn: () =>
          new Promise<typeof data>((resolve) =>
            setTimeout(() => resolve(data), 10),
          ),
      }),
    )
    const query = createQuery(client, { source: {}, query: () => options })
    const scope = fork()
    await allSettled(query.mounted, { scope })
    const refreshing = allSettled(query.refresh, { scope })
    expect(scope.getState(query.$isFetching)).toBe(true)
    await vi.advanceTimersByTimeAsync(11)
    await refreshing
    expect(scope.getState(query.$isFetching)).toBe(false)
    expect(options.notifyOnChangeProps).toEqual(['data'])
    expect(client.getDefaultOptions().queries?.notifyOnChangeProps).toEqual([
      'data',
    ])
  })
})
