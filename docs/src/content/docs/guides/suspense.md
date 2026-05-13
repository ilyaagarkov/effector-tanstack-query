---
title: Suspense
description: Throw promises and errors into React's Suspense and ErrorBoundary.
---

`useSuspenseQuery` and `useSuspenseInfiniteQuery` integrate with React `<Suspense>` and error boundaries:

- While pending → throws an inflight promise (deduplicated by `queryClient.fetchQuery`)
- On error → throws the error (catch with `<ErrorBoundary>`)
- On success → returns the **same shape as `useQuery`** (`{ data, error, isFetching, refresh, … }`), with `data` narrowed to non-nullable `TData` because the pending state can't reach the rendered subtree.

## Usage

```tsx
import { Suspense } from 'react'
import { useSuspenseQuery } from '@effector-tanstack-query/react'

function UserProfile() {
  const { data: user, isFetching, refresh } = useSuspenseQuery(userQuery)
  // `user` is non-nullable; `isFetching` flips during background refetch.
  return (
    <div>
      <h1>{user.name}</h1>
      <button onClick={refresh} disabled={isFetching}>Refresh</button>
    </div>
  )
}

function App() {
  return (
    <ErrorBoundary fallback={(e) => <p>Error: {e.message}</p>}>
      <Suspense fallback={<p>Loading…</p>}>
        <UserProfile />
      </Suspense>
    </ErrorBoundary>
  )
}
```

## How it works

The hook reads the per-scope `$observer` via `useUnit`. On the very first render — before `useEffect` has fired and created the scope observer — it constructs a transient `QueryObserver` directly from the active `$queryClient`, so cached data is served without flashing the fallback. Both flavors read from / write to the same `queryClient` cache.

When status is `'pending'`, the hook throws `observer.fetchOptimistic(...)`. This promise resolves with the queryFn result and is **deduplicated by `queryHash`** — multiple suspending consumers of the same key share the inflight request.

## Cache hits don't suspend

If the cache already has data and `staleTime` keeps it fresh, the hook returns immediately:

```tsx
queryClient.setQueryData(['user', 1], { name: 'Alice' })

function UserProfile() {
  const { data: user } = useSuspenseQuery(userQuery) // doesn't suspend
  return <h1>{user.name}</h1>
}
```

## Reactive query keys still work

When the key store updates, the observer re-evaluates against the cache:

```tsx
const setId = createEvent<number>()
const $id = createStore(1).on(setId, (_, v) => v)

const userQuery = createQuery({
  name: 'user',
  queryKey: ['user', $id],
  queryFn: ({ queryKey }) => fetchUser(queryKey[1] as number),
})

function UserProfile() {
  const { data: user } = useSuspenseQuery(userQuery)
  return <h1>{user.name}</h1>
}

// Calling setId(2) inside an event handler re-suspends if the new key isn't cached.
```

## Infinite queries

```tsx
import { useSuspenseInfiniteQuery } from '@effector-tanstack-query/react'

function Feed() {
  const { data, hasNextPage, isFetchingNextPage, fetchNextPage } =
    useSuspenseInfiniteQuery(postsQuery)

  return (
    <>
      {data.pages.flatMap((p) => p.items).map((post) => (
        <Post key={post.id} {...post} />
      ))}
      {hasNextPage && (
        <button onClick={fetchNextPage} disabled={isFetchingNextPage}>
          {isFetchingNextPage ? 'Loading…' : 'Load more'}
        </button>
      )}
    </>
  )
}
```

The hook returns the same fields as [`useInfiniteQuery`](/effector-tanstack-query/react/use-infinite-query/) — `hasNextPage`, `fetchNextPage`, `isFetchingNextPage`, etc. — with `data` narrowed to non-nullable `InfiniteData`.

## Concurrent / mixed consumers

The Suspense hook also calls `mounted()` / `unmounted()` on the query so other components reading the same query via `useQuery` or `useUnit` stay in sync via the effector scope.
