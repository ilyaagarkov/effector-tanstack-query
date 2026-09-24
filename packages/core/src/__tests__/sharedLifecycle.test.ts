import { allSettled, createEvent, createStore, fork } from 'effector'
import type { EventCallable, Scope, Store } from 'effector'
import { QueryClient } from '@tanstack/query-core'
import type { QueryKey } from '@tanstack/query-core'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createQuery } from '../createQuery'
import { createInfiniteQuery } from '../createInfiniteQuery'
import type { EffectorQueryKey } from '../types'
import { queryKey } from './test-utils'

// Shared lifecycle (issue #19): a query model's observer is owned by every
// consumer that called `mounted()` in a scope. It's created on the first
// mount (0 → 1) and destroyed only on the last unmount (1 → 0).

interface Model {
  $data: Store<unknown>
  $observer: Store<{
    subscribe: (...args: Array<any>) => unknown
    destroy: () => void
    options: { queryKey: QueryKey }
  } | null>
  mounted: EventCallable<void>
  unmounted: EventCallable<void>
}

interface Variant {
  name: string
  /** Builds a model whose queryFn resolves to the last queryKey segment. */
  create: (qc: QueryClient, key: EffectorQueryKey) => Model
  /** Fetches into the cache so mounted observers receive a result. */
  fetch: (qc: QueryClient, key: QueryKey) => Promise<unknown>
  set: (qc: QueryClient, key: QueryKey, value: string | number) => void
  read: (scope: Scope, model: Model) => unknown
}

const lastSegment = (key: QueryKey) => key[key.length - 1]

const variants: Array<Variant> = [
  {
    name: 'createQuery',
    create: (qc, key) =>
      createQuery(qc, {
        queryKey: key,
        queryFn: ({ queryKey: qk }) => Promise.resolve(lastSegment(qk)),
        staleTime: Infinity,
      }) as unknown as Model,
    fetch: (qc, key) =>
      qc.fetchQuery({
        queryKey: key,
        queryFn: () => Promise.resolve(lastSegment(key)),
      }),
    set: (qc, key, value) => qc.setQueryData(key, value),
    read: (scope, model) => scope.getState(model.$data),
  },
  {
    name: 'createInfiniteQuery',
    create: (qc, key) =>
      createInfiniteQuery<unknown, Error, number>(qc, {
        queryKey: key,
        queryFn: ({ queryKey: qk }) => Promise.resolve(lastSegment(qk)),
        initialPageParam: 0,
        getNextPageParam: () => undefined,
        staleTime: Infinity,
      }) as unknown as Model,
    fetch: (qc, key) =>
      qc.fetchInfiniteQuery({
        queryKey: key,
        queryFn: () => Promise.resolve(lastSegment(key)),
        initialPageParam: 0,
      }),
    set: (qc, key, value) =>
      qc.setQueryData(key, { pages: [value], pageParams: [0] }),
    read: (scope, model) =>
      (scope.getState(model.$data) as { pages: Array<unknown> } | undefined)
        ?.pages[0],
  },
]

describe.each(variants)('shared observer lifecycle ($name)', (variant) => {
  let queryClient: QueryClient

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    })
    queryClient.mount()
  })

  afterEach(() => {
    queryClient.clear()
  })

  // Key ends in 'initial' so the queryFn resolves to 'initial'.
  function setup() {
    const key = [...queryKey(), 'initial']
    const query = variant.create(queryClient, key)
    return { key, query }
  }

  it('keeps the observer subscribed while another consumer is still mounted', async () => {
    const { key, query } = setup()
    const scope = fork()

    await allSettled(query.mounted, { scope })
    await allSettled(query.mounted, { scope })
    await variant.fetch(queryClient, key)
    expect(variant.read(scope, query)).toBe('initial')

    await allSettled(query.unmounted, { scope })

    expect(scope.getState(query.$observer)).not.toBeNull()
    variant.set(queryClient, key, 'updated')
    expect(variant.read(scope, query)).toBe('updated')
  })

  it('does not replace the observer on additional mounts', async () => {
    const { query } = setup()
    const scope = fork()

    await allSettled(query.mounted, { scope })
    const first = scope.getState(query.$observer)
    await allSettled(query.mounted, { scope })

    expect(scope.getState(query.$observer)).toBe(first)
  })

  it('does not re-subscribe the observer on additional mounts', async () => {
    const { query } = setup()
    const scope = fork()

    await allSettled(query.mounted, { scope })
    const observer = scope.getState(query.$observer)!
    const subscribe = vi.spyOn(observer, 'subscribe')
    await allSettled(query.mounted, { scope })

    expect(subscribe).not.toHaveBeenCalled()
  })

  it('releases the observer on the last unmount', async () => {
    const { key, query } = setup()
    const scope = fork()

    await allSettled(query.mounted, { scope })
    await allSettled(query.mounted, { scope })
    await variant.fetch(queryClient, key)

    await allSettled(query.unmounted, { scope })
    await allSettled(query.unmounted, { scope })

    expect(scope.getState(query.$observer)).toBeNull()
    variant.set(queryClient, key, 'after-release')
    expect(variant.read(scope, query)).toBe('initial')
  })

  it('destroys the observer only on the last unmount', async () => {
    const { query } = setup()
    const scope = fork()

    await allSettled(query.mounted, { scope })
    await allSettled(query.mounted, { scope })
    const observer = scope.getState(query.$observer)!
    const destroy = vi.spyOn(observer, 'destroy')

    await allSettled(query.unmounted, { scope })
    expect(destroy).not.toHaveBeenCalled()

    await allSettled(query.unmounted, { scope })
    expect(destroy).toHaveBeenCalled()
  })

  it('keeps applying reactive options while a consumer remains mounted', async () => {
    const key = queryKey()
    const setId = createEvent<number>()
    const $id = createStore(1).on(setId, (_, v) => v)
    const query = variant.create(queryClient, [...key, $id])
    const scope = fork()

    await allSettled(query.mounted, { scope })
    await allSettled(query.mounted, { scope })
    await allSettled(query.unmounted, { scope })

    await allSettled(setId, { scope, params: 2 })
    await variant.fetch(queryClient, [...key, 2])

    expect(scope.getState(query.$observer)?.options.queryKey).toEqual([
      ...key,
      2,
    ])
    expect(variant.read(scope, query)).toBe(2)
  })

  it('keeps the observer when one consumer remounts while another stays mounted', async () => {
    const { key, query } = setup()
    const scope = fork()

    await allSettled(query.mounted, { scope })
    await allSettled(query.mounted, { scope })
    await variant.fetch(queryClient, key)
    await allSettled(query.unmounted, { scope })
    await allSettled(query.mounted, { scope })
    await allSettled(query.unmounted, { scope })

    expect(scope.getState(query.$observer)).not.toBeNull()
    variant.set(queryClient, key, 'updated')
    expect(variant.read(scope, query)).toBe('updated')
  })

  it('treats extra unmounts at zero as a no-op', async () => {
    const { key, query } = setup()
    const scope = fork()

    await allSettled(query.unmounted, { scope })
    await allSettled(query.unmounted, { scope })

    // A single mount after excess unmounts must still own the observer:
    // the count must not go negative.
    await allSettled(query.mounted, { scope })
    await variant.fetch(queryClient, key)

    expect(scope.getState(query.$observer)).not.toBeNull()
    variant.set(queryClient, key, 'updated')
    expect(variant.read(scope, query)).toBe('updated')

    await allSettled(query.unmounted, { scope })
    expect(scope.getState(query.$observer)).toBeNull()
  })

  it('can remount after the count reaches zero', async () => {
    const { key, query } = setup()
    const scope = fork()

    await allSettled(query.mounted, { scope })
    await allSettled(query.unmounted, { scope })
    expect(scope.getState(query.$observer)).toBeNull()

    await allSettled(query.mounted, { scope })
    await variant.fetch(queryClient, key)

    expect(scope.getState(query.$observer)).not.toBeNull()
    variant.set(queryClient, key, 'updated')
    expect(variant.read(scope, query)).toBe('updated')
  })

  it('keeps independent counts per scope', async () => {
    const { key, query } = setup()
    const scopeA = fork()
    const scopeB = fork()

    await allSettled(query.mounted, { scope: scopeA })
    await allSettled(query.mounted, { scope: scopeA })
    await allSettled(query.mounted, { scope: scopeB })
    await variant.fetch(queryClient, key)

    // Unmounting in B must not affect A's count, and vice versa.
    await allSettled(query.unmounted, { scope: scopeB })
    await allSettled(query.unmounted, { scope: scopeA })

    expect(scopeB.getState(query.$observer)).toBeNull()
    expect(scopeA.getState(query.$observer)).not.toBeNull()

    variant.set(queryClient, key, 'updated')
    expect(variant.read(scopeA, query)).toBe('updated')
    expect(variant.read(scopeB, query)).toBe('initial')
  })
})
