import {
  allSettled,
  createEffect,
  createEvent,
  createStore,
  fork,
  sample,
} from 'effector'
import { QueryClient } from '@tanstack/query-core'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createInfiniteQuery, createQuery } from '../index'
import { tanstackAtLeast } from './tanstackVersion'

// Resolves to 'timeout' instead of hanging the test run.
function settledWithin(promise: Promise<unknown>, ms = 1000) {
  return Promise.race([
    promise.then(
      () => 'settled',
      () => 'settled',
    ),
    new Promise<'timeout'>((resolve) =>
      setTimeout(() => resolve('timeout'), ms),
    ),
  ])
}

// An unrelated async effect in a fresh scope. It settles only while the
// effector kernel is healthy.
function unrelatedAsyncWork() {
  const run = createEvent()
  sample({
    clock: run,
    target: createEffect(
      () => new Promise((resolve) => setTimeout(resolve, 1)),
    ),
  })
  return settledWithin(allSettled(run, { scope: fork() }))
}

const flush = () => new Promise((resolve) => setTimeout(resolve, 0))

describe('factory errors', () => {
  let client: QueryClient
  beforeEach(() => {
    client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
    client.mount()
  })
  afterEach(() => {
    client.unmount()
    client.clear()
  })

  it('reports a factory exception on update as the query error and recovers', async () => {
    const changed = createEvent<number>()
    const $id = createStore(1).on(changed, (_, id) => id)
    const invalid = new Error('invalid id')
    const query = createQuery(client, {
      name: 'factoryErrors.update',
      source: $id,
      query: (id: number) => {
        if (id < 0) throw invalid
        return { queryKey: ['todo', id], queryFn: () => id }
      },
    })
    const scope = fork()
    const $failures = createStore<unknown[]>([]).on(
      query.finished.failure,
      (list, error) => [...list, error],
    )

    await allSettled(query.mounted, { scope })
    await flush()
    expect(scope.getState(query.$data)).toBe(1)

    await allSettled(changed, { scope, params: -1 })
    expect(scope.getState(query.$status)).toBe('error')
    expect(scope.getState(query.$error)).toBe(invalid)
    expect(scope.getState(query.$data)).toBeUndefined()
    expect(scope.getState(query.$isFetching)).toBe(false)
    expect(scope.getState(query.$observer)).toBeNull()
    expect(scope.getState($failures)).toEqual([invalid])

    // A cache update for the previous parameters must not leak back in.
    client.setQueryData(['todo', 1], 100)
    expect(scope.getState(query.$data)).toBeUndefined()

    await allSettled(changed, { scope, params: 2 })
    await flush()
    expect(scope.getState(query.$status)).toBe('success')
    expect(scope.getState(query.$error)).toBeNull()
    expect(scope.getState(query.$data)).toBe(2)
    expect(scope.getState(query.$observer)?.options.queryKey).toEqual([
      'todo',
      2,
    ])
  })

  it('keeps other scopes working after a factory throws while a scope initializes', async () => {
    const $id = createStore<number | null>(1, { sid: 'factoryErrors.id' })
    const query = createQuery(client, {
      name: 'factoryErrors.scope',
      source: $id,
      query: (id: number | null) => ({
        queryKey: ['todo', id!.toFixed(0)],
        queryFn: () => id,
      }),
    })

    // Neither call may throw out of allSettled: the failure belongs to the
    // query, not to the effector kernel.
    const failing = fork({ values: [[$id, null]] })
    await expect(
      allSettled(query.prefetch, { scope: failing }),
    ).resolves.toBeUndefined()
    await expect(
      allSettled(query.mounted, { scope: failing }),
    ).resolves.toBeUndefined()
    expect(failing.getState(query.$status)).toBe('error')
    expect(failing.getState(query.$error)).toBeInstanceOf(TypeError)
    expect(client.getQueryCache().getAll()).toHaveLength(0)

    const nextRequest = fork({ values: [[$id, 5]] })
    expect(
      await settledWithin(allSettled(query.prefetch, { scope: nextRequest })),
    ).toBe('settled')
    expect(client.getQueryData(['todo', '5'])).toBe(5)
    expect(await unrelatedAsyncWork()).toBe('settled')
  })

  it('does not invalidate other queries when refreshing a failing factory', async () => {
    const other = vi.fn(() => 'other')
    const healthy = createQuery(client, {
      name: 'factoryErrors.healthy',
      queryKey: ['healthy'],
      queryFn: other,
    })
    const failing = createQuery(client, {
      name: 'factoryErrors.refresh',
      source: {},
      query: (): { queryKey: string[]; queryFn: () => number } => {
        throw new Error('broken factory')
      },
    })
    const scope = fork()
    await allSettled(healthy.mounted, { scope })
    await allSettled(failing.mounted, { scope })
    await flush()
    expect(other).toHaveBeenCalledTimes(1)

    await allSettled(failing.refresh, { scope })
    await flush()
    expect(other).toHaveBeenCalledTimes(1)
  })

  // TanStack Query 5.48.0+: observers evaluate a callback `enabled`.
  it.skipIf(!tanstackAtLeast('5.48.0'))('applies an enabled callback that appears after a source update', async () => {
    const changed = createEvent<number>()
    const $id = createStore(1).on(changed, (_, id) => id)
    const query = createQuery(client, {
      name: 'factoryErrors.callback',
      source: $id,
      query: (id: number) => ({
        queryKey: ['callback', id],
        queryFn: () => id,
        enabled: id === 1 ? true : () => true,
      }),
    })
    const scope = fork()
    await allSettled(query.mounted, { scope })
    await allSettled(changed, { scope, params: 2 })
    await flush()
    expect(scope.getState(query.$observer)?.options.queryKey).toEqual([
      'callback',
      2,
    ])
    expect(scope.getState(query.$data)).toBe(2)
  })

  it('reports an infinite factory exception and clears page state', async () => {
    const changed = createEvent<number>()
    const $id = createStore(1).on(changed, (_, id) => id)
    const query = createInfiniteQuery(client, {
      name: 'factoryErrors.infinite',
      source: $id,
      query: (id: number) => {
        if (id < 0) throw new Error('invalid id')
        return {
          queryKey: ['pages', id],
          initialPageParam: 0,
          queryFn: ({ pageParam }: { pageParam: number }) => pageParam,
          getNextPageParam: (last: number) => last + 1,
        }
      },
    })
    const scope = fork()
    await allSettled(query.mounted, { scope })
    await flush()
    expect(scope.getState(query.$hasNextPage)).toBe(true)

    await allSettled(changed, { scope, params: -1 })
    expect(scope.getState(query.$status)).toBe('error')
    expect(scope.getState(query.$data)).toBeUndefined()
    expect(scope.getState(query.$hasNextPage)).toBe(false)
    await allSettled(query.fetchNextPage, { scope })
    expect(scope.getState(query.$status)).toBe('error')
  })
})
