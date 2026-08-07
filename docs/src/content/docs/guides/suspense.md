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

## SSR store fallback

In the Next.js App Router (and any other RSC-style runtime), the rendering scope produced by `<EffectorNext values={serialize(scope)}>` has neither `$queryClient` nor `$observer` — both stores are `serialize: 'ignore'` because class instances aren't JSON-shippable across the RSC boundary. To keep `useSuspenseQuery` working on the server pass, the hook reads `$status` / `$data` / `$error` directly from the rehydrated effector stores when no observer can be built:

- `prefetchQueries` ran on the original (per-request) scope and populated those stores.
- `serialize(scope)` carries the populated stores across the RSC boundary.
- The hook reads `$status === 'success'` and returns `$data` synchronously — server-rendered HTML carries the data, no Suspense fallback shown.
- On client hydration the same path runs against the populated browser stores. After mount, the observer is materialised against the singleton browser `QueryClient` and takes over for subsequent refetches / cache-miss suspensions.

When **both** the observer cannot be built **and** the store status is `'pending'` — no `QueryClient` anywhere and no prefetch — there is nothing to fetch with, and the hook throws. On the **server** that is a legitimate setup (a query meant to run in the browser only): the thrown error carries Next's `BAILOUT_TO_CLIENT_SIDE_RENDERING` digest, so the `<Suspense>` fallback lands in the HTML, React re-renders the boundary on the client where the scope's client is set, and Next does not log it as an application error. Nothing is fetched on the server. In the **browser** the same state is a real misconfiguration, so the message stays loud: *"useSuspenseQuery: no QueryClient is set…"*.

To render such a query on the server instead, prefetch it with `prefetchQueries` before serializing the scope (above).

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
