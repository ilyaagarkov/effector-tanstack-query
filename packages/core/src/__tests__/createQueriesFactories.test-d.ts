// #23: `createQueries` accepts ready-made options factories, like the
// factory form of `createQuery`. `queryOptions` returns
// `enabled?: boolean | ((query) => boolean)`, which the item options used to
// reject.
import { createStore } from 'effector'
import type { Query } from '@tanstack/query-core'
import { expectTypeOf } from 'vitest'
import { createQueries, queryOptions } from '../index'
import type { QueriesResult } from '../index'

type Todo = { id: number; title: string }
const $ids = createStore<number[]>([1, 2])
const getTodo = async (id: number): Promise<Todo> => ({ id, title: '' })

// A ready-made local factory, passed directly.
const todoOptions = (id: number) =>
  queryOptions({ queryKey: ['todo', id], queryFn: () => getTodo(id) })
const todos = createQueries({ name: 'todos', source: $ids, query: todoOptions })
expectTypeOf(todos).toEqualTypeOf<QueriesResult<number, Todo, Error>>()

// A selecting factory: items carry the selected data.
const titleOptions = (id: number) =>
  queryOptions({
    queryKey: ['todo', id],
    queryFn: () => getTodo(id),
    select: (todo) => todo.title,
  })
const titles = createQueries({ name: 'titles', source: $ids, query: titleOptions })
expectTypeOf(titles).toEqualTypeOf<QueriesResult<number, string, Error>>()

// TanStack's callback `enabled`, evaluated against the cached query —
// defined in the factory, as ready-made factories do.
const lazyTodoOptions = (id: number) =>
  queryOptions({
    queryKey: ['todo', id],
    queryFn: () => getTodo(id),
    enabled: (query) => query.state.data === undefined,
  })
createQueries({ name: 'todos.callback', source: $ids, query: lazyTodoOptions })

// Added on top of a spread factory, the callback needs its parameter typed:
// TypeScript types it before inferring the factory's data.
createQueries({
  name: 'todos.callback.spread',
  source: $ids,
  query: (id) => ({
    ...todoOptions(id),
    enabled: (query: Query<Todo, Error, Todo, (string | number)[]>) =>
      query.state.data === undefined,
  }),
})

// Object items keep their type in the factory.
const $params = createStore([{ todoId: 1 }])
const byParams = createQueries({
  name: 'todos.params',
  source: $params,
  query: ({ todoId }) => todoOptions(todoId),
})
expectTypeOf(byParams).toEqualTypeOf<
  QueriesResult<{ todoId: number }, Todo, Error>
>()

// Family-wide settings still apply alongside a factory.
createQueries({ name: 'todos.shared', source: $ids, query: todoOptions, staleTime: 1_000 })

// A plain boolean still works, a non-boolean doesn't.
createQueries({
  name: 'todos.enabled',
  source: $ids,
  query: (id) => ({ ...todoOptions(id), enabled: id > 0 }),
})
createQueries({
  name: 'todos.badEnabled',
  source: $ids,
  // @ts-expect-error enabled is a boolean or a callback
  query: (id) => ({ ...todoOptions(id), enabled: 'yes' }),
})
