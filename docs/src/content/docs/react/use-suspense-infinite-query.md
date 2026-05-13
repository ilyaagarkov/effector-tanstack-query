---
title: useSuspenseInfiniteQuery
description: Suspense variant of useInfiniteQuery — same shape as useInfiniteQuery, with `data` narrowed to non-nullable.
---

```tsx
import { useSuspenseInfiniteQuery } from '@effector-tanstack-query/react'

function Feed() {
  const { data, hasNextPage, isFetchingNextPage, fetchNextPage } =
    useSuspenseInfiniteQuery(postsQuery)
  // `data` is non-nullable here — Suspense absorbed the pending state.

  const items = data.pages.flatMap((p) => p.items)
  return (
    <>
      {items.map((post) => <Post key={post.id} {...post} />)}
      {hasNextPage && (
        <button onClick={fetchNextPage} disabled={isFetchingNextPage}>
          {isFetchingNextPage ? 'Loading…' : 'Load more'}
        </button>
      )}
    </>
  )
}
```

## Behavior

Same lifecycle and Suspense semantics as [`useSuspenseQuery`](/effector-tanstack-query/react/use-suspense-query/), but with the infinite-query stores included in the return value.

## Return value

In addition to all [`useSuspenseQuery`](/effector-tanstack-query/react/use-suspense-query/#return-value) fields:

| Field                       | Type             | Description                  |
| --------------------------- | ---------------- | ---------------------------- |
| `data`                      | `TData`          | Non-nullable `InfiniteData`  |
| `hasNextPage`               | `boolean`        |                              |
| `hasPreviousPage`           | `boolean`        |                              |
| `isFetchingNextPage`        | `boolean`        |                              |
| `isFetchingPreviousPage`    | `boolean`        |                              |
| `isFetchNextPageError`      | `boolean`        |                              |
| `isFetchPreviousPageError`  | `boolean`        |                              |
| `fetchNextPage`             | `() => void`     | Bound to the current scope   |
| `fetchPreviousPage`         | `() => void`     | Bound to the current scope   |

## Type signature

```ts
function useSuspenseInfiniteQuery<TData, TError = Error, TPageParam = unknown>(
  query: InfiniteQueryResult<TData, TError, TPageParam>,
): UseSuspenseInfiniteQueryResult<TData, TError>
```
