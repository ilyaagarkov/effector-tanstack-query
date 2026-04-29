import { allSettled, fork, serialize } from 'effector'
import { QueryClient } from '@tanstack/query-core'
import { sleep } from './test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createQuery } from '../createQuery'
import { createMutation } from '../createMutation'
import { createInfiniteQuery } from '../createInfiniteQuery'
import { sidConfig, warnMissingName } from '../createBaseQuery'

describe('SID assignment & dev warnings', () => {
  let queryClient: QueryClient

  beforeEach(() => {
    vi.useFakeTimers()
    queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
    })
    queryClient.mount()
  })

  afterEach(() => {
    queryClient.clear()
    vi.useRealTimers()
  })

  describe('sidConfig helper', () => {
    it('returns an empty object when name is undefined', () => {
      expect(sidConfig(undefined, '$data')).toEqual({})
    })

    it('returns sid and name namespaced under @tanstack/query-effector when name is provided', () => {
      expect(sidConfig('myQuery', '$data')).toEqual({
        sid: '@tanstack/query-effector.myQuery.$data',
        name: 'myQuery.$data',
      })
    })
  })

  describe('warnMissingName', () => {
    it('does not warn in production', () => {
      const original = process.env.NODE_ENV
      process.env.NODE_ENV = 'production'
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
      try {
        warnMissingName('createQuery-prod-test')
        expect(warnSpy).not.toHaveBeenCalled()
      } finally {
        process.env.NODE_ENV = original
        warnSpy.mockRestore()
      }
    })

    it('warns once per role and silences subsequent calls', () => {
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
      try {
        warnMissingName('uniqueRoleA')
        warnMissingName('uniqueRoleA')
        warnMissingName('uniqueRoleA')
        expect(warnSpy).toHaveBeenCalledTimes(1)
        expect(warnSpy.mock.calls[0]?.[0]).toContain('uniqueRoleA')
      } finally {
        warnSpy.mockRestore()
      }
    })
  })

  describe('createMutation SSR', () => {
    it('serializes mutation $data via name-derived SID', async () => {
      const mutation = createMutation(queryClient, {
        name: 'addTodo',
        mutationFn: (text: string) => sleep(5).then(() => text.toUpperCase()),
      })

      const scope = fork()
      await allSettled(mutation.start, { scope })
      await allSettled(mutation.mutate, { scope, params: 'todo' })
      await vi.advanceTimersByTimeAsync(6)

      expect(scope.getState(mutation.$data)).toBe('TODO')

      const serialized = serialize(scope)
      expect(serialized['@tanstack/query-effector.addTodo.$data']).toBe('TODO')
      expect(serialized['@tanstack/query-effector.addTodo.$status']).toBe(
        'success',
      )
    })
  })

  describe('createInfiniteQuery SSR', () => {
    it('serializes infinite query stores via name-derived SIDs', async () => {
      const query = createInfiniteQuery<number, Error, number>(queryClient, {
        name: 'pagedQuery',
        queryKey: ['paged'],
        queryFn: ({ pageParam }: { pageParam: any }) =>
          sleep(5).then(() => pageParam),
        getNextPageParam: (lastPage: number) => lastPage + 1,
        initialPageParam: 0,
      })

      const scope = fork()
      await allSettled(query.mounted, { scope })
      await vi.advanceTimersByTimeAsync(6)

      const serialized = serialize(scope)

      // Base stores from createBaseQuery
      expect(serialized['@tanstack/query-effector.pagedQuery.$status']).toBe(
        'success',
      )
      // Extras stores from createInfiniteQuery setupExtras
      expect(
        serialized['@tanstack/query-effector.pagedQuery.$hasNextPage'],
      ).toBe(true)
    })
  })

  describe('createQuery name parameter', () => {
    it('does not collide with restOptions when destructured', async () => {
      // Regression check: name must be stripped before being forwarded to
      // QueryObserver, otherwise the observer would receive an unknown option.
      const query = createQuery(queryClient, {
        name: 'observerOptionTest',
        queryKey: ['observer-options'],
        queryFn: () => sleep(5).then(() => 'data'),
      })

      const scope = fork()
      await allSettled(query.mounted, { scope })
      await vi.advanceTimersByTimeAsync(6)

      expect(scope.getState(query.$data)).toBe('data')
    })
  })
})
