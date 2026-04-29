---
title: createQuery
description: Create a query bound to a QueryClient and exposed as effector stores.
---

```ts
import { createQuery } from '@effector-tanstack-query/core'

function createQuery<TQueryFnData, TError = Error, TData = TQueryFnData>(
  queryClient: QueryClient,
  options: CreateQueryOptions<TQueryFnData, TError, TData>,
): QueryResult<TData, TError>
```

## Options

`CreateQueryOptions` extends `QueryObserverOptions` from `@tanstack/query-core`, with these adaptations:

| Field      | Type                                                | Notes                                    |
| ---------- | --------------------------------------------------- | ---------------------------------------- |
| `queryKey` | `EffectorQueryKey`                                  | Array; elements may be `Store` or value  |
| `enabled`  | `boolean \| Store<boolean>`                         | Reactive — accepts a store               |
| `name`     | `string` (recommended)                              | Stable name for SID-based SSR            |
| ...rest    | All other `QueryObserverOptions`                    | `staleTime`, `gcTime`, `retry`, `select`, `refetchInterval`, `refetchOnMount`, `refetchOnWindowFocus`, `refetchOnReconnect`, `placeholderData`, `meta`, `networkMode`, ... |

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
| `observer`           | `QueryObserver<TData, TError>`                | Underlying observer (advanced use)       |

## Generic inference

```ts
// TQueryFnData inferred from queryFn
const q1 = createQuery(qc, {
  name: 'q1',
  queryKey: ['x'],
  queryFn: () => Promise.resolve({ id: 1, name: 'A' }),
})
// q1.$data: Store<{ id: number; name: string } | undefined>

// TData narrowed via select
const q2 = createQuery(qc, {
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

const q = createQuery<User, HttpError>(qc, { /* ... */ })
// q.$error: Store<HttpError | null>
```
