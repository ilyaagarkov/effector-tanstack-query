---
title: Quick start
description: Build a query, mount it, and read its data — in two minutes.
---

## 1. Set up the QueryClient

The `QueryClient` is the same object used by TanStack Query. Create one and call `.mount()` so it can subscribe to focus / online events.

```ts
import { QueryClient } from '@tanstack/query-core'

export const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: false } },
})
queryClient.mount()
```

## 2. Create a query

```ts
import { createQuery } from '@effector-tanstack-query/core'

export const userQuery = createQuery(queryClient, {
  name: 'user',
  queryKey: ['user', 1],
  queryFn: () => fetch('/api/users/1').then((r) => r.json()),
})
```

The `name` is optional but **strongly recommended** — it gives the internal stores stable SIDs so they round-trip via `serialize(scope)` / `fork({ values })` for SSR. ([Why?](/effector-tanstack-query/guides/naming-and-sids/))

## 3. Read its state

`createQuery` returns an object with effector stores and events:

```ts
userQuery.$data        // Store<User | undefined>
userQuery.$error       // Store<Error | null>
userQuery.$status      // Store<'pending' | 'success' | 'error'>
userQuery.$isPending   // Store<boolean>
userQuery.$isFetching  // Store<boolean>
userQuery.mounted      // EventCallable<void>  — start the subscription
userQuery.refresh      // EventCallable<void>  — invalidate + refetch
```

Drive the lifecycle yourself, then read state:

```ts
userQuery.mounted()             // observer subscribes; query starts fetching
// ...await something
console.log(userQuery.$data.getState())
```

In tests with `fork`:

```ts
import { fork, allSettled } from 'effector'

const scope = fork()
await allSettled(userQuery.mounted, { scope })
expect(scope.getState(userQuery.$data)).toEqual({ id: 1, name: 'Alice' })
```

## 4. Use in React (optional)

```tsx
import { useQuery } from '@effector-tanstack-query/react'

function UserProfile() {
  const { data, isPending, error, refresh } = useQuery(userQuery)

  if (isPending) return <p>Loading…</p>
  if (error) return <p>Error: {error.message}</p>

  return (
    <div>
      <h1>{data.name}</h1>
      <button onClick={refresh}>Refresh</button>
    </div>
  )
}
```

The hook calls `mounted()` on mount and `unmounted()` on cleanup automatically.

## 5. Make the key reactive

Drop a `Store` into `queryKey` and the query refetches automatically when it updates.

```ts
import { createStore, createEvent } from 'effector'

const setUserId = createEvent<number>()
const $userId = createStore(1).on(setUserId, (_, id) => id)

const userQuery = createQuery(queryClient, {
  name: 'user',
  queryKey: ['user', $userId],
  queryFn: ({ queryKey }) =>
    fetch(`/api/users/${queryKey[1]}`).then((r) => r.json()),
})

userQuery.mounted()
setUserId(2) // → fires a refetch with key ['user', 2]
```

## What's next

- Read [Queries](/effector-tanstack-query/guides/queries/) for `enabled`, `placeholderData`, `select`, and `refetchInterval`.
- Read [Mutations](/effector-tanstack-query/guides/mutations/) for `mutateWith`, `finished` events, and offline behavior.
- For full type signatures, see the [API reference](/effector-tanstack-query/api/create-query/).
