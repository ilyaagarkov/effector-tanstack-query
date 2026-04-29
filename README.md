# effector-tanstack-query

Effector bindings for [TanStack Query](https://tanstack.com/query) -- reactive data fetching with Effector stores.

## Installation

```bash
npm install effector-tanstack-query @tanstack/query-core effector
```

## Quick Start

```ts
import { QueryClient } from '@tanstack/query-core'
import { createQuery, createMutation } from 'effector-tanstack-query'

const queryClient = new QueryClient()
queryClient.mount()
```

## createQuery

Fetches data and exposes the result as Effector stores.

```ts
const userQuery = createQuery(queryClient, {
  queryKey: ['user', 1],
  queryFn: () => fetch('/api/users/1').then((r) => r.json()),
})

// Start the subscription
userQuery.mounted()

// Read state
userQuery.$data // Store<User | undefined>
userQuery.$status // Store<'pending' | 'success' | 'error'>
userQuery.$error // Store<Error | null>
```

### Reactive query keys

Put an Effector Store inside the query key -- the query refetches automatically when the store changes.

```ts
import { createStore, createEvent } from 'effector'

const setUserId = createEvent<number>()
const $userId = createStore(1).on(setUserId, (_, id) => id)

const userQuery = createQuery(queryClient, {
  queryKey: ['user', $userId],
  queryFn: ({ queryKey }) => {
    const userId = queryKey[1]
    return fetch(`/api/users/${userId}`).then((r) => r.json())
  },
})

userQuery.mounted()

// Later: triggers a refetch with the new key
setUserId(2)
```

### Reactive enabled

Control when the query runs with a Store.

```ts
const $isLoggedIn = createStore(false)

const profileQuery = createQuery(queryClient, {
  queryKey: ['profile'],
  queryFn: () => fetch('/api/profile').then((r) => r.json()),
  enabled: $isLoggedIn, // only fetches when true
})
```

### Dependent queries

Use one query's store as another's `enabled`:

```ts
const userQuery = createQuery(queryClient, {
  queryKey: ['user', $userId],
  queryFn: fetchUser,
})

const postsQuery = createQuery(queryClient, {
  queryKey: ['posts', $userId],
  queryFn: fetchPosts,
  enabled: userQuery.$isSuccess, // waits for user to load
})
```

### Placeholder data

Show previous data while fetching a new key:

```ts
import { keepPreviousData } from '@tanstack/query-core'

const todosQuery = createQuery(queryClient, {
  queryKey: ['todos', $page],
  queryFn: ({ queryKey }) => fetchTodos(queryKey[1]),
  placeholderData: keepPreviousData,
})

todosQuery.$isPlaceholderData // Store<boolean> -- true while showing stale data
```

### Polling with refetchInterval

```ts
const statusQuery = createQuery(queryClient, {
  queryKey: ['status'],
  queryFn: fetchStatus,
  refetchInterval: 5000, // refetch every 5 seconds
})
```

### Manual refresh

```ts
userQuery.refresh() // invalidates and refetches in the background
```

### Cleanup

```ts
userQuery.unmounted() // unsubscribes observer, cancels in-flight requests
```

### All returned stores and events

| Field                | Type                                       | Description          |
| -------------------- | ------------------------------------------ | -------------------- |
| `$data`              | `Store<T \| undefined>`                    | Query result         |
| `$error`             | `Store<E \| null>`                         | Error, if any        |
| `$status`            | `Store<'pending' \| 'success' \| 'error'>` | Query status         |
| `$isPending`         | `Store<boolean>`                           | No data yet          |
| `$isFetching`        | `Store<boolean>`                           | Request in flight    |
| `$isSuccess`         | `Store<boolean>`                           | Has data             |
| `$isError`           | `Store<boolean>`                           | Has error            |
| `$isPlaceholderData` | `Store<boolean>`                           | Showing placeholder  |
| `$fetchStatus`       | `Store<'fetching' \| 'paused' \| 'idle'>`  | Fetch status         |
| `mounted`            | `EventCallable<void>`                      | Start subscription   |
| `unmounted`          | `EventCallable<void>`                      | Stop subscription    |
| `refresh`            | `EventCallable<void>`                      | Invalidate & refetch |

All standard `QueryObserverOptions` are supported: `staleTime`, `gcTime`, `retry`, `retryDelay`, `refetchOnMount`, `select`, `initialData`, `initialDataUpdatedAt`, etc.

## createInfiniteQuery

Fetches paginated data with automatic page tracking.

```ts
import { createInfiniteQuery } from 'effector-tanstack-query'

const postsQuery = createInfiniteQuery(queryClient, {
  queryKey: ['posts'],
  queryFn: ({ pageParam }) =>
    fetch(`/api/posts?cursor=${pageParam}`).then((r) => r.json()),
  getNextPageParam: (lastPage) => lastPage.nextCursor,
  initialPageParam: 0,
})

postsQuery.mounted()

// Load more pages
postsQuery.fetchNextPage()

// Read state
postsQuery.$data // Store<InfiniteData<Page> | undefined>
postsQuery.$hasNextPage // Store<boolean>
postsQuery.$isFetchingNextPage // Store<boolean>
```

### Bidirectional pagination

```ts
const chatQuery = createInfiniteQuery(queryClient, {
  queryKey: ['messages'],
  queryFn: ({ pageParam }) => fetchMessages(pageParam),
  getNextPageParam: (lastPage) => lastPage.nextCursor,
  getPreviousPageParam: (firstPage) => firstPage.prevCursor,
  initialPageParam: 'latest',
})

chatQuery.fetchNextPage() // older messages
chatQuery.fetchPreviousPage() // newer messages
```

### Using with React

```tsx
function PostList() {
  const { data, hasNextPage, isFetchingNextPage } = useUnit({
    data: postsQuery.$data,
    hasNextPage: postsQuery.$hasNextPage,
    isFetchingNextPage: postsQuery.$isFetchingNextPage,
  })
  const fetchNext = useUnit(postsQuery.fetchNextPage)

  const allPosts = data?.pages.flatMap((page) => page.items) ?? []

  return (
    <div>
      {allPosts.map((post) => (
        <Post key={post.id} post={post} />
      ))}
      {hasNextPage && (
        <button onClick={fetchNext} disabled={isFetchingNextPage}>
          {isFetchingNextPage ? 'Loading...' : 'Load More'}
        </button>
      )}
    </div>
  )
}
```

### All returned stores and events

| Field                       | Type                                       | Description                    |
| --------------------------- | ------------------------------------------ | ------------------------------ |
| `$data`                     | `Store<InfiniteData<T> \| undefined>`      | All pages + pageParams         |
| `$error`                    | `Store<E \| null>`                         | Error, if any                  |
| `$status`                   | `Store<'pending' \| 'success' \| 'error'>` | Query status                   |
| `$isPending`                | `Store<boolean>`                           | No data yet                    |
| `$isFetching`               | `Store<boolean>`                           | Any request in flight          |
| `$isSuccess`                | `Store<boolean>`                           | Has data                       |
| `$isError`                  | `Store<boolean>`                           | Has error                      |
| `$isPlaceholderData`        | `Store<boolean>`                           | Showing placeholder            |
| `$fetchStatus`              | `Store<FetchStatus>`                       | Fetch status                   |
| `$hasNextPage`              | `Store<boolean>`                           | More pages available forward   |
| `$hasPreviousPage`          | `Store<boolean>`                           | More pages available backward  |
| `$isFetchingNextPage`       | `Store<boolean>`                           | Fetching next page             |
| `$isFetchingPreviousPage`   | `Store<boolean>`                           | Fetching previous page         |
| `$isFetchNextPageError`     | `Store<boolean>`                           | Next page fetch failed         |
| `$isFetchPreviousPageError` | `Store<boolean>`                           | Previous page fetch failed     |
| `fetchNextPage`             | `EventCallable<void>`                      | Fetch next page                |
| `fetchPreviousPage`         | `EventCallable<void>`                      | Fetch previous page            |
| `refresh`                   | `EventCallable<void>`                      | Invalidate & refetch all pages |
| `mounted`                   | `EventCallable<void>`                      | Start subscription             |
| `unmounted`                 | `EventCallable<void>`                      | Stop subscription              |

## createMutation

Executes mutations and tracks their state.

```ts
const addTodo = createMutation(queryClient, {
  mutationFn: (text: string) =>
    fetch('/api/todos', {
      method: 'POST',
      body: JSON.stringify({ text }),
    }).then((r) => r.json()),
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['todos'] })
  },
})

// Start the observer subscription
addTodo.start()

// Trigger the mutation
addTodo.mutate('Buy groceries')

// Read state
addTodo.$data // Store<Todo | undefined>
addTodo.$status // Store<'idle' | 'pending' | 'success' | 'error'>
addTodo.$variables // Store<string | undefined>
addTodo.$isPending // Store<boolean>
```

### Reset state

```ts
addTodo.reset() // back to idle
```

### Callbacks

```ts
const addTodo = createMutation(queryClient, {
  mutationFn: postTodo,
  onSuccess: (data, variables, context) => {
    queryClient.invalidateQueries({ queryKey: ['todos'] })
  },
  onError: (error, variables, context) => {
    console.error('Failed:', error.message)
  },
  onSettled: (data, error, variables, context) => {
    // runs on both success and error
  },
})
```

### Per-call callbacks

`mutate` accepts only the variables. For per-call `onSuccess`/`onError`/`onSettled` overrides (in addition to the observer-level ones), use `mutateWith`:

```ts
addTodo.mutateWith({
  variables: 'Buy groceries',
  onSuccess: (data) => navigate(`/todos/${data.id}`),
})
```

### Reacting to mutation outcome with `sample`

For module-level reactions (effector-idiomatic), wire `finished.success` / `finished.failure`:

```ts
sample({
  clock: addTodo.finished.success,
  fn: ({ params, result }) => `Added "${params}" → ${result.id}`,
  target: showToast,
})

sample({
  clock: addTodo.finished.failure,
  fn: ({ params, error }) => `Failed to add "${params}": ${error.message}`,
  target: showError,
})
```

### Cleanup

`unmounted` tears down the observer subscription so the queryClient can garbage-collect the mutation entry:

```ts
addTodo.unmounted()
```

The `useMutation` hook calls this automatically on component unmount.

### All returned stores and events

| Field        | Type                                                                                  | Description                              |
| ------------ | ------------------------------------------------------------------------------------- | ---------------------------------------- |
| `$data`      | `Store<T \| undefined>`                                                               | Mutation result                          |
| `$error`     | `Store<E \| null>`                                                                    | Error, if any                            |
| `$status`    | `Store<'idle' \| 'pending' \| 'success' \| 'error'>`                                  | Status                                   |
| `$variables` | `Store<V \| undefined>`                                                               | Last mutate args                         |
| `$isPaused`  | `Store<boolean>`                                                                      | Paused (e.g. offline)                    |
| `$isPending` | `Store<boolean>`                                                                      | Mutation running                         |
| `$isSuccess` | `Store<boolean>`                                                                      | Succeeded                                |
| `$isError`   | `Store<boolean>`                                                                      | Failed                                   |
| `$isIdle`    | `Store<boolean>`                                                                      | Not triggered yet                        |
| `mutate`     | `EventCallable<V>`                                                                    | Trigger mutation                         |
| `mutateWith` | `EventCallable<{ variables: V; onSuccess?; onError?; onSettled? }>`                   | Trigger with per-call callbacks          |
| `reset`      | `EventCallable<void>`                                                                 | Reset to idle                            |
| `start`      | `EventCallable<void>`                                                                 | Init subscription                        |
| `unmounted`  | `EventCallable<void>`                                                                 | Tear down subscription                   |
| `finished.success` | `Event<{ params: V; result: T }>`                                               | Fires once per successful mutate         |
| `finished.failure` | `Event<{ params: V; error: E }>`                                                | Fires once per failed mutate             |

All standard `MutationObserverOptions` are supported: `retry`, `retryDelay`, `onMutate`, `onSuccess`, `onError`, `onSettled`, `meta`, `mutationKey`, `networkMode`, etc.

## Usage with React

Two options: the high-level hooks from `effector-tanstack-query/react` (recommended), or the low-level `useUnit` pattern with manual lifecycle.

### High-level hooks

```tsx
import { useQuery, useMutation, useInfiniteQuery } from 'effector-tanstack-query/react'

function UserProfile() {
  const { data, isPending, error, refresh } = useQuery(userQuery)

  if (isPending) return <div>Loading...</div>
  if (error) return <div>Error: {error.message}</div>
  return (
    <div>
      <span>{data.name}</span>
      <button onClick={refresh}>refresh</button>
    </div>
  )
}
```

The hook automatically calls `mounted()` on mount, `unmounted()` on cleanup, and subscribes the component to all relevant stores via `useUnit`. `useMutation` similarly auto-calls `start()`, and `useInfiniteQuery` exposes bound `fetchNextPage` / `fetchPreviousPage` callbacks.

### Suspense

`useSuspenseQuery` and `useSuspenseInfiniteQuery` integrate with React `<Suspense>` and error boundaries. While the query is pending, they throw an inflight promise; on error, they throw the error; otherwise they return data directly.

```tsx
import { useSuspenseQuery } from 'effector-tanstack-query/react'

function UserProfile() {
  const user = useSuspenseQuery(userQuery) // throws or returns User
  return <div>{user.name}</div>
}

function App() {
  return (
    <ErrorBoundary fallback={(e) => <div>Error: {e.message}</div>}>
      <Suspense fallback={<div>Loading...</div>}>
        <UserProfile />
      </Suspense>
    </ErrorBoundary>
  )
}
```

The promise comes from `queryClient.fetchQuery(observer.options)`, so concurrent suspending consumers of the same `queryKey` deduplicate to a single fetch.

### Low-level `useUnit` pattern

For non-React consumers, or when you need full control over the lifecycle, drive the query directly:

```tsx
import { useUnit, Provider } from 'effector-react'

function UserProfile() {
  const { data, isPending, error } = useUnit({
    data: userQuery.$data,
    isPending: userQuery.$isPending,
    error: userQuery.$error,
  })

  if (isPending) return <div>Loading...</div>
  if (error) return <div>Error: {error.message}</div>
  return <div>{data.name}</div>
}

function App() {
  const mounted = useUnit(userQuery.mounted)
  const unmounted = useUnit(userQuery.unmounted)

  React.useEffect(() => {
    mounted()
    return () => unmounted()
  }, [])

  return <UserProfile />
}
```

## Testing with fork

Use Effector's `fork` for isolated test scopes:

```ts
import { fork, allSettled } from 'effector'

test('loads user data', async () => {
  const scope = fork()

  await allSettled(userQuery.mounted, { scope })
  await vi.advanceTimersByTimeAsync(10)

  expect(scope.getState(userQuery.$data)).toEqual({ name: 'Alice' })
  expect(scope.getState(userQuery.$status)).toBe('success')
})
```

## SSR

Two persistence layers cooperate to make SSR work:

1. The **`QueryClient` cache** — handle via `dehydrate` / `hydrate` from `@tanstack/query-core`.
2. The **effector scope** — handle via `serialize(scope)` / `fork({ values })`.

For (2) to work, each query/mutation/infiniteQuery must receive a unique `name`. Without it, the library's internal stores have no SID and `serialize(scope)` silently drops them. A development-mode warning fires the first time you create one without a name.

```ts
const userQuery = createQuery(queryClient, {
  name: 'userQuery', // required for scope serialization
  queryKey: ['user', $userId],
  queryFn: fetchUser,
})
```

### Server

```ts
import { dehydrate } from '@tanstack/query-core'
import { fork, allSettled, serialize } from 'effector'

const queryClient = new QueryClient()
queryClient.mount()
const scope = fork()

await allSettled(userQuery.mounted, { scope })
// ...wait for fetches to settle

const dehydratedQc = dehydrate(queryClient)
const serializedScope = serialize(scope)
// Send both to the client (e.g. in HTML <script> tags)
```

### Client

```ts
import { hydrate } from '@tanstack/query-core'
import { fork, allSettled } from 'effector'

const queryClient = new QueryClient()
queryClient.mount()
hydrate(queryClient, dehydratedQc)

const scope = fork({ values: serializedScope })

// Mounting the query will read from the hydrated cache —
// no refetch when staleTime keeps the data fresh.
await allSettled(userQuery.mounted, { scope })
```
