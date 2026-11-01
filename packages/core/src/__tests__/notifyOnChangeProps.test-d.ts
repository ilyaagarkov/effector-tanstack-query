// `notifyOnChangeProps` is not a factory option: the core observer always
// notifies on every change so the effector stores see all of them, and React
// re-render filtering is configured on the hooks instead
// (`useQuery(query, { notifyOnChangeProps })`).
//
// Literals are rejected by the option types. Options built elsewhere — e.g.
// native `@tanstack/react-query` helpers shared during a migration — are
// still accepted, and the value is ignored at runtime (see queryFactory.test).
import type { QueryObserverOptions } from '@tanstack/query-core'
import {
  createQuery,
  infiniteQueryOptions,
  queryOptions,
} from '../index'
import type {
  CreateInfiniteQueryOptions,
  CreateQueriesItemOptions,
  CreateQueryOptions,
} from '../index'

const queryFn = async () => 1
const pageFn = async () => [1]

export const query: CreateQueryOptions<number> = {
  name: 'notify.query',
  queryKey: ['notify'],
  queryFn,
  // @ts-expect-error configured on the React hooks, not on the factory
  notifyOnChangeProps: ['data'],
}

export const infinite: CreateInfiniteQueryOptions<number[], Error, number> = {
  name: 'notify.infinite',
  queryKey: ['notify', 'infinite'],
  queryFn: pageFn,
  initialPageParam: 0,
  getNextPageParam: () => 1,
  // @ts-expect-error configured on the React hooks, not on the factory
  notifyOnChangeProps: ['data'],
}

export const familyItem: CreateQueriesItemOptions<
  number,
  Error,
  number,
  ReadonlyArray<unknown>
> = {
  queryKey: ['notify', 'family'],
  queryFn,
  // @ts-expect-error configured on the React hooks, not on the factory
  notifyOnChangeProps: ['data'],
}

queryOptions({
  queryKey: ['notify', 'options'],
  queryFn,
  // @ts-expect-error configured on the React hooks, not on the factory
  notifyOnChangeProps: ['data'],
})

infiniteQueryOptions({
  queryKey: ['notify', 'infinite', 'options'],
  queryFn: pageFn,
  initialPageParam: 0,
  getNextPageParam: () => 1,
  // @ts-expect-error configured on the React hooks, not on the factory
  notifyOnChangeProps: ['data'],
})

// Native options objects keep working with factories.
declare const native: QueryObserverOptions<number, Error, number, number, string[]>
createQuery({ source: {}, query: () => native })
