---
title: createInvalidate
description: Build a sample-friendly event that invalidates a query (or a key prefix) on the resolved QueryClient.
---

```ts
import { createInvalidate } from '@effector-tanstack-query/core'

// Uses the default $queryClient (set via setQueryClient / fork values).
function createInvalidate(
  options: CreateInvalidateOptions,
): EventCallable<void>

// Explicit client — locks the factory to this client; fork({ values })
// overrides of $queryClient do not apply.
function createInvalidate(
  queryClient: QueryClient,
  options: CreateInvalidateOptions,
): EventCallable<void>
```

Builds an effector event that invalidates a query (or a key prefix) on
the resolved `QueryClient`. Useful when you want to invalidate
declaratively from a `sample` — e.g. on a mutation's `finished.success`
— without writing a one-off `attach` every time.

## Options (`CreateInvalidateOptions`)

| Field         | Type                                              | Description                                                           |
| ------------- | ------------------------------------------------- | --------------------------------------------------------------------- |
| `queryKey`    | `EffectorQueryKey`                                | Key (or key prefix) — same reactive shape as `createQuery.queryKey`   |
| `exact`       | `boolean`                                         | Forwarded to `invalidateQueries({ exact })`. Default: `false` (prefix) |
| `refetchType` | `'active' \| 'inactive' \| 'all' \| 'none'`       | Which observers refetch after invalidation. Default: `'active'`       |
| `type`        | `'active' \| 'inactive' \| 'all'`                 | Which queries match the filter                                        |

## Examples

### Static key

```ts
import { createInvalidate, createMutation } from '@effector-tanstack-query/core'
import { sample } from 'effector'

const invalidateFavorites = createInvalidate({ queryKey: ['favorites'] })

sample({
  clock: addFavorite.finished.success,
  target: invalidateFavorites,
})
```

### Reactive key

`queryKey` accepts the same `Store`-in-array shape as `createQuery`. The
current store values are resolved on every invocation:

```ts
const invalidateUser = createInvalidate({ queryKey: ['user', $userId] })

invalidateUser() // → invalidates ['user', <current $userId>]
```

### Prefix invalidation

```ts
const invalidateAllUsers = createInvalidate({
  queryKey: ['user'],
  exact: false,         // ['user', 1], ['user', 2], etc. all match
})
```

### Explicit client (back-compat overload)

```ts
const invalidateFavorites = createInvalidate(queryClient, {
  queryKey: ['favorites'],
})
```

When called this way, the factory is **locked** to the passed client —
`fork({ values: [[$queryClient, otherQc]] })` will not redirect it.

## Per-scope behavior

When the default overload (no explicit client) is used, the event uses
the scope's `$queryClient`. Under `fork({ values })`, each scope
invalidates only its own QueryClient — no cross-scope leakage. This is
the same isolation contract as the other factories.

## See also

- [`refresh`](/effector-tanstack-query/api/create-query/) — equivalent event on a `QueryResult`, scoped to that single query.
