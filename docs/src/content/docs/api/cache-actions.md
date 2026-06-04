---
title: Cache actions (cancel / remove / reset)
description: Sample-friendly events that cancel, remove, or reset queries on the resolved QueryClient.
---

```ts
import {
  createCancel,
  createRemove,
  createReset,
} from '@effector-tanstack-query/core'
```

`createCancel`, `createRemove`, and `createReset` build effector events that run
the matching `QueryClient` method when fired — the cache-mutation counterparts
to [`createInvalidate`](/effector-tanstack-query/api/create-invalidate/). Wire
them into a `sample` to react declaratively to user events (logout, navigation,
cleared filters) without writing a one-off `attach` each time.

| Factory        | QueryClient method        | Semantics                                                                 | Async? |
| -------------- | ------------------------- | ------------------------------------------------------------------------- | ------ |
| `createCancel` | `cancelQueries(filters)`  | Cancels in-flight fetches **without** discarding cached data              | yes    |
| `createRemove` | `removeQueries(filters)`  | Removes matching entries from the cache entirely (next mount is pending)  | no     |
| `createReset`  | `resetQueries(filters)`   | Resets matching queries to initial state and refetches active observers   | yes    |

Each returns an `EventCallable<void>`. The async ones (`cancel`, `reset`) return
a Promise from the underlying method, so `await allSettled(action, { scope })`
waits for them to settle — handy for SSR / route teardown.

## Signatures

```ts
// Default $queryClient (set via setQueryClient / fork values)
function createCancel(options: CacheActionOptions): EventCallable<void>
function createRemove(options: CacheActionOptions): EventCallable<void>
function createReset(options: CacheActionOptions): EventCallable<void>

// Explicit client — locks the factory to this client; fork({ values })
// overrides of $queryClient do not apply.
function createCancel(qc: QueryClient, options: CacheActionOptions): EventCallable<void>
function createRemove(qc: QueryClient, options: CacheActionOptions): EventCallable<void>
function createReset(qc: QueryClient, options: CacheActionOptions): EventCallable<void>
```

## Options (`CacheActionOptions`)

Structurally a `QueryFilters` from `@tanstack/query-core`, with `queryKey`
widened to the reactive `EffectorQueryKey` shape.

| Field      | Type                              | Description                                                                                  |
| ---------- | --------------------------------- | -------------------------------------------------------------------------------------------- |
| `queryKey` | `EffectorQueryKey` (optional)     | Key (or prefix) — same reactive `Store`-in-array shape as `createQuery.queryKey`. **Omit to target every query.** |
| `exact`    | `boolean`                         | Match the key exactly instead of as a prefix                                                 |
| `type`     | `'active' \| 'inactive' \| 'all'` | Which queries match                                                                           |
| `stale`    | `boolean`                         | Match only stale / fresh queries                                                             |
| `predicate`| `(query) => boolean`              | Arbitrary custom matcher                                                                      |

Omitting `queryKey` applies the action to **all** queries — the same default as
calling `queryClient.cancelQueries()` with no filters.

## Examples

### Cancel a user's queries on logout

```ts
import { createCancel, createRemove } from '@effector-tanstack-query/core'
import { sample } from 'effector'

const cancelUserQueries = createCancel({ queryKey: ['user', $userId] })
const removeUserCache = createRemove({ queryKey: ['user'] })

sample({
  clock: logoutClicked,
  target: [cancelUserQueries, removeUserCache],
})
```

### Reset search results when filters clear

```ts
const resetSearch = createReset({ queryKey: ['search'] })

sample({ clock: filtersCleared, target: resetSearch })
```

### Reactive key

`queryKey` accepts `Store` elements, resolved on every invocation:

```ts
const cancelUser = createCancel({ queryKey: ['user', $userId] })

cancelUser() // → cancels ['user', <current $userId>]
```

### SSR / route teardown

```ts
// `cancel` and `reset` are async — allSettled waits for them.
await allSettled(cancelUserQueries, { scope })
```

### Explicit client (back-compat overload)

```ts
const removeStale = createRemove(queryClient, { queryKey: ['stale-cache'] })
```

When called this way the factory is **locked** to the passed client —
`fork({ values: [[$queryClient, otherQc]] })` will not redirect it.

## Per-scope behavior

With the default overload (no explicit client), the event uses the scope's
`$queryClient`. Under `fork({ values })`, each scope acts only on its own
QueryClient — the same isolation contract as the other factories. When no client
is set, firing the event is a safe no-op.

## See also

- [`createInvalidate`](/effector-tanstack-query/api/create-invalidate/) — invalidate + background refetch.
- [`refresh`](/effector-tanstack-query/api/create-query/) — per-query invalidate on a `QueryResult`.
