import { createStore } from 'effector'
import { QueryClient } from '@tanstack/query-core'
import type { InfiniteData, QueryKey } from '@tanstack/query-core'
import { expectTypeOf } from 'vitest'
import type { InfiniteOptions } from '../optionsCompat'
import { resolveQueryDefinition } from '../resolve'

type Page = { value: number }
type Native = InfiniteOptions<Page, Error, string, QueryKey, number>
const client = new QueryClient()
const definition = resolveQueryDefinition<Native>({
  source: createStore(2),
  query: (value) => ({
    queryKey: ['page', value],
    initialPageParam: 0,
    queryFn: ({ pageParam }) => ({ value: value + pageParam }),
    getNextPageParam: (_last, _pages, previous) => previous + 1,
    select: (data) => String(data.pages.length),
  }),
})
const options = definition.prefetch(definition.$options.getState())
expectTypeOf(options.initialPageParam).toEqualTypeOf<number>()
const fetched = client.fetchInfiniteQuery(options)
expectTypeOf(fetched).toEqualTypeOf<Promise<InfiniteData<Page, number>>>()

resolveQueryDefinition<Native>({
  source: createStore(1),
  // @ts-expect-error infinite factory must provide initialPageParam
  query: () => ({
    queryKey: ['missing'],
    queryFn: () => ({ value: 1 }),
    getNextPageParam: () => 1,
  }),
})
resolveQueryDefinition<Native>({
  source: createStore(1),
  query: () => ({
    queryKey: ['wrong'],
    // @ts-expect-error page parameter cannot change from number to string
    initialPageParam: 'wrong',
    queryFn: () => ({ value: 1 }),
    getNextPageParam: () => 1,
  }),
})
resolveQueryDefinition<Native>({
  source: createStore(1),
  query: () => ({
    queryKey: ['wrong-data'],
    initialPageParam: 0,
    // @ts-expect-error raw query data must remain Page
    queryFn: () => 'wrong',
    getNextPageParam: () => 1,
  }),
})
const inline = resolveQueryDefinition<Native>({
  queryKey: ['inline'],
  initialPageParam: 0,
  queryFn: ({ pageParam }) => ({ value: pageParam }),
  getNextPageParam: (_last, _pages, previous) => previous + 1,
  select: (data) => String(data.pages.length),
  refetchInterval: createStore<number | false | undefined>(false),
})
expectTypeOf(
  client.fetchInfiniteQuery(inline.prefetch(inline.$options.getState())),
).toEqualTypeOf<Promise<InfiniteData<Page, number>>>()
const finite = resolveQueryDefinition({
  queryKey: ['finite'],
  queryFn: () => 1,
})
client.fetchQuery(finite.prefetch(finite.$options.getState()))
// @ts-expect-error a finite definition does not promise infinite page options
client.fetchInfiniteQuery(finite.prefetch(finite.$options.getState()))
