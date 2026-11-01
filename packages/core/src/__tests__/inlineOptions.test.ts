import { afterEach, describe, expect, it, vi } from 'vitest'
import { allSettled, createEvent, createStore, fork } from 'effector'
import { QueryClient } from '@tanstack/query-core'
import { createQuery, createInfiniteQuery } from '../index'

const clients: QueryClient[] = []
afterEach(() => {
  for (const client of clients.splice(0)) client.clear()
  vi.useRealTimers()
})

function setup() {
  vi.useFakeTimers()
  const client = new QueryClient({
    defaultOptions: {
      queries: { retry: false, notifyOnChangeProps: ['data'] },
    },
  })
  clients.push(client)
  client.setQueryDefaults(['inline', 1], { staleTime: 111, gcTime: 2222 })
  client.setQueryDefaults(['inline', 2], { staleTime: 333, gcTime: 4444 })
  const changed = createEvent<number>()
  const $id = createStore(1).on(changed, (_, id) => id)
  return { client, changed, $id, scope: fork() }
}

describe('ordinary inline query options', () => {
  it('store interval preserves external options across updates and reapplies key defaults on remount', async () => {
    const { client, changed, $id, scope } = setup()
    const intervalChanged = createEvent<number | false | undefined>()
    const $interval = createStore<number | false | undefined>(false, {
      skipVoid: false,
    }).on(intervalChanged, (_, interval) => interval)
    const options = {
      queryKey: ['inline', $id],
      queryFn: async () => 1,
      refetchInterval: $interval,
      // Existing inline objects may carry unrelated application metadata.
      source: 'metadata',
      query: 'metadata',
    }
    const query = createQuery(client, options)

    await allSettled(query.mounted, { scope })
    // Allow the initial fetch and observer notifications to settle.
    await vi.advanceTimersByTimeAsync(1)
    const observer = scope.getState(query.$observer)
    expect(observer).not.toBeNull()
    if (!observer) throw new Error('Expected an observer after mount')
    expect(observer.options).toMatchObject({
      staleTime: 111,
      gcTime: 2222,
      notifyOnChangeProps: ['data'],
      refetchInterval: false,
    })

    observer.setOptions({
      ...observer.options,
      meta: { owner: 'application' },
    })
    await allSettled(changed, { scope, params: 2 })
    await vi.advanceTimersByTimeAsync(1)
    expect(observer.options).toMatchObject({
      queryKey: ['inline', 2],
      staleTime: 111,
      gcTime: 2222,
      meta: { owner: 'application' },
      notifyOnChangeProps: ['data'],
    })
    await allSettled(intervalChanged, { scope, params: undefined })
    expect(observer.options.refetchInterval).toBeUndefined()

    // A new observer resolves defaults for the current key, unlike an update.
    await allSettled(query.unmounted, { scope })
    await allSettled(query.mounted, { scope })
    expect(scope.getState(query.$observer)?.options).toMatchObject({
      staleTime: 333,
      gcTime: 4444,
      notifyOnChangeProps: ['data'],
    })
    await allSettled(query.unmounted, { scope })
  })

  it('callback interval survives key updates and reapplies key defaults on remount', async () => {
    const { client, changed, $id, scope } = setup()
    const interval = (): false => false
    const options = {
      queryKey: ['inline', $id],
      queryFn: async () => 1,
      refetchInterval: interval,
      // Existing inline objects may carry unrelated application metadata.
      source: 'metadata',
      query: 'metadata',
    }
    const query = createQuery(client, options)

    await allSettled(query.mounted, { scope })
    // Allow the initial fetch and observer notifications to settle.
    await vi.advanceTimersByTimeAsync(1)
    const observer = scope.getState(query.$observer)
    expect(observer).not.toBeNull()
    if (!observer) throw new Error('Expected an observer after mount')
    expect(observer.options).toMatchObject({
      staleTime: 111,
      gcTime: 2222,
      notifyOnChangeProps: ['data'],
      refetchInterval: interval,
    })

    observer.setOptions({
      ...observer.options,
      meta: { owner: 'application' },
    })
    await allSettled(changed, { scope, params: 2 })
    await vi.advanceTimersByTimeAsync(1)
    expect(observer.options).toMatchObject({
      queryKey: ['inline', 2],
      staleTime: 111,
      gcTime: 2222,
      meta: { owner: 'application' },
      notifyOnChangeProps: ['data'],
    })
    expect(observer.options.refetchInterval).toBe(interval)

    // A new observer resolves defaults for the current key, unlike an update.
    await allSettled(query.unmounted, { scope })
    await allSettled(query.mounted, { scope })
    expect(scope.getState(query.$observer)?.options).toMatchObject({
      staleTime: 333,
      gcTime: 4444,
      notifyOnChangeProps: ['data'],
    })
    await allSettled(query.unmounted, { scope })
  })
})

describe('infinite inline query options', () => {
  it('store interval preserves external options across updates and reapplies key defaults on remount', async () => {
    const { client, changed, $id, scope } = setup()
    const intervalChanged = createEvent<number | false | undefined>()
    const $interval = createStore<number | false | undefined>(false, {
      skipVoid: false,
    }).on(intervalChanged, (_, interval) => interval)
    const pageOptions = {
      initialPageParam: 0,
      getNextPageParam: () => undefined,
    }
    const options = {
      queryKey: ['inline', $id],
      queryFn: async () => 1,
      refetchInterval: $interval,
      // Existing inline objects may carry unrelated application metadata.
      source: 'metadata',
      query: 'metadata',
    }
    const query = createInfiniteQuery(client, { ...options, ...pageOptions })

    await allSettled(query.mounted, { scope })
    // Allow the initial fetch and observer notifications to settle.
    await vi.advanceTimersByTimeAsync(1)
    const observer = scope.getState(query.$observer)
    expect(observer).not.toBeNull()
    if (!observer) throw new Error('Expected an observer after mount')
    expect(observer.options).toMatchObject({
      staleTime: 111,
      gcTime: 2222,
      notifyOnChangeProps: ['data'],
      refetchInterval: false,
    })

    // Native .options loses page context for queryFn and persister as well.
    // This fixture supplies queryFn/page options and does not configure a persister.
    const { persister } = observer.options
    if (persister) throw new Error('This fixture must not configure a persister')
    observer.setOptions({
      ...observer.options,
      persister,
      queryFn: options.queryFn,
      ...pageOptions,
      meta: { owner: 'application' },
    })
    await allSettled(changed, { scope, params: 2 })
    await vi.advanceTimersByTimeAsync(1)
    expect(observer.options).toMatchObject({
      queryKey: ['inline', 2],
      staleTime: 111,
      gcTime: 2222,
      meta: { owner: 'application' },
      notifyOnChangeProps: ['data'],
    })
    await allSettled(intervalChanged, { scope, params: undefined })
    expect(observer.options.refetchInterval).toBeUndefined()

    // A new observer resolves defaults for the current key, unlike an update.
    await allSettled(query.unmounted, { scope })
    await allSettled(query.mounted, { scope })
    expect(scope.getState(query.$observer)?.options).toMatchObject({
      staleTime: 333,
      gcTime: 4444,
      notifyOnChangeProps: ['data'],
    })
    await allSettled(query.unmounted, { scope })
  })

  it('callback interval survives key updates and reapplies key defaults on remount', async () => {
    const { client, changed, $id, scope } = setup()
    const interval = (): false => false
    const pageOptions = {
      initialPageParam: 0,
      getNextPageParam: () => undefined,
    }
    const options = {
      queryKey: ['inline', $id],
      queryFn: async () => 1,
      refetchInterval: interval,
      // Existing inline objects may carry unrelated application metadata.
      source: 'metadata',
      query: 'metadata',
    }
    const query = createInfiniteQuery(client, { ...options, ...pageOptions })

    await allSettled(query.mounted, { scope })
    // Allow the initial fetch and observer notifications to settle.
    await vi.advanceTimersByTimeAsync(1)
    const observer = scope.getState(query.$observer)
    expect(observer).not.toBeNull()
    if (!observer) throw new Error('Expected an observer after mount')
    expect(observer.options).toMatchObject({
      staleTime: 111,
      gcTime: 2222,
      notifyOnChangeProps: ['data'],
      refetchInterval: interval,
    })

    // Native .options loses page context for queryFn and persister as well.
    // This fixture supplies queryFn/page options and does not configure a persister.
    const { persister } = observer.options
    if (persister) throw new Error('This fixture must not configure a persister')
    observer.setOptions({
      ...observer.options,
      persister,
      queryFn: options.queryFn,
      ...pageOptions,
      meta: { owner: 'application' },
    })
    await allSettled(changed, { scope, params: 2 })
    await vi.advanceTimersByTimeAsync(1)
    expect(observer.options).toMatchObject({
      queryKey: ['inline', 2],
      staleTime: 111,
      gcTime: 2222,
      meta: { owner: 'application' },
      notifyOnChangeProps: ['data'],
    })
    expect(observer.options.refetchInterval).toBe(interval)

    // A new observer resolves defaults for the current key, unlike an update.
    await allSettled(query.unmounted, { scope })
    await allSettled(query.mounted, { scope })
    expect(scope.getState(query.$observer)?.options).toMatchObject({
      staleTime: 333,
      gcTime: 4444,
      notifyOnChangeProps: ['data'],
    })
    await allSettled(query.unmounted, { scope })
  })
})
