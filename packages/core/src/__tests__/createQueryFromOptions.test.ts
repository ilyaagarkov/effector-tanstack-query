import { allSettled, createEvent, createStore, fork } from 'effector'
import { QueryClient } from '@tanstack/query-core'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createQueryFromOptions } from '../createQueryFromOptions'
import { $queryClient } from '../queryClient'

describe('createQueryFromOptions', () => {
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

  it('passes resolved source values to the factory and switches queries', async () => {
    const todoIdChanged = createEvent<number>()
    const $todoId = createStore(1).on(todoIdChanged, (_, todoId) => todoId)
    const receivedSources: Array<{ todoId: number }> = []

    const query = createQueryFromOptions(queryClient, {
      name: 'todo.detail',
      source: { todoId: $todoId },
      queryOptions: ({ todoId }) => {
        receivedSources.push({ todoId })
        return {
          queryKey: ['todo', todoId] as const,
          queryFn: () => Promise.resolve(`todo-${todoId}`),
        }
      },
    })
    const scope = fork()

    await allSettled(query.mounted, { scope })
    await vi.waitFor(() => {
      expect(scope.getState(query.$data)).toBe('todo-1')
    })

    await allSettled(todoIdChanged, { params: 2, scope })
    await vi.waitFor(() => {
      expect(scope.getState(query.$data)).toBe('todo-2')
    })

    expect(receivedSources).toContainEqual({ todoId: 1 })
    expect(receivedSources).toContainEqual({ todoId: 2 })
    expect(
      receivedSources.every(({ todoId }) => typeof todoId === 'number'),
    ).toBe(true)
  })

  it('applies the complete options object when source changes', async () => {
    const formatChanged = createEvent<'name' | 'id'>()
    const $format = createStore<'name' | 'id'>('name').on(
      formatChanged,
      (_, format) => format,
    )
    const queryFn = vi.fn(() => Promise.resolve({ id: 7, name: 'Ada' }))

    const query = createQueryFromOptions(queryClient, {
      name: 'user.formatted',
      source: $format,
      queryOptions: (format) => ({
        queryKey: ['user', 7] as const,
        queryFn,
        staleTime: Infinity,
        select: (user: { id: number; name: string }) =>
          format === 'name' ? user.name : user.id,
      }),
    })
    const scope = fork()

    await allSettled(query.mounted, { scope })
    await vi.waitFor(() => {
      expect(scope.getState(query.$data)).toBe('Ada')
    })

    await allSettled(formatChanged, { params: 'id', scope })

    expect(scope.getState(query.$data)).toBe(7)
    expect(queryFn).toHaveBeenCalledTimes(1)
  })

  it('combines a reactive consumer enabled gate with factory options', async () => {
    const enabledChanged = createEvent<boolean>()
    const factoryEnabledChanged = createEvent<boolean>()
    const $enabled = createStore(false).on(
      enabledChanged,
      (_, enabled) => enabled,
    )
    const $factoryEnabled = createStore(false).on(
      factoryEnabledChanged,
      (_, enabled) => enabled,
    )
    const queryFn = vi.fn(() => Promise.resolve('ready'))

    const query = createQueryFromOptions(queryClient, {
      name: 'gated',
      source: { id: createStore(1), factoryEnabled: $factoryEnabled },
      queryOptions: ({ id, factoryEnabled }) => ({
        queryKey: ['gated', id] as const,
        queryFn,
        enabled: factoryEnabled,
      }),
      enabled: $enabled,
    })
    const scope = fork()

    await allSettled(query.mounted, { scope })
    expect(queryFn).not.toHaveBeenCalled()

    await allSettled(enabledChanged, { params: true, scope })
    expect(queryFn).not.toHaveBeenCalled()

    await allSettled(factoryEnabledChanged, { params: true, scope })
    await vi.waitFor(() => {
      expect(scope.getState(query.$data)).toBe('ready')
    })
  })

  it('prefetches current factory options in the active fork scope', async () => {
    const $todoId = createStore(1)
    const query = createQueryFromOptions({
      name: 'todo.prefetch',
      source: { todoId: $todoId },
      queryOptions: ({ todoId }) => ({
        queryKey: ['todo-prefetch', todoId] as const,
        queryFn: () => Promise.resolve(`todo-${todoId}`),
      }),
    })
    const secondClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    })
    secondClient.mount()
    const firstScope = fork({
      values: [[$queryClient, queryClient], [$todoId, 1]],
    })
    const secondScope = fork({
      values: [[$queryClient, secondClient], [$todoId, 2]],
    })

    await Promise.all([
      allSettled(query.prefetch, { scope: firstScope }),
      allSettled(query.prefetch, { scope: secondScope }),
    ])

    expect(queryClient.getQueryData(['todo-prefetch', 1])).toBe('todo-1')
    expect(secondClient.getQueryData(['todo-prefetch', 2])).toBe('todo-2')
    expect(queryClient.getQueryData(['todo-prefetch', 2])).toBeUndefined()
    expect(secondClient.getQueryData(['todo-prefetch', 1])).toBeUndefined()

    secondClient.clear()
  })
})
