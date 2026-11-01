import { createStore } from 'effector'
import { expectTypeOf } from 'vitest'
import type { QueryKey } from '@tanstack/query-core'
import { resolveQueryDefinition } from '../resolve'

const source = createStore(1)
const definition = resolveQueryDefinition({
  queryKey: ['inline', source],
  queryFn: () => 'value',
  enabled: createStore(true),
  refetchInterval: createStore<number | false | undefined>(100),
})
const current = definition.$options.getState()
const initial = definition.create(current)
expectTypeOf(initial.queryKey).toEqualTypeOf<QueryKey>()
expectTypeOf(initial.enabled).toEqualTypeOf<boolean>()
// The constructor need not include a reactive interval.
// @ts-expect-error the interval is optional in constructor options
const requiredInterval: number = initial.refetchInterval

// Native previous options may have a callback; the adapter resolves enabled.
const updated = definition.update(
  { queryKey: ['previous'], enabled: () => false },
  current,
  false,
)
expectTypeOf(updated.enabled).toEqualTypeOf<boolean>()
const fetchOptions = definition.prefetch(current)
expectTypeOf(fetchOptions.queryKey).toEqualTypeOf<QueryKey>()
// @ts-expect-error prefetch does not promise an observer enabled setting
fetchOptions.enabled

resolveQueryDefinition({
  source,
  // @ts-expect-error a factory must provide a query key
  query: () => ({ queryFn: () => 'missing-key' }),
})
resolveQueryDefinition({
  queryKey: ['bad-interval'],
  // @ts-expect-error reactive intervals resolve to a number, false or undefined
  refetchInterval: createStore('invalid'),
})
const factory = resolveQueryDefinition({
  source,
  query: (id) => ({ queryKey: ['factory', id], queryFn: () => id }),
  refetchInterval: (query) => (query.state.dataUpdatedAt ? 100 : false),
})
expectTypeOf(factory.$options.getState().enabled).toEqualTypeOf<boolean>()
void requiredInterval
