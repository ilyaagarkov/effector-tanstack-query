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
