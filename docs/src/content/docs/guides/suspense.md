---
title: Suspense
description: Throw promises and errors into React's Suspense and ErrorBoundary.
---

`useSuspenseQuery` and `useSuspenseInfiniteQuery` integrate with React `<Suspense>` and error boundaries:

- While pending → throws an inflight promise (deduplicated by `queryClient.fetchQuery`)
- On error → throws the error (catch with `<ErrorBoundary>`)
- On success → returns data **directly** (not wrapped in `{ data, isPending }`)

## Usage

```tsx
import { Suspense } from 'react'
import { useSuspenseQuery } from '@effector-tanstack-query/react'

function UserProfile() {
  const user = useSuspenseQuery(userQuery) // returns User directly
  return <h1>{user.name}</h1>
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

The hook subscribes to the underlying `QueryObserver` via `useSyncExternalStore` and reads its result via `getOptimisticResult` (which goes against the `queryClient` cache, not the observer's notification stream). This means the hook can serve cached data on the very first render without waiting for `useEffect` to run — exactly when `<Suspense>` would otherwise be stuck in fallback.

When status is `'pending'`, the hook throws `observer.fetchOptimistic(observer.options)`. This promise resolves with the queryFn result and is **deduplicated by `queryHash`** — multiple suspending consumers of the same key share the inflight request.

## Cache hits don't suspend

If the cache already has data and `staleTime` keeps it fresh, the hook returns immediately:

```tsx
queryClient.setQueryData(['user', 1], { name: 'Alice' })

function UserProfile() {
  const user = useSuspenseQuery(userQuery) // doesn't suspend, returns 'Alice'
  return <h1>{user.name}</h1>
}
```

## Reactive query keys still work

When the key store updates, the observer re-evaluates against the cache:

```tsx
const setId = createEvent<number>()
const $id = createStore(1).on(setId, (_, v) => v)

const userQuery = createQuery(queryClient, {
  name: 'user',
  queryKey: ['user', $id],
  queryFn: ({ queryKey }) => fetchUser(queryKey[1] as number),
})

function UserProfile() {
  const user = useSuspenseQuery(userQuery)
  return <h1>{user.name}</h1>
}

// Calling setId(2) inside an event handler re-suspends if the new key isn't cached.
```

## Infinite queries

```tsx
import { useSuspenseInfiniteQuery } from '@effector-tanstack-query/react'

function Feed() {
  const data = useSuspenseInfiniteQuery(postsQuery)
  // data: InfiniteData<Post, number>
  return data.pages.flatMap((p) => p.items).map((post) => <Post key={post.id} {...post} />)
}
```

`fetchNextPage` is still on the underlying query object and can be called from the parent component.

## Concurrent / mixed consumers

The Suspense hook also calls `mounted()` / `unmounted()` on the query so other components reading the same query via `useQuery` or `useUnit` stay in sync via the effector scope.
