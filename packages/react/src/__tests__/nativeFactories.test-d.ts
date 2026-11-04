import { expectTypeOf } from 'vitest'
import { createStore } from 'effector'
import type { Store } from 'effector'
import type { InfiniteData } from '@tanstack/query-core'
import {
  queryOptions,
  infiniteQueryOptions,
  mutationOptions as nativeMutationOptions,
  useMutation as useNativeMutation,
  useQuery as useNativeQuery,
} from '@tanstack/react-query'
import {
  createQuery,
  createInfiniteQuery,
  createQueries,
  createMutation,
  mutationOptions as coreMutationOptions,
  queryOptions as coreQueryOptions,
} from '@effector-tanstack-query/core'
import {
  useQuery,
  useSuspenseQuery,
  useInfiniteQuery,
  useQueries,
  useSuspenseQueries,
  useMutation,
} from '../index'

const $id = createStore(1)
const options = (id: number) =>
  queryOptions({
    queryKey: ['native', id],
    queryFn: async () => ({ id, title: 'todo' }),
  })
const query = createQuery({ source: $id, query: options })
expectTypeOf(query.$data).toEqualTypeOf<
  Store<{ id: number; title: string } | undefined>
>()
expectTypeOf(useQuery(query).data).toEqualTypeOf<
  { id: number; title: string } | undefined
>()
expectTypeOf(useSuspenseQuery(query).data).toEqualTypeOf<{
  id: number
  title: string
}>()

const selected = createQuery({
  source: $id,
  query: (id: number) => ({
    ...options(id),
    select: (todo) => {
      expectTypeOf(todo).toEqualTypeOf<{ id: number; title: string }>()
      return todo.title
    },
    enabled: id > 0,
  }),
})
expectTypeOf(useQuery(selected).data).toEqualTypeOf<string | undefined>()
const coreOptions = coreQueryOptions({ queryKey: ['core'], queryFn: () => 1 })
expectTypeOf(useNativeQuery(coreOptions).data).toEqualTypeOf<
  number | undefined
>()

const infinite = createInfiniteQuery({
  source: $id,
  query: (id) =>
    infiniteQueryOptions({
      queryKey: ['native-pages', id],
      initialPageParam: 0,
      queryFn: ({ pageParam }) => {
        expectTypeOf(pageParam).toEqualTypeOf<number>()
        return { next: pageParam + 1 }
      },
      getNextPageParam: (page) => {
        expectTypeOf(page).toEqualTypeOf<{ next: number }>()
        return page.next
      },
      select: (data) => {
        expectTypeOf(data).toEqualTypeOf<
          InfiniteData<{ next: number }, number>
        >()
        return data.pages.map((page) => page.next)
      },
    }),
})
expectTypeOf(useInfiniteQuery(infinite).data).toEqualTypeOf<
  number[] | undefined
>()

// #23: the same native factory feeds a `createQueries` family and its hooks.
const $ids = createStore([1, 2])
const family = createQueries({ name: 'native.family', source: $ids, query: options })
expectTypeOf(family.$data).toEqualTypeOf<
  Store<ReadonlyArray<{ id: number; title: string } | undefined>>
>()
function familyProbe() {
  return { items: useQueries(family), suspense: useSuspenseQueries(family) }
}
expectTypeOf<ReturnType<typeof familyProbe>['items'][number]['data']>().toEqualTypeOf<
  { id: number; title: string } | undefined
>()
expectTypeOf<ReturnType<typeof familyProbe>['suspense'][number]['data']>().toEqualTypeOf<
  { id: number; title: string }
>()

// #22: native mutationOptions factories with a reactive source.
const nativeRename = ({ id }: { id: number }) =>
  nativeMutationOptions({
    mutationKey: ['rename', id],
    mutationFn: async (title: string) => ({ id, title }),
    onMutate: async (title) => ({ previous: title }),
  })
const renameMutation = createMutation({
  source: { id: $id },
  mutation: nativeRename,
})
function renameProbe() {
  const { data, mutateWith } = useMutation(renameMutation)
  expectTypeOf(data).toEqualTypeOf<{ id: number; title: string } | undefined>()
  mutateWith({
    variables: 'x',
    onError: (error, variables, rollback) => {
      expectTypeOf(error).toEqualTypeOf<Error>()
      expectTypeOf(variables).toEqualTypeOf<string>()
      expectTypeOf(rollback).toEqualTypeOf<{ previous: string } | undefined>()
    },
  })
}
void renameProbe
// Our helper's output works with the native hook.
const coreRename = coreMutationOptions({
  mutationFn: async (title: string) => title,
})
expectTypeOf(useNativeMutation(coreRename).data).toEqualTypeOf<
  string | undefined
>()
