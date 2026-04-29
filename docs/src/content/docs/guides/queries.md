---
title: Queries
description: Reactive query keys, enabled, select, placeholderData, polling, and dependent queries.
---

A query is created with `createQuery(queryClient, options)`. It returns an object of effector stores and events.

## Reactive query keys

Anywhere in `queryKey`, you can use a `Store` instead of a plain value. The query refetches automatically when any store updates.

```ts
const $userId = createStore(1)

const userQuery = createQuery(queryClient, {
  name: 'user',
  queryKey: ['user', $userId],
  queryFn: ({ queryKey }) => fetchUser(queryKey[1] as number),
})
```

Mixing stores and primitives is supported:

```ts
queryKey: ['posts', 42, $section, { sort: 'asc' }]
```

## Enabled flag

`enabled` controls whether the query runs. It accepts a boolean OR a `Store<boolean>`:

```ts
// Static
const userQuery = createQuery(queryClient, {
  name: 'user',
  queryKey: ['user'],
  queryFn: fetchUser,
  enabled: false, // never fetches until enabled changes
})

// Reactive
const $isLoggedIn = createStore(false)

const profileQuery = createQuery(queryClient, {
  name: 'profile',
  queryKey: ['profile'],
  queryFn: fetchProfile,
  enabled: $isLoggedIn, // fetches once $isLoggedIn becomes true
})
```

## Dependent queries

Use one query's `$isSuccess` as another's `enabled`:

```ts
const userQuery = createQuery(queryClient, {
  name: 'user',
  queryKey: ['user'],
  queryFn: fetchUser,
})

const postsQuery = createQuery(queryClient, {
  name: 'user-posts',
  queryKey: ['posts'],
  queryFn: fetchPosts,
  enabled: userQuery.$isSuccess,
})
```

## select — narrow data shape

`select` runs after the queryFn and narrows the displayed `TData` type:

```ts
const userQuery = createQuery(queryClient, {
  name: 'user',
  queryKey: ['user'],
  queryFn: () => fetchUser(), // returns { id, name, email, role }
  select: (data) => data.name, // $data: Store<string | undefined>
})
```

If `select` throws, the query transitions to `error` state with the thrown value.

## placeholderData

Show data while the new key is loading:

```ts
import { keepPreviousData } from '@tanstack/query-core'

const todosQuery = createQuery(queryClient, {
  name: 'todos',
  queryKey: ['todos', $page],
  queryFn: ({ queryKey }) => fetchTodos(queryKey[1]),
  placeholderData: keepPreviousData,
})

todosQuery.$isPlaceholderData // Store<boolean>
```

A static value or function is also supported:

```ts
placeholderData: { id: 0, name: 'Loading…' }

// Or a function that gets prevData and prevQuery
placeholderData: (prev) => prev,
```

## Polling with refetchInterval

```ts
const statusQuery = createQuery(queryClient, {
  name: 'status',
  queryKey: ['status'],
  queryFn: fetchStatus,
  refetchInterval: 5000, // every 5 s
})
```

A function form lets you stop polling based on data:

```ts
refetchInterval: (q) => {
  const v = q.state.data as { done: boolean } | undefined
  return v?.done ? false : 1000
},
```

## refetchOnMount / refetchOnWindowFocus / refetchOnReconnect

All three accept `boolean | 'always' | (query) => boolean | 'always'` and behave exactly as in TanStack Query. Defaults: `true` for mount/focus/reconnect.

```ts
createQuery(queryClient, {
  name: 'auth',
  queryKey: ['auth'],
  queryFn: fetchAuth,
  refetchOnWindowFocus: 'always', // refetch even on fresh data
  refetchOnReconnect: false,      // never refetch on reconnect
})
```

## Manual refresh

```ts
userQuery.refresh() // invalidates the query and refetches in the background
```

## Lifecycle

You must call `mounted()` (or use `useQuery(query)` in React) for the observer to subscribe. `unmounted()` tears it down.

```ts
userQuery.mounted()
// ...
userQuery.unmounted() // cancels in-flight, releases observer
```

In React, the [`useQuery`](/effector-tanstack-query/react/use-query/) hook calls these for you.
