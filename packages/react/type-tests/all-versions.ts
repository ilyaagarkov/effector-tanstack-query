// React hook types that must hold on every @tanstack/query-core /
// react-query 5.x in the peer range (see ../../core/type-tests/all-versions.ts).
import { expectTypeOf } from 'vitest'
import { createStore } from 'effector'
import type { InfiniteData } from '@tanstack/query-core'
import {
  createInfiniteQuery,
  createMutation,
  createQuery,
  mutationOptions,
  queryOptions,
} from '@effector-tanstack-query/core'
import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useSuspenseQuery,
} from '../src/index'

type Todo = { id: number; title: string }
declare function getTodo(id: number): Promise<Todo>
const $id = createStore(1)

const todo = createQuery({
  source: $id,
  query: (id) => queryOptions({ queryKey: ['todo', id], queryFn: () => getTodo(id) }),
})
const pages = createInfiniteQuery({
  queryKey: ['pages'],
  initialPageParam: 0,
  queryFn: ({ pageParam }) => getTodo(pageParam),
  getNextPageParam: (last) => last.id + 1,
})
const rename = createMutation({
  source: { id: $id },
  mutation: ({ id }) =>
    mutationOptions({
      mutationFn: async (title: string): Promise<Todo> => ({ id, title }),
      onMutate: async (title) => ({ previous: title }),
    }),
})

export function probe() {
  const query = useQuery(todo)
  expectTypeOf(query.data).toEqualTypeOf<Todo | undefined>()
  expectTypeOf(query.error).toEqualTypeOf<Error | null>()
  expectTypeOf(useSuspenseQuery(todo).data).toEqualTypeOf<Todo>()
  expectTypeOf(useInfiniteQuery(pages).data).toEqualTypeOf<
    InfiniteData<Todo, number> | undefined
  >()
  const mutation = useMutation(rename)
  expectTypeOf(mutation.data).toEqualTypeOf<Todo | undefined>()
  mutation.mutateWith({
    variables: 'x',
    onError: (_error, _variables, rollback) => {
      expectTypeOf<NonNullable<typeof rollback>>().toEqualTypeOf<{
        previous: string
      }>()
    },
  })
}
