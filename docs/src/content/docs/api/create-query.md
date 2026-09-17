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
| `mounted`            | `EventCallable<void>`                         | Subscribe observer                       |
| `unmounted`          | `EventCallable<void>`                         | Unsubscribe + cancel inflight            |
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
factory. If you need the resolved key alongside the data, add a second `sample`
that reads `$status` or the internal `__resolvedKey` store.

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

To keep `queryKey` and `queryFn` in a reusable standard TanStack Query Options
factory while its parameters come from stores, use
[`createQueryFromOptions`](/effector-tanstack-query/api/create-query-from-options/).
