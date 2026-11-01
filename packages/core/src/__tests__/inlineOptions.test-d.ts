import { createStore, combine } from 'effector'
import type { Store } from 'effector'
import { QueryClient } from '@tanstack/query-core'
import { createQuery, createInfiniteQuery } from '../index'
import type {
  CreateQueryOptions,
  CreateInfiniteQueryOptions,
  EffectorQueryKey,
  QueryResult,
} from '../index'

const client = new QueryClient()
const $id = createStore(1)
const $params = combine({
  id: $id,
  nested: combine({ language: createStore('en') }),
})
const $enabled = $id.map((id) => id > 0)
const $interval = createStore<number | false | undefined>(false)
class CustomError extends Error {
  code = 'APP'
}

const stored = {
  queryKey: ['todos', $params] as const,
  queryFn: ({
    queryKey: [, params],
  }: {
    queryKey: readonly ['todos', { id: number; nested: { language: string } }]
  }) => params.id,
  source: 'extra metadata',
  query: 'extra metadata',
  enabled: $enabled,
  refetchInterval: $interval,
}
const plain = createQuery(stored)
const explicit = createQuery(client, { ...stored })
const selected = createQuery(client, {
  ...stored,
  select: (value) => `${value}`,
})
const numberData: Store<number | undefined> = plain.$data
const explicitData: Store<number | undefined> = explicit.$data
const selectedData: Store<string | undefined> = selected.$data
const generic: QueryResult<string, CustomError> = createQuery<
  string,
  CustomError
>(client, {
  queryKey: ['typed'],
  queryFn: () => 'ok',
})
const instantiation: ReturnType<typeof createQuery<string, CustomError>> =
  generic
const inline: CreateQueryOptions<number> = {
  queryKey: ['inline', $id],
  queryFn: () => 1,
}
const pages: CreateInfiniteQueryOptions<number, Error, number> = {
  queryKey: ['pages', $id],
  initialPageParam: 0,
  queryFn: ({ pageParam }) => Number(pageParam),
  getNextPageParam: (last) => last + 1,
}
createInfiniteQuery(client, pages)
createInfiniteQuery(pages)
createInfiniteQuery<number, CustomError, number>(client, {
  queryKey: ['generic-pages'],
  initialPageParam: 0,
  queryFn: () => 1,
  getNextPageParam: (last) => last + 1,
})
const infiniteInstantiation:
  | ReturnType<typeof createInfiniteQuery<number>>
  | undefined = undefined
const key: EffectorQueryKey = ['key', null, undefined, 1, true, {}, $id]
// @ts-expect-error symbols were not accepted as inline key elements
const symbolKey: EffectorQueryKey = [Symbol('key')]
// @ts-expect-error query key is required
createQuery({ queryFn: () => 1 })
// @ts-expect-error the old enabled contract is boolean or Store<boolean>
createQuery({ queryKey: ['enabled'], queryFn: () => 1, enabled: () => true })
void [
  numberData,
  explicitData,
  selectedData,
  instantiation,
  infiniteInstantiation,
  inline,
  key,
  symbolKey,
]
