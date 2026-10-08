import { createStore, type Store } from 'effector'
import { QueryClient, type InfiniteData } from '@tanstack/query-core'
import { expectTypeOf } from 'vitest'
import { createQuery, createInfiniteQuery, queryOptions } from '../index'
import type {
  CreateQueryOptions,
  CreateInfiniteQueryOptions,
} from '../index'

type Todo = { id: number; title: string }
const client = new QueryClient()
const $todoId = createStore(1)
const getTodo = async (): Promise<Todo> => ({ id: 1, title: 'todo' })
const titleOptions = () => ({
  queryKey: ['todo'],
  queryFn: getTodo,
  select: (todo: Todo) => todo.title,
})

// Explicit result generics must still describe inherited factory selection.
const title = createQuery<Todo, Error, string>({
  source: {},
  query: titleOptions,
})
const explicitTitle = createQuery<Todo, Error, string>(client, {
  source: {},
  query: titleOptions,
})
expectTypeOf(title.$data).toEqualTypeOf<Store<string | undefined>>()
expectTypeOf(explicitTitle.$data).toEqualTypeOf<Store<string | undefined>>()

const pageOptions = () => ({
  queryKey: ['pages'],
  queryFn: getTodo,
  initialPageParam: 0,
  getNextPageParam: () => undefined,
  select: (data: InfiniteData<Todo, number>) =>
    data.pages.map((todo) => todo.title).join(','),
})
const pages = createInfiniteQuery<Todo, Error, number, string>({
  source: {},
  query: pageOptions,
})
const explicitPages = createInfiniteQuery<Todo, Error, number, string>(client, {
  source: {},
  query: pageOptions,
})
expectTypeOf(pages.$data).toEqualTypeOf<Store<string | undefined>>()
expectTypeOf(explicitPages.$data).toEqualTypeOf<Store<string | undefined>>()

const todoOptions = ({ todoId }: { todoId: number }) =>
  queryOptions({ queryKey: ['todo', todoId], queryFn: getTodo })
const annotated = createQuery({
  source: { todoId: $todoId },
  query: ({ todoId }: { todoId: number }) => ({
    ...todoOptions({ todoId }),
    select: (todo) => {
      expectTypeOf(todo).toEqualTypeOf<Todo>()
      return todo.title
    },
  }),
})
expectTypeOf(annotated.$data).toEqualTypeOf<Store<string | undefined>>()

// Observer settings belong inside the factory, even for prebuilt option objects.
const selectedOptions = {
  source: {},
  query: titleOptions,
  select: (todo: Todo) => todo.id,
}
// @ts-expect-error select is not a factory-level override
createQuery(selectedOptions)
const selectedPages = {
  source: {},
  query: pageOptions,
  select: (data: InfiniteData<Todo, number>) => data.pages.length,
}
// @ts-expect-error select is not a factory-level override
createInfiniteQuery(selectedPages)
const staleTimeOverride = { staleTime: 0 }
const placeholderOverride = {
  placeholderData: { id: 1, title: 'placeholder' },
}
const infinitePlaceholderOverride = {
  placeholderData: {
    pages: [{ id: 1, title: 'placeholder' }],
    pageParams: [0],
  },
}
// @ts-expect-error staleTime must be returned by the query factory
createQuery({ source: {}, query: titleOptions, ...staleTimeOverride })
// @ts-expect-error placeholderData must be returned by the query factory
createQuery({ source: {}, query: titleOptions, ...placeholderOverride })
// @ts-expect-error staleTime must be returned by the infinite query factory
createInfiniteQuery({ source: {}, query: pageOptions, ...staleTimeOverride })
// @ts-expect-error placeholderData must be returned by the infinite query factory
createInfiniteQuery({ source: {}, query: pageOptions, ...infinitePlaceholderOverride })

// Parameters must keep seeing the legacy explicit-client signature.
expectTypeOf<Parameters<typeof createQuery<Todo, Error>>>().toEqualTypeOf<
  [queryClient: QueryClient, options: CreateQueryOptions<Todo, Error>]
>()
expectTypeOf<
  Parameters<typeof createInfiniteQuery<Todo, Error, number>>
>().toEqualTypeOf<
  [
    queryClient: QueryClient,
    options: CreateInfiniteQueryOptions<Todo, Error, number>,
  ]
>()

// Tuple arguments must not admit a missing options object or extra arguments.
// @ts-expect-error an explicit client requires options
createQuery(client)
// @ts-expect-error an explicit client requires options
createInfiniteQuery(client)
// @ts-expect-error calls accept at most two arguments
createQuery(client, { source: {}, query: titleOptions }, {})
// @ts-expect-error calls accept at most two arguments
createInfiniteQuery(client, { source: {}, query: pageOptions }, {})
