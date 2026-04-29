---
title: useSuspenseInfiniteQuery
description: Suspense variant of useInfiniteQuery — returns InfiniteData directly.
---

```tsx
import { useSuspenseInfiniteQuery } from '@effector-tanstack-query/react'

function Feed() {
  const data = useSuspenseInfiniteQuery(postsQuery)
  // data: InfiniteData<Post, number> — defined, never undefined
  const items = data.pages.flatMap((p) => p.items)
  return items.map((post) => <Post key={post.id} {...post} />)
}
```

## Behavior

Identical to [`useSuspenseQuery`](/effector-tanstack-query/react/use-suspense-query/) but for infinite queries. While pending, throws an inflight promise. On error, throws. On success, returns `InfiniteData<TQueryFnData, TPageParam>` (or whatever `select` returns).

`fetchNextPage` / `fetchPreviousPage` are still on the underlying query object — call them via `useUnit(postsQuery.fetchNextPage)` from the parent or this component.

## Type signature

```ts
function useSuspenseInfiniteQuery<TData, TError = Error, TPageParam = unknown>(
  query: InfiniteQueryResult<TData, TError, TPageParam>,
): TData
```
