---
title: createQueries
description: Reactive family of parallel queries indexed by a source store.
---

A factory that produces **one parallel query per element** of a reactive `source` store. Adding or removing items from `source` spawns or disposes observers automatically; reordering preserves observers. Designed for the typical "fetch details for each row of a list" pattern.

Like [`createQuery`](/effector-tanstack-query/api/create-query/), it has two forms — the default uses the per-scope `$queryClient`, the explicit form takes a `QueryClient` as the first argument and locks the family to it.

## Example

```ts
import { createStore } from 'effector'
import { createQueries } from '@effector-tanstack-query/core'

const $userIds = createStore<number[]>([1, 2, 3])

const usersFamily = createQueries({
  name: 'users.list',
  source: $userIds,
  query: (id) => ({
    queryKey: ['user', id],
    queryFn: () => fetchUser(id),
    enabled: id > 0,             // per-item static boolean
  }),
  staleTime: 60_000,             // shared default for every item
})
```

## Options

| Field        | Type                                          | Notes                                                              |
| ------------ | --------------------------------------------- | ------------------------------------------------------------------ |
| `name`       | `string` (recommended)                        | Stable name → SID for `$items` so `serialize(scope)` round-trips it |
| `source`     | `Store<ReadonlyArray<TItem>>`                 | Reactive list. Duplicates collapse observers but appear in `$items` |
| `query`      | `(item: TItem) => { queryKey, queryFn, enabled? }` | Pure — same item in, same options out. Re-runs on source change   |
| `staleTime`, `gcTime`, `retry`, `retryDelay`, `refetchOn*`, `networkMode` | `QueryObserverOptions` fields | Shared across every observer in the family |

`query(item).enabled` is a plain `boolean` — not a `Store`. Reactivity is already covered by the `source` store: the callback re-runs whenever `source` updates.

## Return value (`QueriesResult<TItem, TData, TError>`)

| Field         | Type                                                                      | Description                                                            |
| ------------- | ------------------------------------------------------------------------- | ---------------------------------------------------------------------- |
| `$items`      | `Store<ReadonlyArray<QueryItemState<TItem, TData, TError>>>`              | Per-item snapshot parallel to `source`                                 |
| `$data`       | `Store<ReadonlyArray<TData \| undefined>>`                                 | Shortcut — just the `data` of each item                                |
| `$isPending`  | `Store<boolean>`                                                           | `true` while **any** item is pending                                   |
| `$isSuccess`  | `Store<boolean>`                                                           | `true` only when **every** item has succeeded                          |
| `$isFetching` | `Store<boolean>`                                                           | `true` while **any** item is fetching (background refetches too)       |
| `$isError`    | `Store<boolean>`                                                           | `true` if **any** item is in error                                     |
| `mounted`     | `EventCallable<void>`                                                      | Bump reference count, subscribe observers to QueryCache                |
| `unmounted`   | `EventCallable<void>`                                                      | Decrement; the last unmount unsubscribes everything                    |
| `refresh`     | `EventCallable<void>`                                                      | Re-fetch every item in parallel                                        |
| `refreshOne`  | `EventCallable<TItem>`                                                     | Re-fetch one specific item                                             |
| `prefetch`    | `EventCallable<void>`                                                      | SSR-friendly — `qc.fetchQuery` for every current item, awaited via `allSettled` |
| `$queryClient`| `Store<QueryClient \| null>`                                              | The bound client (per scope or the explicit one)                       |

`QueryItemState<TItem, TData, TError>`:

```ts
interface QueryItemState<TItem, TData, TError> {
  source: TItem
  data: TData | undefined
  error: TError | null
  status: 'pending' | 'success' | 'error'
  isPending: boolean
  isFetching: boolean
  isSuccess: boolean
  isError: boolean
  isPlaceholderData: boolean
  fetchStatus: 'fetching' | 'paused' | 'idle'
}
```

## SSR

`prefetchQueries` accepts a family alongside regular queries — it satisfies `PrefetchableQuery` structurally:

```ts
import { prefetchQueries } from '@effector-tanstack-query/core'

await prefetchQueries([usersFamily, otherQuery], { scope })
```

Each item's `queryFn` runs in parallel via `qc.fetchQuery`; once all settle, the observers mount and `$items` carries the populated snapshot through `serialize(scope)`.

## React consumption

- Reactive style (no React): `useUnit(usersFamily.$items)` plus `useEffect(() => { usersFamily.mounted(); return () => usersFamily.unmounted() }, [])`.
- React-style: [`useQueries(usersFamily)`](/effector-tanstack-query/react/use-queries/) or [`useSuspenseQueries(usersFamily)`](/effector-tanstack-query/react/use-suspense-queries/) — both handle the mount lifecycle for you.

See the [Queries family guide](/effector-tanstack-query/guides/queries-family/) for the full walk-through.
