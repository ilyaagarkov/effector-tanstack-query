import { skipToken } from '@tanstack/query-core'
import {
  createQuery,
  createInfiniteQuery,
  queryOptions,
  infiniteQueryOptions,
} from '@effector-tanstack-query/core'
import type { SourceValue } from '@effector-tanstack-query/core'
import type { Store } from 'effector'

export const todoOptions = (id: number) => queryOptions({
  queryKey: ['todo', id] as const,
  queryFn: () => ({ id, title: 'todo' }),
  select: todo => todo.title,
})
export const pageOptions = (id: number) => infiniteQueryOptions({
  queryKey: ['pages', id] as const,
  initialPageParam: { after: 0 },
  queryFn: ({ pageParam }) => ({ id, next: pageParam.after + 1 }),
  getNextPageParam: page => ({ after: page.next }),
  select: data => data.pages.map(page => page.next),
})

export const initialTodoOptions = (id: number) => queryOptions({
  ...todoOptions(id), initialData: { id, title: 'initial' },
})
export const skippedTodoOptions = (id: number) => queryOptions({
  ...todoOptions(id), queryFn: id < 0 ? skipToken : () => ({ id, title: 'todo' }),
})
export const initialPageOptions = (id: number) => infiniteQueryOptions({
  ...pageOptions(id), initialData: { pages: [{ id, next: 1 }], pageParams: [{ after: 0 }] },
})
export const skippedPageOptions = (id: number) => infiniteQueryOptions({
  ...pageOptions(id), queryFn: id < 0 ? skipToken : () => ({ id, next: 1 }),
})


export const tupleSourceQuery = (id: Store<number>, filter: Store<string>) =>
  createQuery({
    source: [id, filter],
    query: ([id, filter]) => ({
      queryKey: ['exported-source', id, filter],
      queryFn: () => filter,
    }),
  })
export const tupleSourcePages = (id: Store<number>, filter: Store<string>) =>
  createInfiniteQuery({
    source: [id, filter],
    query: ([id, filter]) => infiniteQueryOptions({
      queryKey: ['exported-pages', id, filter],
      initialPageParam: 0,
      queryFn: ({ pageParam }) => id + pageParam,
      getNextPageParam: () => undefined,
      select: data => filter + data.pages.join(','),
    }),
  })
export type SourceSnapshot = SourceValue<readonly [Store<number>, Store<string>]>
