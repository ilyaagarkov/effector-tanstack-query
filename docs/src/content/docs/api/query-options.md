---
title: queryOptions / infiniteQueryOptions
description: Define reusable query options with inferred data types and typed cache keys.
---

These optional helpers return the same options object and associate its key
with the cache data type. They depend only on `@tanstack/query-core`.
Factories using compatible native helpers, such as those from
`@tanstack/react-query`, can be passed directly to Effector adapters.

## queryOptions

```ts
import { queryOptions } from '@effector-tanstack-query/core'
// or: import { queryOptions } from '@tanstack/react-query'

type Todo = { id: number; title: string }
declare function getTodo(
  params: { todoId: number },
  options?: { signal?: AbortSignal },
): Promise<Todo>

export const todoOptions = ({ todoId }: { todoId: number }) => queryOptions({
  queryKey: ['todos', { todoId }],
  queryFn: ({ signal }) => getTodo({ todoId }, { signal }),
  staleTime: 60_000,
})
```

## infiniteQueryOptions

```ts
import { infiniteQueryOptions } from '@effector-tanstack-query/core'
// or: import { infiniteQueryOptions } from '@tanstack/react-query'

type Post = { id: number; title: string }
declare function getPosts(
  params: { category: string; cursor: number },
  options?: { signal?: AbortSignal },
): Promise<{ items: Post[]; nextCursor: number | null }>

export const postsOptions = ({ category }: { category: string }) => infiniteQueryOptions({
  queryKey: ['posts', category],
  initialPageParam: 0,
  queryFn: ({ pageParam, signal }) =>
    getPosts({ category, cursor: pageParam }, { signal }),
  getNextPageParam: lastPage => lastPage.nextCursor ?? undefined,
})
```

`queryFn` supplies the data type; `initialPageParam` supplies the page parameter
type. The helpers retain native initial-data and skip-token overloads.
They do not fetch data or create Effector stores.

## Typed cache access

```ts
const key = todoOptions({ todoId: 1 }).queryKey
const todo = queryClient.getQueryData(key) // Todo | undefined
queryClient.setQueryData(key, previous =>
  previous ? { ...previous, title: 'Updated' } : previous,
)
```

The key carries the raw query data type, even if the factory includes `select`.
An infinite key carries `InfiniteData` for the cached pages. `select` changes
observer data; it does not change what is stored in the cache.
Effector `$data` remains a store whose value may be `undefined` before observation.

See [reusing factories](/effector-tanstack-query/guides/queries/#reusing-query-options-factories)
for consumers, and the factory references for
[`createQuery`](/effector-tanstack-query/api/create-query/#factory-form) and
[`createInfiniteQuery`](/effector-tanstack-query/api/create-infinite-query/#factory-form).

The helpers are adapted from TanStack Query under the MIT license; attribution
is included in `packages/core/LICENSE.TanStack`.
