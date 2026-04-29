---
title: Infinite queries
description: Paginated and bidirectional data with createInfiniteQuery, fetchNextPage, and maxPages.
---

`createInfiniteQuery` wraps TanStack Query's `InfiniteQueryObserver` and exposes the same API as `createQuery` plus pagination-specific stores and events.

## Basic usage

```ts
import { createInfiniteQuery } from '@effector-tanstack-query/core'

const postsQuery = createInfiniteQuery(queryClient, {
  name: 'posts',
  queryKey: ['posts'],
  queryFn: ({ pageParam }) =>
    fetch(`/api/posts?cursor=${pageParam}`).then((r) => r.json()),
  getNextPageParam: (lastPage) => lastPage.nextCursor,
  initialPageParam: 0,
})

postsQuery.mounted()
postsQuery.fetchNextPage() // load more
```

## Stores and events

In addition to all `QueryResult` fields:

| Field                       | Type                                  | Description                       |
| --------------------------- | ------------------------------------- | --------------------------------- |
| `$data`                     | `Store<InfiniteData<T> \| undefined>` | All pages + pageParams            |
| `$hasNextPage`              | `Store<boolean>`                      | More pages available forward      |
| `$hasPreviousPage`          | `Store<boolean>`                      | More pages available backward     |
| `$isFetchingNextPage`       | `Store<boolean>`                      | Next page is fetching             |
| `$isFetchingPreviousPage`   | `Store<boolean>`                      | Previous page is fetching         |
| `$isFetchNextPageError`     | `Store<boolean>`                      | Next page fetch failed            |
| `$isFetchPreviousPageError` | `Store<boolean>`                      | Previous page fetch failed        |
| `fetchNextPage`             | `EventCallable<void>`                 | Fetch next page                   |
| `fetchPreviousPage`         | `EventCallable<void>`                 | Fetch previous page               |
| `refresh`                   | `EventCallable<void>`                 | Invalidate & refetch all pages    |

## Bidirectional pagination

```ts
const chatQuery = createInfiniteQuery(queryClient, {
  name: 'chat',
  queryKey: ['messages'],
  queryFn: ({ pageParam }) => fetchMessages(pageParam),
  getNextPageParam: (lastPage) => lastPage.nextCursor,
  getPreviousPageParam: (firstPage) => firstPage.prevCursor,
  initialPageParam: 'latest',
})

chatQuery.fetchNextPage()     // older
chatQuery.fetchPreviousPage() // newer
```

## maxPages

Cap the number of retained pages — older pages are evicted as new ones load:

```ts
createInfiniteQuery(queryClient, {
  name: 'feed',
  // ...
  maxPages: 10,
})
```

## select on infinite data

`select` receives `InfiniteData<TQueryFnData, TPageParam>` and can return any shape:

```ts
const postsQuery = createInfiniteQuery(queryClient, {
  name: 'posts',
  queryKey: ['posts'],
  queryFn: ({ pageParam }: { pageParam: number }) => fetchPage(pageParam),
  getNextPageParam: (last) => last.nextCursor,
  initialPageParam: 0,
  // Flatten pages into a single array
  select: (data) => data.pages.flatMap((page) => page.items),
})

postsQuery.$data // Store<Post[] | undefined>
```

## Refetch behavior

`refresh()` (or `queryClient.invalidateQueries`) refetches **every** loaded page using `getNextPageParam` to recompute cursors from the freshly-fetched data. The original `pageParams` in the cache are replaced.

This is by design — pagination cursors often depend on server state and shouldn't be assumed stable.

## In React

See [`useInfiniteQuery`](/effector-tanstack-query/react/use-infinite-query/) and [`useSuspenseInfiniteQuery`](/effector-tanstack-query/react/use-suspense-infinite-query/).
