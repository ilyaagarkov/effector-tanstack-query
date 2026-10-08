import { allSettled, createEvent, createStore, fork, serialize } from 'effector'
import { QueryClient } from '@tanstack/query-core'
import { afterEach, expect, it, vi } from 'vitest'
import {
  $queryClient,
  createInfiniteQuery,
  createQuery,
  prefetchQueries,
  queryOptions,
} from '../index'

const clients: QueryClient[] = []
afterEach(() => {
  for (const client of clients.splice(0)) client.clear()
})

function createClient() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false, staleTime: Infinity } },
  })
  clients.push(client)
  return client
}

it('resolves related tuple entries coherently within one transaction', async () => {
  const client = createClient()
  const changed = createEvent<number>()
  const $id = createStore(1).on(changed, (_, id) => id)
  const $label = $id.map((id) => `item-${id}`)
  const calls: Array<readonly [number, string]> = []
  const query = createQuery(client, {
    source: [$id, $label],
    query: ([id, label]) => ({
      queryKey: ['tuple', id, label],
      queryFn: () => {
        calls.push([id, label])
        return label
      },
    }),
  })
  const scope = fork()
  await prefetchQueries([query], { scope })
  const observer = scope.getState(query.$observer)
  await allSettled(changed, { scope, params: 2 })
  await allSettled(query.prefetch, { scope })
  expect(calls).toEqual([[1, 'item-1'], [2, 'item-2']])
  expect(scope.getState(query.$observer)).toBe(observer)
  expect(scope.getState(query.$data)).toBe('item-2')
  await allSettled(query.unmounted, { scope })
})

it('updates options when either independent tuple entry changes', async () => {
  const client = createClient()
  const idChanged = createEvent<number>()
  const filterChanged = createEvent<string>()
  const $id = createStore(1).on(idChanged, (_, value) => value)
  const $filter = createStore('active').on(filterChanged, (_, value) => value)
  const calls: Array<readonly [number, string]> = []
  const query = createQuery(client, {
    source: [$id, $filter],
    query: ([id, filter]) => ({
      queryKey: ['independent', id, filter],
      queryFn: () => {
        calls.push([id, filter])
        return `${id}:${filter}`
      },
    }),
  })
  const scope = fork()
  await prefetchQueries([query], { scope })
  await allSettled(filterChanged, { scope, params: 'archived' })
  await allSettled(query.prefetch, { scope })
  expect(scope.getState(query.$data)).toBe('1:archived')
  await allSettled(idChanged, { scope, params: 2 })
  await allSettled(query.prefetch, { scope })
  expect(scope.getState(query.$data)).toBe('2:archived')
  expect(calls).toEqual([[1, 'active'], [1, 'archived'], [2, 'archived']])
  await allSettled(query.unmounted, { scope })
})

it('updates same-key selection and refreshes with the current tuple closure', async () => {
  const client = createClient()
  const changed = createEvent<number>()
  const $factor = createStore(1).on(changed, (_, value) => value)
  const $label = createStore('item')
  const calls: number[] = []
  const query = createQuery(client, {
    source: [$factor, $label],
    query: ([factor, label]) => queryOptions({
      queryKey: ['same-key'],
      queryFn: () => {
        calls.push(factor)
        return factor
      },
      select: (value) => `${label}:${value * factor}`,
    }),
  })
  const scope = fork()
  await prefetchQueries([query], { scope })
  await allSettled(changed, { scope, params: 2 })
  expect(scope.getState(query.$data)).toBe('item:2')
  expect(calls).toEqual([1])
  await allSettled(query.refresh, { scope })
  expect(scope.getState(query.$data)).toBe('item:4')
  expect(calls).toEqual([1, 2])
  await allSettled(query.unmounted, { scope })
})

it('reads frozen tuple sources per scope and serializes result stores', async () => {
  const $id = createStore(1)
  const $filter = createStore('active')
  const source = Object.freeze([$id, $filter] as const)
  const query = createQuery({
    name: 'tuple.ssr',
    source,
    query: ([id, filter]) => ({
      queryKey: ['tuple', id, filter],
      queryFn: () => `${id}:${filter}`,
    }),
  })
  const a = fork({ values: [[$id, 2], [$filter, 'a'], [$queryClient, createClient()]] })
  const b = fork({ values: [[$id, 3], [$filter, 'b'], [$queryClient, createClient()]] })
  await Promise.all([
    prefetchQueries([query], { scope: a }),
    prefetchQueries([query], { scope: b }),
  ])
  expect(a.getState(query.$data)).toBe('2:a')
  expect(b.getState(query.$data)).toBe('3:b')
  expect(fork({ values: serialize(b) }).getState(query.$data)).toBe('3:b')
  expect(source).toEqual([$id, $filter])
  await allSettled(query.unmounted, { scope: a })
  await allSettled(query.unmounted, { scope: b })
})

it('uses scoped tuple page options and updates infinite selection and cursors', async () => {
  const client = createClient()
  const changed = createEvent<number>()
  const $step = createStore(1).on(changed, (_, value) => value)
  const $label = createStore('page')
  const calls: number[] = []
  const query = createInfiniteQuery(client, {
    source: [$step, $label],
    query: ([step, label]) => ({
      queryKey: ['tuple-pages'],
      initialPageParam: step,
      queryFn: ({ pageParam }: { pageParam: number }) => {
        calls.push(pageParam)
        return pageParam
      },
      getNextPageParam: (last: number) => last + step,
      select: (data) => data.pages.map((page) => `${label}:${page * step}`),
    }),
  })
  const scope = fork({ values: [[$step, 3]] })
  await prefetchQueries([query], { scope })
  expect(scope.getState(query.$data)).toEqual(['page:9'])
  await allSettled(changed, { scope, params: 4 })
  expect(scope.getState(query.$data)).toEqual(['page:12'])
  expect(calls).toEqual([3])
  await allSettled(query.fetchNextPage, { scope })
  await vi.waitFor(() =>
    expect(scope.getState(query.$data)).toEqual(['page:12', 'page:28']),
  )
  expect(calls).toEqual([3, 7])
  await allSettled(query.unmounted, { scope })
})

it('accepts an empty tuple source', async () => {
  const query = createQuery(createClient(), {
    source: [],
    query: (value) => ({ queryKey: ['empty'], queryFn: () => value.length }),
  })
  const scope = fork()
  await prefetchQueries([query], { scope })
  expect(scope.getState(query.$data)).toBe(0)
  await allSettled(query.unmounted, { scope })
})

it('preserves repeated tuple entries', async () => {
  const $id = createStore(4)
  const query = createQuery(createClient(), {
    source: [$id, $id],
    query: ([a, b]) => ({ queryKey: ['repeated'], queryFn: () => a + b }),
  })
  const scope = fork()
  await prefetchQueries([query], { scope })
  expect(scope.getState(query.$data)).toBe(8)
  await allSettled(query.unmounted, { scope })
})
