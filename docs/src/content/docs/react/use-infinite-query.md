---
title: useInfiniteQuery
description: React hook for createInfiniteQuery with pagination state and bound page-fetch callbacks.
---

```ts
import { useInfiniteQuery } from '@effector-tanstack-query/react'

function Feed() {
  const {
    data,
    error,
    status,
    isPending,
    isFetching,
    isSuccess,
    isError,
    isPlaceholderData,
    fetchStatus,
    hasNextPage,
    hasPreviousPage,
    isFetchingNextPage,
    isFetchingPreviousPage,
    isFetchNextPageError,
    isFetchPreviousPageError,
    refresh,
    fetchNextPage,
    fetchPreviousPage,
  } = useInfiniteQuery(postsQuery)

  return (
    <div>
      {data?.pages.flatMap((p) => p.items).map((item) => <Item key={item.id} {...item} />)}
      {hasNextPage && (
        <button onClick={fetchNextPage} disabled={isFetchingNextPage}>
          {isFetchingNextPage ? 'Loading…' : 'Load more'}
        </button>
      )}
    </div>
  )
}
```

## Behavior

Same lifecycle pattern as `useQuery` — auto `mounted` / `unmounted`. Returns bound `fetchNextPage` / `fetchPreviousPage` / `refresh`.

Re-renders only when a field the component read changes: a component that reads only `hasNextPage` doesn't re-render while the next page loads. Pass `{ notifyOnChangeProps: 'all' }` to re-render on every field. See [Re-renders and tracked results](/effector-tanstack-query/guides/render-tracking/).

## Type signature

```ts
function useInfiniteQuery<TData, TError = Error, TPageParam = unknown>(
  query: InfiniteQueryResult<TData, TError, TPageParam>,
  options?: { notifyOnChangeProps?: 'tracked' | 'all' | Array<field> }, // default: 'tracked'
): UseInfiniteQueryResult<TData, TError>
```

`TData` defaults to `InfiniteData<TQueryFnData, TPageParam>` and narrows when `select` is used.
