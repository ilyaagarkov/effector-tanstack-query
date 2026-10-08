import { combine, createEffect, createEvent, createStore, sample } from 'effector'
import type { Store } from 'effector'
import { QueryClient } from '@tanstack/query-core'
import type { InfiniteData } from '@tanstack/query-core'
import { expectTypeOf } from 'vitest'
import {
  createQuery,
  createInfiniteQuery,
  queryOptions,
  infiniteQueryOptions,
} from '../index'
import type { OptionsSource, SourceValue } from '../index'

const $id = createStore(1)
const $filter = createStore('active')
const client = new QueryClient()
const tuple = [$id, $filter] as const
const shape = { id: $id, filter: $filter } as const
const list: Store<number>[] = [$id]
const readonlyList: readonly Store<number>[] = [$id]

expectTypeOf<SourceValue<typeof $id>>().toEqualTypeOf<number>()
expectTypeOf<SourceValue<typeof tuple>>().toEqualTypeOf<readonly [number, string]>()
expectTypeOf<SourceValue<typeof shape>>().toEqualTypeOf<{
  readonly id: number
  readonly filter: string
}>()
expectTypeOf<SourceValue<typeof list>>().toEqualTypeOf<number[]>()
expectTypeOf<SourceValue<typeof readonlyList>>().toEqualTypeOf<readonly number[]>()

sample({
  source: tuple,
  fn: (value) => {
    expectTypeOf(value).toEqualTypeOf<readonly [number, string]>()
    return value
  },
})
sample({
  source: shape,
  fn: (value) => {
    expectTypeOf(value).toEqualTypeOf<{
      readonly id: number
      readonly filter: string
    }>()
    return value
  },
})

createQuery({
  source: $id,
  query: (value) => {
    expectTypeOf(value).toEqualTypeOf<number>()
    return { queryKey: ['store', value], queryFn: () => value }
  },
})
createQuery({
  source: { id: $id, filter: $filter },
  query: (value) => {
    expectTypeOf(value).toEqualTypeOf<{ id: number; filter: string }>()
    return { queryKey: ['object', value], queryFn: () => value.filter }
  },
})
const query = createQuery({
  source: [$id, $filter],
  query: (value) => {
    expectTypeOf(value).toEqualTypeOf<[number, string]>()
    return queryOptions({
      queryKey: ['tuple', ...value],
      queryFn: () => ({ id: value[0], filter: value[1] }),
      select: (data) => data.filter,
    })
  },
})
expectTypeOf(query.$data).toEqualTypeOf<Store<string | undefined>>()
const explicitQuery = createQuery(client, {
  source: tuple,
  query: (value) => {
    expectTypeOf(value).toEqualTypeOf<readonly [number, string]>()
    // @ts-expect-error readonly tuple entries remain readonly
    value[0] = 2
    return { queryKey: ['readonly', ...value], queryFn: () => value[0] }
  },
})
expectTypeOf(explicitQuery.$data).toEqualTypeOf<Store<number | undefined>>()
createQuery({
  source: list,
  query: (value) => {
    expectTypeOf(value).toEqualTypeOf<number[]>()
    return { queryKey: ['list'], queryFn: () => value.length }
  },
})
createQuery({
  source: readonlyList,
  query: (value) => {
    expectTypeOf(value).toEqualTypeOf<readonly number[]>()
    return { queryKey: ['readonly-list'], queryFn: () => value.length }
  },
})
createQuery({
  source: {},
  query: (value) => {
    expectTypeOf(value).toEqualTypeOf<{}>()
    return { queryKey: ['empty-object'], queryFn: () => 1 }
  },
})
createQuery({
  source: [],
  query: (value) => {
    expectTypeOf(value).toEqualTypeOf<[]>()
    return { queryKey: ['empty-array'], queryFn: () => 1 }
  },
})
createQuery({
  source: shape,
  query: (value) => {
    expectTypeOf(value).toEqualTypeOf<{
      readonly id: number
      readonly filter: string
    }>()
    // @ts-expect-error readonly source properties remain readonly
    value.id = 2
    return { queryKey: ['readonly-object', value.id], queryFn: () => value.filter }
  },
})
const $params = combine({ id: $id, filter: 'active' })
createQuery({
  source: $params,
  query: (value) => {
    expectTypeOf(value).toEqualTypeOf<{ id: number; filter: string }>()
    return { queryKey: ['combined', value], queryFn: () => value.id }
  },
})

const pages = createInfiniteQuery({
  source: [$id, $filter],
  query: (value) => {
    expectTypeOf(value).toEqualTypeOf<[number, string]>()
    return infiniteQueryOptions({
      queryKey: ['pages', ...value],
      initialPageParam: 0,
      queryFn: ({ pageParam }) => value[0] + pageParam,
      getNextPageParam: () => undefined,
      select: (data) => data.pages.join(','),
    })
  },
})
expectTypeOf(pages.$data).toEqualTypeOf<Store<string | undefined>>()
const explicitPages = createInfiniteQuery(client, {
  source: tuple,
  query: (value) => {
    expectTypeOf(value).toEqualTypeOf<readonly [number, string]>()
    return infiniteQueryOptions({
      queryKey: ['readonly-pages', ...value],
      initialPageParam: 0,
      queryFn: ({ pageParam }) => value[0] + pageParam,
      getNextPageParam: () => undefined,
    })
  },
})
// Native helper defaults retain unknown pageParams in observer data.
expectTypeOf(explicitPages.$data).toEqualTypeOf<
  Store<InfiniteData<number> | undefined>
>()

// @ts-expect-error plain fields are not supported in a source shape
const mixed: OptionsSource = { id: $id, filter: 'active' }
// @ts-expect-error plain array entries are not stores
const plainArray: OptionsSource = [$id, 'active']
// @ts-expect-error undefined is not a store
const undefinedArray: OptionsSource = [undefined]
// @ts-expect-error nested shapes require an explicit combine
const nested: OptionsSource = { nested: { id: $id } }
// @ts-expect-error event entries have no initial store snapshot
const eventArray: OptionsSource = [$id, createEvent<string>()]
// @ts-expect-error events are not store-based sources
const eventSource: OptionsSource = createEvent<number>()
// @ts-expect-error effects are not store-based sources
const effectSource: OptionsSource = createEffect<number, number>((value) => value)
// @ts-expect-error the callback must accept number/string in source order
createQuery({ source: tuple, query: ([id, filter]: readonly [string, number]) => ({ queryKey: ['wrong-order'], queryFn: () => id + filter }) })
const mixedSource = [$id, 'active'] as const
// @ts-expect-error factory calls must reject plain entries, even through a variable
createQuery({ source: mixedSource, query: () => ({ queryKey: ['mixed'], queryFn: () => 1 }) })
void [mixed, plainArray, undefinedArray, nested, eventArray, eventSource, effectSource]
