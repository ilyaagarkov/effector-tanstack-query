import { combine, createEvent, createStore } from 'effector'
import type { Event, Store } from 'effector'
import { QueryClient } from '@tanstack/query-core'
import { expectTypeOf } from 'vitest'
import {
  createQuery,
  queryOptions,
  createInfiniteQuery,
  infiniteQueryOptions,
} from '../index'

const $id = createStore(1)
const client = new QueryClient()
type Todo = { id: number; title: string }
const todoOptions = ({ id }: { id: number }) =>
  queryOptions({
    queryKey: ['todos', { id }] as const,
    queryFn: async (): Promise<Todo> => ({ id, title: 'todo' }),
  })
const a = createQuery({ source: { id: $id }, query: todoOptions })
const b = createQuery(client, { source: { id: $id }, query: todoOptions })
expectTypeOf(a.$data).toEqualTypeOf<Store<Todo | undefined>>()
expectTypeOf(b.$data).toEqualTypeOf<Store<Todo | undefined>>()
expectTypeOf(a.$error).toEqualTypeOf<Store<Error | null>>()

const selected = createQuery({
  source: $id,
  query: (id: number) => ({
    ...todoOptions({ id }),
    select: (todo) => todo.title,
  }),
})
expectTypeOf(selected.$data).toEqualTypeOf<Store<string | undefined>>()
expectTypeOf(selected.finished.success).toEqualTypeOf<Event<string>>()

const helperSelected = createQuery({
  source: $id,
  query: (id) =>
    queryOptions({
      ...todoOptions({ id }),
      select: (todo) => todo.id,
    }),
})
expectTypeOf(helperSelected.$data).toEqualTypeOf<Store<number | undefined>>()
const $enabled = combine($id, (id) => id > 0)
createQuery({
  source: { id: $id, enabled: $enabled },
  query: (params) => {
    expectTypeOf(params).toEqualTypeOf<{ id: number; enabled: boolean }>()
    return { ...todoOptions(params), enabled: params.enabled }
  },
  enabled: $enabled,
  refetchInterval: (query) => {
    expectTypeOf(query.state.data).toEqualTypeOf<Todo | undefined>()
    return false
  },
})

const pages = (id: number) =>
  infiniteQueryOptions({
    queryKey: ['pages', id],
    initialPageParam: 0,
    queryFn: async ({ pageParam }) => ({ id, cursor: pageParam + 1 }),
    getNextPageParam: (page) => page.cursor,
    select: (data) => data.pages.map((page) => page.id),
  })
const infinite = createInfiniteQuery({ source: $id, query: pages })
const explicitInfinite = createInfiniteQuery(client, {
  source: $id,
  query: pages,
})
expectTypeOf(infinite.$data).toEqualTypeOf<Store<number[] | undefined>>()
expectTypeOf(explicitInfinite.$data).toEqualTypeOf<
  Store<number[] | undefined>
>()

const mixed = {
  source: $id,
  query: (id: number) => todoOptions({ id }),
  queryKey: ['wrong'],
}
// Existing inline option objects may have unrelated extra properties.
// A queryKey selects inline, just as before factory support.
createQuery(mixed)
// Spreading those objects into an inline definition remains valid.
createQuery({ ...mixed, queryFn: () => 1 })
// @ts-expect-error source must contain stores, not plain values
createQuery({ source: { id: 1 }, query: todoOptions })
// @ts-expect-error event sources are not supported
createQuery({
  source: createEvent<number>(),
  query: (id: number) => todoOptions({ id }),
})
// @ts-expect-error factory must return options synchronously
createQuery({ source: $id, query: async (id: number) => todoOptions({ id }) })
// @ts-expect-error callback enabled is not an adapter override
createQuery({ source: { id: $id }, query: todoOptions, enabled: () => true })
// @ts-expect-error source shape must match the factory parameter
createQuery({ source: { wrong: $id }, query: todoOptions })
// @ts-expect-error infinite factories require page options
createInfiniteQuery({ source: { id: $id }, query: todoOptions })
