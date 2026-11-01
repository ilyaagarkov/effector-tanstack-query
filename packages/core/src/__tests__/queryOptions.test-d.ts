import { expectTypeOf } from 'vitest'
import { QueryClient, skipToken } from '@tanstack/query-core'
import type { InfiniteData } from '@tanstack/query-core'
import { queryOptions, infiniteQueryOptions } from '../index'

type Todo = { id: number; title: string }
const client = new QueryClient()
const todoOptions = (id: number) =>
  queryOptions({
    queryKey: ['todo', { id }] as const,
    queryFn: ({ queryKey, signal }) => {
      expectTypeOf(signal).toEqualTypeOf<AbortSignal>()
      expectTypeOf(queryKey[1].id).toEqualTypeOf<number>()
      return Promise.resolve({ id, title: 'Todo' })
    },
    select: (todo) => {
      expectTypeOf(todo).toEqualTypeOf<Todo>()
      return todo.title
    },
  })
const options = todoOptions(1)
expectTypeOf(client.getQueryData(options.queryKey)).toEqualTypeOf<
  Todo | undefined
>()
client.setQueryData(options.queryKey, (previous) => {
  expectTypeOf(previous).toEqualTypeOf<Todo | undefined>()
  return { id: 2, title: 'Updated' }
})
// The tag describes cache data, not the selected string.
// @ts-expect-error selected values cannot be written to the raw cache
client.setQueryData(options.queryKey, 'wrong')

const defined = queryOptions({
  queryKey: ['defined'],
  queryFn: () => 1,
  initialData: 0,
})
expectTypeOf(defined.initialData).exclude<Function>().toEqualTypeOf<number>()
const conditional = queryOptions({
  queryKey: ['conditional'],
  queryFn: Math.random() ? () => 1 : skipToken,
})
expectTypeOf(client.getQueryData(conditional.queryKey)).toEqualTypeOf<
  number | undefined
>()

const pages = infiniteQueryOptions({
  queryKey: ['pages'],
  initialPageParam: 0,
  queryFn: ({ pageParam }) => {
    expectTypeOf(pageParam).toEqualTypeOf<number>()
    return Promise.resolve({ next: pageParam + 1 })
  },
  getNextPageParam: (page) => {
    expectTypeOf(page).toEqualTypeOf<{ next: number }>()
    return page.next
  },
  select: (data) => {
    expectTypeOf(data).toEqualTypeOf<InfiniteData<{ next: number }, number>>()
    return data.pages.map((page) => page.next)
  },
})
expectTypeOf(client.getQueryData(pages.queryKey)).toEqualTypeOf<
  InfiniteData<{ next: number }> | undefined
>()
expectTypeOf(client.fetchInfiniteQuery(pages)).toEqualTypeOf<
  Promise<InfiniteData<{ next: number }, number>>
>()
client.setQueryData(pages.queryKey, {
  pages: [{ next: 1 }, { next: 2 }],
  pageParams: [0, 1],
})
// @ts-expect-error selected values cannot be written to the raw infinite cache
client.setQueryData(pages.queryKey, [1, 2])
