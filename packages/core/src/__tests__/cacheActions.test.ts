import { allSettled, createEvent, createStore, fork } from 'effector'
import { QueryClient } from '@tanstack/query-core'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  createCancel,
  createRemove,
  createReset,
} from '../createCacheAction'
import { createQuery } from '../createQuery'
import { $queryClient } from '../queryClient'
import { queryKey, sleep } from './test-utils'

// Three cache-action factories share almost all wiring with each other (and
// with createInvalidate): reactive-key resolution, explicit-client locking,
// per-scope isolation, no-op when no client. Those are covered once via
// `describe.each`. Action-specific behavior (cancel stops a fetch, remove drops
// the entry, reset refetches) is covered in dedicated blocks below.

type Method = 'cancelQueries' | 'removeQueries' | 'resetQueries'

const ACTIONS: Array<{
  label: string
  create: typeof createCancel
  method: Method
}> = [
  { label: 'createCancel', create: createCancel, method: 'cancelQueries' },
  { label: 'createRemove', create: createRemove, method: 'removeQueries' },
  { label: 'createReset', create: createReset, method: 'resetQueries' },
]

describe('cache actions — shared wiring', () => {
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

  describe.each(ACTIONS)('$label', ({ create, method }) => {
    it('resolves a reactive queryKey at invocation time', async () => {
      const setId = createEvent<number>()
      const $id = createStore(1).on(setId, (_, v) => v)
      const spy = vi.spyOn(queryClient, method as 'removeQueries')

      const action = create(queryClient, { queryKey: ['user', $id] })
      const scope = fork()

      await allSettled(action, { scope })
      expect(spy).toHaveBeenLastCalledWith(
        expect.objectContaining({ queryKey: ['user', 1] }),
      )

      await allSettled(setId, { scope, params: 2 })
      await allSettled(action, { scope })
      expect(spy).toHaveBeenLastCalledWith(
        expect.objectContaining({ queryKey: ['user', 2] }),
      )
      spy.mockRestore()
    })

    it('targets all queries (no queryKey in filters) when queryKey is omitted', async () => {
      const spy = vi.spyOn(queryClient, method as 'removeQueries')
      const action = create(queryClient, {})
      const scope = fork()

      await allSettled(action, { scope })

      expect(spy).toHaveBeenCalledTimes(1)
      expect(spy.mock.calls[0]![0]).not.toHaveProperty('queryKey')
      spy.mockRestore()
    })

    it('forwards extra QueryFilters fields (e.g. type)', async () => {
      const spy = vi.spyOn(queryClient, method as 'removeQueries')
      const action = create(queryClient, { queryKey: ['k'], type: 'active' })
      const scope = fork()

      await allSettled(action, { scope })
      expect(spy).toHaveBeenCalledWith(
        expect.objectContaining({ queryKey: ['k'], type: 'active' }),
      )
      spy.mockRestore()
    })

    it('explicit-client overload locks to the passed client', async () => {
      const other = new QueryClient({
        defaultOptions: { queries: { retry: false } },
      })
      other.mount()
      const spyExplicit = vi.spyOn(queryClient, method as 'removeQueries')
      const spyOther = vi.spyOn(other, method as 'removeQueries')

      // Locked to `queryClient` — a fork with a different $queryClient must not
      // redirect it.
      const action = create(queryClient, { queryKey: ['k'] })
      const scope = fork({ values: [[$queryClient, other]] })

      await allSettled(action, { scope })
      expect(spyExplicit).toHaveBeenCalledTimes(1)
      expect(spyOther).not.toHaveBeenCalled()
      spyExplicit.mockRestore()
      spyOther.mockRestore()
      other.clear()
    })

    it('per-scope isolation under fork({ values }) for the default overload', async () => {
      const qcA = new QueryClient({
        defaultOptions: { queries: { retry: false } },
      })
      qcA.mount()
      const qcB = new QueryClient({
        defaultOptions: { queries: { retry: false } },
      })
      qcB.mount()
      const spyA = vi.spyOn(qcA, method as 'removeQueries')
      const spyB = vi.spyOn(qcB, method as 'removeQueries')

      const action = create({ queryKey: ['k'] }) // default client
      const scopeA = fork({ values: [[$queryClient, qcA]] })
      const scopeB = fork({ values: [[$queryClient, qcB]] })

      await allSettled(action, { scope: scopeA })
      expect(spyA).toHaveBeenCalledTimes(1)
      expect(spyB).not.toHaveBeenCalled()

      // Firing in scope B hits only qcB.
      await allSettled(action, { scope: scopeB })
      expect(spyB).toHaveBeenCalledTimes(1)
      expect(spyA).toHaveBeenCalledTimes(1)

      spyA.mockRestore()
      spyB.mockRestore()
      qcA.clear()
      qcB.clear()
    })

    it('is a safe no-op when no QueryClient is set in scope or as default', async () => {
      const action = create({ queryKey: ['nothing'] })
      const scope = fork()

      await allSettled(action, { scope })
      // Reaching here without throwing is the assertion.
      expect(true).toBe(true)
    })
  })
})

describe('createCancel — behavior', () => {
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

  it('cancels an in-flight fetch for the matching queryKey', async () => {
    const key = queryKey()
    const query = createQuery(queryClient, {
      name: 'cancel.match',
      queryKey: key,
      queryFn: () => sleep(20).then(() => 'data'),
      staleTime: Infinity,
    })
    const cancel = createCancel(queryClient, { queryKey: key })

    query.mounted()
    await vi.advanceTimersByTimeAsync(5)
    expect(query.$fetchStatus.getState()).toBe('fetching')

    cancel()
    await vi.advanceTimersByTimeAsync(1)
    expect(query.$fetchStatus.getState()).toBe('idle')
    expect(query.$data.getState()).toBeUndefined()

    // The original promise still resolves later, but its result is ignored.
    await vi.advanceTimersByTimeAsync(20)
    expect(query.$data.getState()).toBeUndefined()
  })

  it('does not touch non-matching queries', async () => {
    const qA = createQuery(queryClient, {
      name: 'cancel.a',
      queryKey: ['user', 1],
      queryFn: () => sleep(20).then(() => 'a'),
      staleTime: Infinity,
    })
    const qB = createQuery(queryClient, {
      name: 'cancel.b',
      queryKey: ['user', 2],
      queryFn: () => sleep(20).then(() => 'b'),
      staleTime: Infinity,
    })
    // Prefix ['user', 1] matches only qA.
    const cancelA = createCancel(queryClient, { queryKey: ['user', 1] })

    qA.mounted()
    qB.mounted()
    await vi.advanceTimersByTimeAsync(5)
    expect(qA.$fetchStatus.getState()).toBe('fetching')
    expect(qB.$fetchStatus.getState()).toBe('fetching')

    cancelA()
    await vi.advanceTimersByTimeAsync(1)
    expect(qA.$fetchStatus.getState()).toBe('idle')
    expect(qB.$fetchStatus.getState()).toBe('fetching')

    // qB keeps going and resolves normally.
    await vi.advanceTimersByTimeAsync(20)
    expect(qB.$data.getState()).toBe('b')
    expect(qA.$data.getState()).toBeUndefined()
  })
})

describe('createRemove — behavior', () => {
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

  it('removes the cache entry; a subsequent fetch goes pending → success', async () => {
    const key = queryKey()
    void queryClient.prefetchQuery({
      queryKey: key,
      queryFn: () => sleep(5).then(() => 'first'),
    })
    await vi.advanceTimersByTimeAsync(6)
    expect(queryClient.getQueryData(key)).toBe('first')

    const remove = createRemove(queryClient, { queryKey: key })
    remove()
    await vi.advanceTimersByTimeAsync(0)
    expect(queryClient.getQueryData(key)).toBeUndefined()

    // The next query for that key starts fresh (pending), then succeeds.
    const query = createQuery(queryClient, {
      name: 'remove.refetch',
      queryKey: key,
      queryFn: () => sleep(5).then(() => 'second'),
    })
    query.mounted()
    expect(query.$status.getState()).toBe('pending')
    await vi.advanceTimersByTimeAsync(6)
    expect(query.$status.getState()).toBe('success')
    expect(query.$data.getState()).toBe('second')
  })
})

describe('createReset — behavior', () => {
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

  it('resets matching queries and refetches the active observer', async () => {
    const key = queryKey()
    let runs = 0
    const query = createQuery(queryClient, {
      name: 'reset.refetch',
      queryKey: key,
      queryFn: () => sleep(5).then(() => `r-${++runs}`),
      staleTime: Infinity,
    })
    const reset = createReset(queryClient, { queryKey: key })

    query.mounted()
    await vi.advanceTimersByTimeAsync(6)
    expect(query.$data.getState()).toBe('r-1')

    reset()
    await vi.advanceTimersByTimeAsync(6)
    expect(query.$data.getState()).toBe('r-2')
  })

  it('awaits the refetch under allSettled (async semantics)', async () => {
    const key = queryKey()
    let runs = 0
    const query = createQuery({
      name: 'reset.allSettled',
      queryKey: key,
      queryFn: () => sleep(5).then(() => `r-${++runs}`),
      staleTime: Infinity,
    })
    const reset = createReset({ queryKey: key })
    const scope = fork({ values: [[$queryClient, queryClient]] })

    await allSettled(query.mounted, { scope })
    await vi.advanceTimersByTimeAsync(6)
    expect(scope.getState(query.$data)).toBe('r-1')

    // resetQueries awaits the triggered refetch — drive the clock while the
    // allSettled promise is pending, then assert it observed the new value.
    const settled = allSettled(reset, { scope })
    await vi.advanceTimersByTimeAsync(6)
    await settled
    expect(scope.getState(query.$data)).toBe('r-2')
  })
})
