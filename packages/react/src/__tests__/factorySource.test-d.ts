import { createStore } from 'effector'
import { expectTypeOf } from 'vitest'
import {
  createInfiniteQuery,
  createQuery,
  infiniteQueryOptions,
  queryOptions,
} from '@effector-tanstack-query/core'
import {
  useInfiniteQuery,
  useQuery,
  useSuspenseInfiniteQuery,
  useSuspenseQueries,
  useSuspenseQuery,
} from '../index'

const $id = createStore(1)
const $label = createStore('item')
const query = createQuery({
  source: [$id, $label],
  query: ([id, label]) => queryOptions({
    queryKey: ['tuple', id, label],
    queryFn: () => ({ id, label }),
    select: (data) => data.label,
  }),
})
expectTypeOf(useQuery(query).data).toEqualTypeOf<string | undefined>()
expectTypeOf(useSuspenseQuery(query).data).toEqualTypeOf<string>()
const count = createQuery({
  source: [$id],
  query: ([id]) => ({ queryKey: ['count', id], queryFn: () => id }),
})
const [label, number] = useSuspenseQueries([query, count] as const)
expectTypeOf(label.data).toEqualTypeOf<string>()
expectTypeOf(number.data).toEqualTypeOf<number>()

const pages = createInfiniteQuery({
  source: [$id, $label] as const,
  query: ([id, label]) =>
    infiniteQueryOptions({
      queryKey: ['pages', id, label],
      initialPageParam: 0,
      queryFn: ({ pageParam }) => id + pageParam,
      getNextPageParam: () => undefined,
      select: (data) => data.pages.map((page) => `${label}:${page}`),
    }),
})
expectTypeOf(useInfiniteQuery(pages).data).toEqualTypeOf<string[] | undefined>()
expectTypeOf(useSuspenseInfiniteQuery(pages).data).toEqualTypeOf<string[]>()
