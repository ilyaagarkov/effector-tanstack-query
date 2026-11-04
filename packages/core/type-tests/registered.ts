import { expectTypeOf } from 'vitest'
import { createStore } from 'effector'
import type { Store } from 'effector'
import {
  createQuery,
  createInfiniteQuery,
  queryOptions,
  infiniteQueryOptions,
  createMutation,
  mutationOptions,
} from '../.type-tests-dist/index'
import type { CallRollback } from '../src/__tests__/upstream'

class ApplicationError extends Error {
  kind = 'application'
}
type ApplicationKey = readonly ['app', ...unknown[]]
interface AppMeta extends Record<string, unknown> {
  audit: boolean
}

declare module '@tanstack/query-core' {
  interface Register {
    defaultError: ApplicationError
    queryKey: ApplicationKey
    queryMeta: AppMeta
  }
}

const $id = createStore(1)
const query = createQuery({
  source: $id,
  query: (id) =>
    queryOptions({
      queryKey: ['app', id],
      queryFn: async () => id,
      meta: { audit: true },
    }),
})
expectTypeOf(query.$error).toEqualTypeOf<Store<ApplicationError | null>>()
const infinite = createInfiniteQuery({
  source: $id,
  query: (id) =>
    infiniteQueryOptions({
      queryKey: ['app', id],
      initialPageParam: 0,
      queryFn: async ({ pageParam }) => id + pageParam,
      getNextPageParam: (last) => last + 1,
    }),
})
expectTypeOf(infinite.$error).toEqualTypeOf<Store<ApplicationError | null>>()
const inline = createQuery({
  queryKey: ['app', $id],
  queryFn: ({ queryKey }) => queryKey[1],
})
expectTypeOf(inline.$data).toEqualTypeOf<Store<number | undefined>>()
expectTypeOf(inline.$error).toEqualTypeOf<Store<Error | null>>()
// @ts-expect-error registered keys must begin with app
queryOptions({ queryKey: ['wrong'], queryFn: () => 1 })
// @ts-expect-error registered metadata requires audit
queryOptions({ queryKey: ['app'], meta: {}, queryFn: () => 1 })

// Legacy inline queries retain their Error default and EffectorQueryKey.
// Factory/helper key and error defaults follow Query Core's Register.
// Registered queryMeta applies to both forms.
const legacyKey: import('../.type-tests-dist/index').EffectorQueryKey = [
  'legacy',
  $id,
]
void legacyKey

// #22: mutation factories follow the registered default error, including a
// nested helper with a spread (which inferred `null` in an early prototype).
const baseMutation = (id: number) =>
  mutationOptions({
    mutationKey: ['todo', id],
    mutationFn: async (title: string) => ({ id, title }),
  })
const factoryMutation = createMutation({ source: $id, mutation: baseMutation })
expectTypeOf(factoryMutation.$error).toEqualTypeOf<
  Store<ApplicationError | null>
>()
const nestedMutation = createMutation({
  source: $id,
  mutation: (id) =>
    mutationOptions({
      ...baseMutation(id),
      onMutate: async (title) => ({ previous: title }),
    }),
})
expectTypeOf(nestedMutation.$error).toEqualTypeOf<
  Store<ApplicationError | null>
>()
nestedMutation.mutateWith({
  variables: 'x',
  onError: (error, _variables, rollback) => {
    expectTypeOf(error).toEqualTypeOf<ApplicationError>()
    expectTypeOf(rollback).toEqualTypeOf<
      CallRollback<{ previous: string }, 'onError'>
    >()
  },
})
// The legacy inline mutation keeps its Error default.
const inlineMutation = createMutation({ mutationFn: async (n: number) => n })
expectTypeOf(inlineMutation.$error).toEqualTypeOf<Store<Error | null>>()
