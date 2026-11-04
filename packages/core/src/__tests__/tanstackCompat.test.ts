// Adapter behavior that depends on the installed @tanstack/query-core 5.x.
import { allSettled, fork } from 'effector'
import { QueryClient } from '@tanstack/query-core'
import { afterEach, expect, it } from 'vitest'
import { createInfiniteQuery } from '../index'
import { tanstackAtLeast } from './tanstackVersion'
import { sleep } from './test-utils'

const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
afterEach(() => client.clear())

it('reports page errors as booleans, also before Query Core has the flags', async () => {
  let page = 0
  const query = createInfiniteQuery(client, {
    queryKey: ['compat', 'pageError'],
    initialPageParam: 0,
    queryFn: async ({ pageParam }) => {
      page++
      if (page > 1) throw new Error('next page failed')
      return pageParam
    },
    getNextPageParam: (last) => last + 1,
  })
  const scope = fork()
  await allSettled(query.mounted, { scope })
  await sleep(5)
  await allSettled(query.fetchNextPage, { scope })
  await sleep(5)
  expect(scope.getState(query.$isError)).toBe(true)
  // Query Core 5.36 added isFetchNextPageError; before it the store stays false.
  expect(scope.getState(query.$isFetchNextPageError)).toBe(
    tanstackAtLeast('5.36.0'),
  )
  expect(scope.getState(query.$isFetchPreviousPageError)).toBe(false)
  await allSettled(query.unmounted, { scope })
})
