import { describe, expectTypeOf, it } from 'vitest'
import {
  createStore,
  type Event,
  type EventCallable,
  type Store,
} from 'effector'
import type { InfiniteData, QueryClient } from '@tanstack/query-core'
import { createQuery } from '../createQuery'
import { createInfiniteQuery } from '../createInfiniteQuery'
import { createQueries } from '../createQueries'
import type { QueriesResult, QueryItemState } from '../types'

// Type-level tests verify that generic inference flows correctly:
//   - queryFn return → TQueryFnData
//   - select(TQueryFnData) → TData (post-select)
//   - $data is typed as TData | undefined (not TQueryFnData)
//
// These run under vitest's typecheck mode (`typecheck: { enabled: true }`).

declare const queryClient: QueryClient

describe('createQuery type narrowing', () => {
  it('should infer TData from queryFn return when no select is provided', () => {
    const q = createQuery(queryClient, {
      name: 'plain',
      queryKey: ['user'],
      queryFn: () => Promise.resolve({ name: 'Alice', age: 30 }),
    })

    expectTypeOf(q.$data).toEqualTypeOf<
      Store<{ name: string; age: number } | undefined>
    >()
  })

  it('should narrow TData via select function return type', () => {
    const q = createQuery(queryClient, {
      name: 'narrowed',
      queryKey: ['user'],
      queryFn: () => Promise.resolve({ name: 'Alice', age: 30 }),
      select: (data) => data.name,
    })

    expectTypeOf(q.$data).toEqualTypeOf<Store<string | undefined>>()
  })

  it('should provide typed data argument inside select', () => {
    createQuery(queryClient, {
      name: 'selectArg',
      queryKey: ['user'],
      queryFn: () => Promise.resolve({ id: 1, items: [10, 20] }),
      select: (data) => {
        expectTypeOf(data).toEqualTypeOf<{ id: number; items: Array<number> }>()
        return data.items.length
      },
    })
  })

  it('should keep TError generic on $error store', () => {
    class CustomError extends Error {
      code = 42
    }

    const q = createQuery<string, CustomError>(queryClient, {
      name: 'custom-error',
      queryKey: ['x'],
      queryFn: () => Promise.resolve('ok'),
    })

    expectTypeOf(q.$error).toEqualTypeOf<Store<CustomError | null>>()
  })

  it('should accept explicit generic args in legacy <TData> form', () => {
    const q = createQuery<{ count: number }>(queryClient, {
      name: 'legacy',
      queryKey: ['legacy'],
      queryFn: () => Promise.resolve({ count: 1 }),
    })

    expectTypeOf(q.$data).toEqualTypeOf<
      Store<{ count: number } | undefined>
    >()
  })

  it('should type finished.success / finished.failure with TData / TError', () => {
    interface User {
      id: number
    }
    class CustomError extends Error {
      code = 1
    }

    const q = createQuery<User, CustomError>(queryClient, {
      name: 'finished',
      queryKey: ['user'],
      queryFn: () => Promise.resolve({ id: 1 }),
    })

    expectTypeOf(q.finished.success).toEqualTypeOf<Event<User>>()
    expectTypeOf(q.finished.failure).toEqualTypeOf<Event<CustomError>>()
  })

  it('should type finished.success as the post-select TData', () => {
    const q = createQuery(queryClient, {
      name: 'finished-select',
      queryKey: ['user'],
      queryFn: () => Promise.resolve({ name: 'Alice', age: 30 }),
      select: (data) => data.name,
    })

    expectTypeOf(q.finished.success).toEqualTypeOf<Event<string>>()
    expectTypeOf(q.finished.failure).toEqualTypeOf<Event<Error>>()
  })
})

describe('createInfiniteQuery type narrowing', () => {
  it('should default $data to InfiniteData<TQueryFnData, TPageParam> without select', () => {
    const q = createInfiniteQuery(queryClient, {
      name: 'infiniteDefault',
      queryKey: ['posts'],
      queryFn: ({ pageParam }: { pageParam: number }) =>
        Promise.resolve({ id: pageParam, title: 'post' }),
      getNextPageParam: (lastPage) => lastPage.id + 1,
      initialPageParam: 0,
    })

    expectTypeOf(q.$data).toEqualTypeOf<
      Store<InfiniteData<{ id: number; title: string }, number> | undefined>
    >()
  })

  it('should narrow $data to whatever select returns', () => {
    const q = createInfiniteQuery(queryClient, {
      name: 'infiniteSelect',
      queryKey: ['posts'],
      queryFn: ({ pageParam }: { pageParam: number }) =>
        Promise.resolve({ id: pageParam, title: 'post' }),
      getNextPageParam: (lastPage) => lastPage.id + 1,
      initialPageParam: 0,
      select: (data) => data.pages.map((p) => p.title),
    })

    expectTypeOf(q.$data).toEqualTypeOf<Store<Array<string> | undefined>>()
  })

  it('should provide typed pages array inside select', () => {
    createInfiniteQuery(queryClient, {
      name: 'infiniteSelectArg',
      queryKey: ['posts'],
      queryFn: ({ pageParam }: { pageParam: number }) =>
        Promise.resolve({ id: pageParam }),
      getNextPageParam: (lastPage) => lastPage.id + 1,
      initialPageParam: 0,
      select: (data) => {
        expectTypeOf(data.pages).toEqualTypeOf<Array<{ id: number }>>()
        expectTypeOf(data.pageParams).toEqualTypeOf<Array<number>>()
        return data.pages.length
      },
    })
  })

  it('should type finished.success with the (post-select) TData', () => {
    const q = createInfiniteQuery(queryClient, {
      name: 'infiniteFinished',
      queryKey: ['posts'],
      queryFn: ({ pageParam }: { pageParam: number }) =>
        Promise.resolve({ id: pageParam, title: 'post' }),
      getNextPageParam: (lastPage) => lastPage.id + 1,
      initialPageParam: 0,
      select: (data) => data.pages.map((p) => p.title),
    })

    expectTypeOf(q.finished.success).toEqualTypeOf<Event<Array<string>>>()
    expectTypeOf(q.finished.failure).toEqualTypeOf<Event<Error>>()
  })
})

describe('createQueries type narrowing', () => {
  it('infers TData from queryFn return; $items reflects the source/data shape', () => {
    const $ids = createStore<number[]>([])
    const family = createQueries({
      name: 'users',
      source: $ids,
      query: (id) => ({
        queryKey: ['user', id],
        queryFn: () => Promise.resolve({ id, name: 'Alice' }),
      }),
    })

    expectTypeOf(family).toEqualTypeOf<
      QueriesResult<number, { id: number; name: string }, Error>
    >()
    expectTypeOf(family.$items).toEqualTypeOf<
      Store<ReadonlyArray<QueryItemState<number, { id: number; name: string }, Error>>>
    >()
    expectTypeOf(family.$data).toEqualTypeOf<
      Store<ReadonlyArray<{ id: number; name: string } | undefined>>
    >()
    expectTypeOf(family.refreshOne).toEqualTypeOf<EventCallable<number>>()
  })

  it('passes item type through to query(item) callback', () => {
    const $users = createStore<Array<{ id: number; tag: string }>>([])
    createQueries({
      name: 'tagged',
      source: $users,
      query: (item) => {
        expectTypeOf(item).toEqualTypeOf<{ id: number; tag: string }>()
        return {
          queryKey: ['tagged', item.id],
          queryFn: () => Promise.resolve(item.tag.length),
        }
      },
    })
  })
})
