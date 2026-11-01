---
title: createQuery
description: Create a query bound to a QueryClient and exposed as effector stores.
---

```ts
import { createQuery } from '@effector-tanstack-query/core'

// Uses the default $queryClient (set via setQueryClient / fork values).
function createQuery<TQueryFnData, TError = Error, TData = TQueryFnData>(
  options: CreateQueryOptions<TQueryFnData, TError, TData>,
): QueryResult<TData, TError>

// Explicit client — locks the factory to this client; fork({ values })
// overrides of $queryClient do not apply.
function createQuery<TQueryFnData, TError = Error, TData = TQueryFnData>(
  queryClient: QueryClient,
  options: CreateQueryOptions<TQueryFnData, TError, TData>,
): QueryResult<TData, TError>
```

## Options

`CreateQueryOptions` extends `QueryObserverOptions` from `@tanstack/query-core`, with these adaptations:

| Field             | Type                                                                            | Notes                                                                                  |
| ----------------- | ------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------- |
| `queryKey`        | `EffectorQueryKey`                                                              | Array; elements may be `Store` or value                                                |
| `enabled`         | `boolean \| Store<boolean>`                                                     | Reactive — accepts a store                                                             |
| `refetchInterval` | `number \| false \| ((q) => number \| false) \| Store<number \| false \| undefined>` | Static, function form (TanStack Query), or **Store form** for runtime polling toggling |
| `name`            | `string` (recommended)                                                          | Stable name for SID-based SSR                                                          |
| ...rest           | All other `QueryObserverOptions`                                                | `staleTime`, `gcTime`, `retry`, `select`, `refetchOnMount`, `refetchOnWindowFocus`, `refetchOnReconnect`, `placeholderData`, `meta`, `networkMode`, ... |

`EffectorQueryKey`:

```ts
type EffectorQueryKey = ReadonlyArray<
  StoreOrValue<string | number | bigint | boolean | null | undefined | object>
>
```

## Factory form

Pass an existing options factory through `source` and `query`:

```ts
import { createQuery } from '@effector-tanstack-query/core'
import { createStore } from 'effector'
import { todoOptions } from './queries'

const $todoId = createStore(1)
const todoQuery = createQuery({
  name: 'todo',
  source: { todoId: $todoId },
  query: todoOptions,
})
```

`source` accepts a store, a shallow object of stores, or an array/tuple of stores.
`query` receives their plain values and must synchronously return query options
with a `queryKey`. The factory runs when the model is created and when source
values change; keep side effects inside `queryFn`.
The complete options object updates together, including for prefetch and Suspense.
A source change does not necessarily fetch: TanStack decides from the key and options.

Array literals preserve per-position types:

```ts
const $ready = createStore(true)
const tupleQuery = createQuery({
  source: [$todoId, $ready],
  query: ([todoId, ready]) => ({
    ...todoOptions({ todoId }),
    enabled: ready,
  }),
})
```

A mutable tuple resolves to a mutable value tuple; a readonly tuple or object
preserves readonly in the callback type. A predeclared array remains an array,
without an inferred fixed length. This does not freeze values at runtime.

Shapes are shallow: every top-level entry must be a store. Plain values,
nested shapes, events and effects are not accepted directly. Use an explicit
`combine` for mixed, nested or derived parameters:

```ts
import { combine } from 'effector'

const $parameters = combine({
  todoId: $todoId,
  filter: 'active',
  context: combine({ ready: $ready }),
})

const combinedQuery = createQuery({
  source: $parameters,
  query: ({ todoId, filter, context }) => ({
    ...todoOptions({ todoId }),
    enabled: context.ready && filter === 'active',
  }),
})
```

`prefetch` reads the current scoped options and loads the QueryClient cache.
To also initialize result stores for SSR, use
[`prefetchQueries`](/effector-tanstack-query/api/prefetch-queries/), which then
mounts the queries. Completion does not guarantee that every query loaded
successfully; disabled queries can be skipped and requests can fail.

Only `name`, `enabled` and `refetchInterval` are allowed alongside `source` and
`query`. `enabled` accepts a boolean or boolean store; `refetchInterval` accepts
the native value/callback or a `Store<number | false | undefined>`. A defined
top-level value overrides the factory; `undefined` inherits, while `false` and
`0` override. Factory `enabled` must resolve to a boolean; a native callback
requires a boolean top-level override. Use `combine` for derived conditions.

Put `select`, `staleTime`, `placeholderData` and other TanStack options inside
the factory. If composition loses a callback's inferred type, annotate the
outer parameter:

```ts
query: ({ todoId }: { todoId: number }) => ({
  ...todoOptions({ todoId }),
  select: todo => todo.title,
})
```

Factories can return plain options or use compatible native helpers, such as
`@tanstack/react-query`'s `queryOptions`; our
[`queryOptions`](/effector-tanstack-query/api/query-options/) is optional.
Factory observers use `notifyOnChangeProps: 'all'` so model stores stay current.
`createQuery(queryClient, { source, query })` binds an explicit client.
If an options object has a defined top-level `queryKey`, the existing inline form takes precedence.

See [reusing factories](/effector-tanstack-query/guides/queries/#reusing-query-options-factories)
for sharing one definition across consumers.

## Cancellation

`queryFn` receives the standard TanStack [`AbortSignal`](https://tanstack.com/query/latest/docs/framework/react/guides/query-cancellation) as `context.signal`. Forward it to `fetch` (or any abortable API) and in-flight requests are cancelled automatically on key change, `unmounted()`, or a [`createCancel`](/effector-tanstack-query/api/cache-actions/) event — no extra wiring.

```ts
const userQuery = createQuery({
  name: 'user',
  queryKey: ['user', $userId],
  queryFn: ({ queryKey, signal }) =>
    fetch(`/api/user/${queryKey[1]}`, { signal }).then((r) => r.json()),
})
```

## Return value (`QueryResult<TData, TError>`)

| Field                | Type                                          | Description                              |
| -------------------- | --------------------------------------------- | ---------------------------------------- |
| `$data`              | `Store<TData \| undefined>`                   | The selected data (post-`select`)        |
| `$error`             | `Store<TError \| null>`                       | Last error                               |
| `$status`            | `Store<'pending' \| 'success' \| 'error'>`    | Query status                             |
| `$isPending`         | `Store<boolean>`                              | No data yet                              |
| `$isFetching`        | `Store<boolean>`                              | Request in flight                        |
| `$isSuccess`         | `Store<boolean>`                              | Has successful data                      |
| `$isError`           | `Store<boolean>`                              | Failed                                   |
| `$isPlaceholderData` | `Store<boolean>`                              | Showing placeholder                      |
| `$fetchStatus`       | `Store<'fetching' \| 'paused' \| 'idle'>`     | Underlying fetch status                  |
| `mounted`            | `EventCallable<void>`                         | Bump reference count; the first mount subscribes the observer |
| `unmounted`          | `EventCallable<void>`                         | Decrement; the last unmount unsubscribes + cancels inflight |
| `refresh`            | `EventCallable<void>`                         | Invalidate + refetch                     |
| `prefetch`           | `EventCallable<void>`                         | `queryClient.fetchQuery` + **awaits**; for SSR / route loaders |
| `$observer`          | `Store<QueryObserver<TData, TError> \| null>` | Per-scope observer (created on `mounted()`) |
| `$queryClient`       | `Store<QueryClient \| null>`                  | Resolved client for this query           |
| `finished`           | `{ success: Event<TData>; failure: Event<TError> }` | Lifecycle events for `sample`-driven reactions |

## Lifecycle events

`finished.success` and `finished.failure` let you react to **fetch completion**
from module-level `sample` wiring — no polling on `$status`, no manual diffing.
They mirror `createMutation`'s `finished`.

| Event              | Fires when…                                                            | Payload  |
| ------------------ | --------------------------------------------------------------------- | -------- |
| `finished.success` | A fetch resolves successfully — fresh fetch, `refresh()`, reactive key change, or a cross-scope `setQueryData` | `TData` (post-`select`) |
| `finished.failure` | A fetch fails                                                         | `TError` |

```ts
const userQuery = createQuery({
  name: 'user',
  queryKey: ['user', $userId],
  queryFn: ({ queryKey }) => fetchUser(queryKey[1]),
})

// After every successful fetch, load dependent data.
sample({
  clock: userQuery.finished.success,
  target: loadSettings,
})

// Toast on every failure.
sample({
  clock: userQuery.finished.failure,
  fn: (err) => `Failed: ${err.message}`,
  target: showToast,
})
```

The payload is the data / error directly (not `{ params, result }` like a
mutation) — a query has no per-call variations, and its key is resolved by the
factory. To use query parameters in the same reaction, read their stores
through `sample`'s `source`.

**Baseline — what does _not_ fire.** On the first observation in a scope (e.g.
`mounted()` over SSR-hydrated cache data) neither event fires. The events track
**new** fetches, not the initial observability of already-cached data —
otherwise every page load would re-fire `success` for hydrated data. Each fork
scope tracks its own baseline independently. Placeholder data
(`$isPlaceholderData`) never fires `success` either; only a real resolution
does. On the server, `prefetch` populates the cache without an observer
subscription, so no lifecycle events fire there.

## `prefetch` vs `mounted`

| Trigger    | What it does                                                   | `allSettled` returns when…           | Use case                                     |
| ---------- | -------------------------------------------------------------- | ------------------------------------ | -------------------------------------------- |
| `mounted`  | Creates the Observer, subscribes — initial fetch runs in background | The Observer is set up               | Component mount, in-page subscription        |
| `prefetch` | Calls `queryClient.fetchQuery` and **awaits** the result       | The query has resolved (data cached) | SSR prefetch, route loaders, on-hover prime  |

A typical SSR flow uses both:

```ts
await allSettled(userQuery.prefetch, { scope })  // populates qc cache
await allSettled(userQuery.mounted, { scope })   // dispatches into $data, $status, ...
```

`prefetch` is a no-op when `enabled` is `false`.

## Generic inference

```ts
// TQueryFnData inferred from queryFn
const q1 = createQuery({
  name: 'q1',
  queryKey: ['x'],
  queryFn: () => Promise.resolve({ id: 1, name: 'A' }),
})
// q1.$data: Store<{ id: number; name: string } | undefined>

// TData narrowed via select
const q2 = createQuery({
  name: 'q2',
  queryKey: ['x'],
  queryFn: () => Promise.resolve({ id: 1, name: 'A' }),
  select: (data) => data.name,
})
// q2.$data: Store<string | undefined>
```

Custom error type:

```ts
class HttpError extends Error { code = 0 }

const q = createQuery<User, HttpError>({ /* ... */ })
// q.$error: Store<HttpError | null>
```
