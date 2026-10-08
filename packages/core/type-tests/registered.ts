import { expectTypeOf } from 'vitest'
import { createStore } from 'effector'
import type { Store } from 'effector'
import {
  createQuery,
  createInfiniteQuery,
  queryOptions,
  infiniteQueryOptions,
} from '../.type-tests-dist/index'

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
