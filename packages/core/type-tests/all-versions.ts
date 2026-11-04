// Consumer-facing types that must hold on every @tanstack/query-core 5.x in
// the peer range. The CI matrix checks this file on all versions, including
// those below 5.80 where the full type tests don't apply (see
// .github/workflows/compat.yml). Use only API that Query Core 5.0 has.
import { expectTypeOf } from 'vitest'
import { createStore } from 'effector'
import type { Store } from 'effector'
import { QueryClient } from '@tanstack/query-core'
import type { InfiniteData } from '@tanstack/query-core'
import {
  createInfiniteQuery,
  createMutation,
  createQueries,
  createQuery,
  infiniteQueryOptions,
  mutationOptions,
  queryOptions,
} from '../src/index'
import type { MutationResult } from '../src/index'

type Todo = { id: number; title: string }
type Page = { items: Todo[]; next: number | null }
class ApiError extends Error {
  status = 500
}
const client = new QueryClient()
const $id = createStore(1)
declare function getTodo(id: number): Promise<Todo>
declare function getPage(cursor: number): Promise<Page>

// --- createQuery, inline form.
const inline = createQuery({
  queryKey: ['todo', $id],
  queryFn: ({ queryKey }) => getTodo(queryKey[1]),
})
expectTypeOf(inline.$data).toEqualTypeOf<Store<Todo | undefined>>()
expectTypeOf(inline.$error).toEqualTypeOf<Store<Error | null>>()
const inlineSelected = createQuery(client, {
  queryKey: ['todo', $id],
  queryFn: ({ queryKey }) => getTodo(queryKey[1]),
  select: (todo) => todo.title,
})
expectTypeOf(inlineSelected.$data).toEqualTypeOf<Store<string | undefined>>()

// --- createQuery, factory form, with the core helper and a typed key.
const todoOptions = (id: number) =>
  queryOptions({ queryKey: ['todo', id], queryFn: () => getTodo(id) })
const factory = createQuery({ source: $id, query: todoOptions })
expectTypeOf(factory.$data).toEqualTypeOf<Store<Todo | undefined>>()
expectTypeOf(factory.$error).toEqualTypeOf<Store<Error | null>>()
expectTypeOf(client.getQueryData(todoOptions(1).queryKey)).toEqualTypeOf<
  Todo | undefined
>()
const selected = createQuery(client, {
  source: { id: $id },
  query: ({ id }) =>
    queryOptions({
      queryKey: ['todo', id],
      queryFn: () => getTodo(id),
      select: (todo) => todo.title,
    }),
  enabled: createStore(true),
})
expectTypeOf(selected.$data).toEqualTypeOf<Store<string | undefined>>()
// @ts-expect-error the factory must match the source value
createQuery({ source: createStore('id'), query: todoOptions })

// --- createInfiniteQuery, both forms.
const infinite = createInfiniteQuery({
  queryKey: ['pages'],
  initialPageParam: 0,
  queryFn: ({ pageParam }) => getPage(pageParam),
  getNextPageParam: (last) => last.next ?? undefined,
})
expectTypeOf(infinite.$data).toEqualTypeOf<
  Store<InfiniteData<Page, number> | undefined>
>()
const pagesOptions = (category: string) =>
  infiniteQueryOptions({
    queryKey: ['pages', category],
    initialPageParam: 0,
    queryFn: ({ pageParam }) => getPage(pageParam),
    getNextPageParam: (last) => last.next ?? undefined,
    select: (data) => data.pages.flatMap((page) => page.items),
  })
const infiniteFactory = createInfiniteQuery({
  source: createStore('all'),
  query: pagesOptions,
})
expectTypeOf(infiniteFactory.$data).toEqualTypeOf<Store<Todo[] | undefined>>()
expectTypeOf(infiniteFactory.$hasNextPage).toEqualTypeOf<Store<boolean>>()
expectTypeOf(infiniteFactory.$isFetchNextPageError).toEqualTypeOf<
  Store<boolean>
>()

// --- createQueries.
const family = createQueries({
  source: createStore([1, 2]),
  query: todoOptions,
})
expectTypeOf(family.$data).toEqualTypeOf<
  Store<ReadonlyArray<Todo | undefined>>
>()

// --- createMutation, inline form.
const inlineMutation = createMutation({
  mutationFn: (patch: { title: string }) => getTodo(patch.title.length),
})
expectTypeOf(inlineMutation).toEqualTypeOf<
  MutationResult<Todo, Error, { title: string }, unknown>
>()

// --- createMutation, factory form with the core helper.
const renameOptions = ({ id }: { id: number }) =>
  mutationOptions({
    mutationKey: ['rename', id],
    mutationFn: async (title: string): Promise<Todo> => ({ id, title }),
    onMutate: async (title) => ({ previous: title }),
  })
const rename = createMutation({ source: { id: $id }, mutation: renameOptions })
expectTypeOf(rename).toEqualTypeOf<
  MutationResult<Todo, Error, string, { previous: string }>
>()
rename.mutateWith({
  variables: 'x',
  onError: (error, variables, rollback) => {
    expectTypeOf(error).toEqualTypeOf<Error>()
    expectTypeOf(variables).toEqualTypeOf<string>()
    // Nullability of the onMutate result varies across 5.x; its type doesn't.
    expectTypeOf<NonNullable<typeof rollback>>().toEqualTypeOf<{
      previous: string
    }>()
  },
})
const customError = createMutation(client, {
  source: $id,
  mutation: (id) =>
    mutationOptions<Todo, ApiError, string>({
      mutationFn: async (title) => ({ id, title }),
    }),
})
expectTypeOf(customError.$error).toEqualTypeOf<Store<ApiError | null>>()
// @ts-expect-error mutation options belong inside the factory
createMutation({ source: $id, mutation: renameOptions.bind(null, { id: 1 }), retry: 1 })
