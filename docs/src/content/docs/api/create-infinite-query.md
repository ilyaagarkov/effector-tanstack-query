---
title: createInfiniteQuery
description: Create a paginated query with cursor-based or bidirectional pagination.
---

```ts
import { createInfiniteQuery } from '@effector-tanstack-query/core'

function createInfiniteQuery<
  TQueryFnData = unknown,
  TError = Error,
  TPageParam = unknown,
  TData = InfiniteData<TQueryFnData, TPageParam>,
>(
  queryClient: QueryClient,
  options: CreateInfiniteQueryOptions<TQueryFnData, TError, TPageParam, TData>,
): InfiniteQueryResult<TData, TError, TPageParam>
```

## Options

`CreateInfiniteQueryOptions` extends `InfiniteQueryObserverOptions`:

| Field                  | Type                                                  | Notes                                  |
| ---------------------- | ----------------------------------------------------- | -------------------------------------- |
| `queryKey`             | `EffectorQueryKey`                                    | Same as `createQuery`                  |
| `queryFn`              | `({ pageParam, queryKey, signal }) => Promise<TQueryFnData>` | First arg includes `pageParam` |
| `getNextPageParam`     | `(lastPage, allPages, lastParam, allParams) => TPageParam \| undefined` | Required |
| `getPreviousPageParam` | `(firstPage, allPages, firstParam, allParams) => TPageParam \| undefined` | Optional, for bidirectional |
| `initialPageParam`     | `TPageParam`                                          | Required                               |
| `maxPages`             | `number`                                              | Cap on retained pages                  |
| `enabled`              | `boolean \| Store<boolean>`                           | Reactive                               |
| `name`                 | `string` (recommended)                                | Stable name for SID-based SSR          |
| ...rest                | All other `InfiniteQueryObserverOptions`              | `select`, `staleTime`, `placeholderData`, ... |

## Return value (`InfiniteQueryResult<TData, TError, TPageParam>`)

In addition to the base `QueryResult` fields:

| Field                       | Type                  | Description                  |
| --------------------------- | --------------------- | ---------------------------- |
| `$hasNextPage`              | `Store<boolean>`      | More pages forward           |
| `$hasPreviousPage`          | `Store<boolean>`      | More pages backward          |
| `$isFetchingNextPage`       | `Store<boolean>`      | Next page in flight          |
| `$isFetchingPreviousPage`   | `Store<boolean>`      | Previous page in flight      |
| `$isFetchNextPageError`     | `Store<boolean>`      | Next page errored            |
| `$isFetchPreviousPageError` | `Store<boolean>`      | Previous page errored        |
| `fetchNextPage`             | `EventCallable<void>` | Trigger next-page fetch      |
| `fetchPreviousPage`         | `EventCallable<void>` | Trigger previous-page fetch  |

`$data` is `Store<TData | undefined>` where `TData` defaults to `InfiniteData<TQueryFnData, TPageParam>`. With `select`, it's whatever your selector returns.

## select

```ts
const q = createInfiniteQuery(qc, {
  name: 'items',
  queryKey: ['items'],
  queryFn: ({ pageParam }: { pageParam: number }) => fetchPage(pageParam),
  getNextPageParam: (last) => last.next,
  initialPageParam: 0,
  // Flatten pages into a single array
  select: (data) => data.pages.flatMap((p) => p.items),
})

q.$data // Store<Item[] | undefined>
```

## Refetch behavior

`refresh()` (or `queryClient.invalidateQueries`) refetches **all** loaded pages in order, recomputing `pageParams` from the freshly-fetched data via `getNextPageParam`. The original `pageParams` saved in cache are replaced.

This matches TanStack Query semantics — pagination cursors are derived, not stored as ground truth.
