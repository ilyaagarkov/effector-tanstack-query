import { describe, expectTypeOf, it } from 'vitest'
import { createStore } from 'effector'
import type { QueryClient } from '@tanstack/query-core'
import { queryOptions } from '@tanstack/react-query'
import {
  createQueries,
  createQuery,
  createQueryFromOptions,
  type QueriesResult,
} from '@effector-tanstack-query/core'
import {
  useIsFetching,
  useIsMutating,
  useQueries,
  useSuspenseQueries,
  type UseQueryResult,
  type UseSuspenseQueryResult,
} from '..'

// Type-level tests run under vitest's typecheck mode. They never
// execute: probe functions exist purely to surface the inferred
// return type via `ReturnType<typeof probe>`.

declare const queryClient: QueryClient

const userQuery = createQuery(queryClient, {
  name: 'types.user',
  queryKey: ['user'],
  queryFn: () => Promise.resolve({ id: 1, name: 'Alice' }),
})
const postsQuery = createQuery(queryClient, {
  name: 'types.posts',
  queryKey: ['posts'],
  queryFn: () => Promise.resolve([1, 2, 3]),
})

const $todoId = createStore(1)
const todoOptions = ({ todoId }: { todoId: number }) =>
  queryOptions({
    queryKey: ['todo', todoId] as const,
    queryFn: () => Promise.resolve({ id: todoId, title: 'Learn Effector' }),
  })

const todoQuery = createQueryFromOptions(queryClient, {
  name: 'types.todoFromOptions',
  source: { todoId: $todoId },
  queryOptions: todoOptions,
})

const todoTitleOptions = ({ todoId }: { todoId: number }) =>
  queryOptions({
    ...todoOptions({ todoId }),
    select: (todo) => todo.title,
  })

const todoTitleQuery = createQueryFromOptions(queryClient, {
  name: 'types.todoTitleFromOptions',
  source: { todoId: $todoId },
  queryOptions: (source) => {
    expectTypeOf(source).toEqualTypeOf<{ todoId: number }>()
    return todoTitleOptions(source)
  },
})

describe('createQueryFromOptions — queryOptions inference', () => {
  it('infers source and data from a standard TanStack factory', () => {
    expectTypeOf(todoQuery.$data).toEqualTypeOf<
      import('effector').Store<
        { id: number; title: string } | undefined
      >
    >()
    expectTypeOf(todoTitleQuery.$data).toEqualTypeOf<
      import('effector').Store<string | undefined>
    >()
  })
})

describe('useQueries — tuple overload', () => {
  it('preserves per-element types from a `const` tuple of factories', () => {
    function probe() {
      return useQueries([userQuery, postsQuery] as const)
    }

    // Tuple shape preserved — destructuring yields the right types per
    // position. Breaks if the `const T` modifier is lost or the mapped
    // result widens to `UseQueryResult<unknown>[]`.
    expectTypeOf<ReturnType<typeof probe>>().toEqualTypeOf<
      readonly [
        UseQueryResult<{ id: number; name: string }, Error>,
        UseQueryResult<Array<number>, Error>,
      ]
    >()
  })

  it('exposes per-element `data` with TData | undefined', () => {
    function probe() {
      const [user, posts] = useQueries([userQuery, postsQuery] as const)
      return { userData: user.data, postsData: posts.data }
    }

    expectTypeOf<ReturnType<typeof probe>['userData']>().toEqualTypeOf<
      { id: number; name: string } | undefined
    >()
    expectTypeOf<ReturnType<typeof probe>['postsData']>().toEqualTypeOf<
      Array<number> | undefined
    >()
  })
})

describe('useQueries — family overload', () => {
  it('returns ReadonlyArray<UseQueryResult<TData, TError>>', () => {
    const $ids = createStore<number[]>([])
    const family = createQueries(queryClient, {
      name: 'types.family',
      source: $ids,
      query: (id) => ({
        queryKey: ['types.family', id],
        queryFn: () => Promise.resolve({ id, label: 'x' }),
      }),
    })

    function probe() {
      return useQueries(family)
    }

    expectTypeOf<ReturnType<typeof probe>>().toEqualTypeOf<
      ReadonlyArray<UseQueryResult<{ id: number; label: string }, Error>>
    >()
  })

  it('family type is forwarded through QueriesResult generic', () => {
    type Family = QueriesResult<number, { id: number }, Error>
    function probe(family: Family) {
      return useQueries(family)
    }
    expectTypeOf<ReturnType<typeof probe>>().toEqualTypeOf<
      ReadonlyArray<UseQueryResult<{ id: number }, Error>>
    >()
  })
})

describe('useSuspenseQueries — tuple overload', () => {
  it('narrows data to non-nullable per element', () => {
    function probe() {
      return useSuspenseQueries([userQuery, postsQuery] as const)
    }

    expectTypeOf<ReturnType<typeof probe>>().toEqualTypeOf<
      readonly [
        UseSuspenseQueryResult<{ id: number; name: string }, Error>,
        UseSuspenseQueryResult<Array<number>, Error>,
      ]
    >()
  })

  it('past the Suspense gate, each data is NON-nullable', () => {
    function probe() {
      const [user, posts] = useSuspenseQueries([userQuery, postsQuery] as const)
      return { userData: user.data, postsData: posts.data }
    }

    // Key ergonomic difference vs `useQueries`: no `| undefined`.
    expectTypeOf<ReturnType<typeof probe>['userData']>().toEqualTypeOf<{
      id: number
      name: string
    }>()
    expectTypeOf<ReturnType<typeof probe>['postsData']>().toEqualTypeOf<
      Array<number>
    >()
  })
})

describe('useSuspenseQueries — family overload', () => {
  it('returns ReadonlyArray<UseSuspenseQueryResult<TData, TError>>', () => {
    type Family = QueriesResult<number, { id: number }, Error>
    function probe(family: Family) {
      return useSuspenseQueries(family)
    }

    expectTypeOf<ReturnType<typeof probe>>().toEqualTypeOf<
      ReadonlyArray<UseSuspenseQueryResult<{ id: number }, Error>>
    >()
  })
})

describe('useIsFetching / useIsMutating', () => {
  it('return a plain number (never number | undefined)', () => {
    expectTypeOf(useIsFetching()).toEqualTypeOf<number>()
    expectTypeOf(useIsFetching({ queryKey: ['user'] })).toEqualTypeOf<number>()
    expectTypeOf(useIsMutating()).toEqualTypeOf<number>()
    expectTypeOf(
      useIsMutating({ mutationKey: ['createUser'] }),
    ).toEqualTypeOf<number>()
  })
})
