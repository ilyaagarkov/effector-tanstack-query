---
title: Query families
description: Build a reactive family of parallel queries indexed by a source store — typical "fetch details per row of a list" pattern.
---

`createQueries({ source, query })` builds a **family** — one parallel query per element of a reactive `source` store. Adding items spawns observers; removing items disposes them; reordering preserves them. The whole family exposes a single set of effector stores (`$items`, `$data`, `$isPending`, …) plus lifecycle events.

## When to use it

| Situation                                                              | Use                                       |
| ---------------------------------------------------------------------- | ----------------------------------------- |
| One query with reactive parameters (`['user', $currentId]`)            | [`createQuery`](/effector-tanstack-query/api/create-query/) |
| A fixed set of unrelated queries on a page (user + posts + settings)   | [`useQueries([f1, f2, f3])`](/effector-tanstack-query/react/use-queries/) |
| Dynamic list — N queries with the same shape, varying by item          | **`createQueries`** + `useQueries(family)` |

## Defining a family

```ts
import { createStore, createEvent } from 'effector'
import { createQueries } from '@effector-tanstack-query/core'

const $userIds = createStore<number[]>([])
export const userIdsSet = createEvent<number[]>()
$userIds.on(userIdsSet, (_, ids) => ids)

export const usersFamily = createQueries({
  name: 'users.list',
  source: $userIds,
  query: (id) => ({
    queryKey: ['user', id],
    queryFn: () => fetchUser(id),
    // `enabled` is a plain boolean — re-runs whenever source changes
    enabled: id > 0,
  }),
  // Shared options applied on top of every per-item `query(id)`
  staleTime: 60_000,
})
```

`query(item)` must be **pure** — the same item in always yields the same options. Reactivity comes from the `source` store; whenever it updates, the callback fires for every item to compute fresh options.

## Consuming the family

### React, non-suspense

```tsx
import { useQueries } from '@effector-tanstack-query/react'

function UserList() {
  const items = useQueries(usersFamily)
  return items.map((it, i) =>
    it.isPending ? <Skeleton key={i} /> : <UserCard key={i} user={it.data!} />,
  )
}
```

Each item is the standard `UseQueryResult` shape. Calling `items[i].refresh()` routes to `family.refreshOne(items[i].source)` — re-fetches just that one.

### React, Suspense

```tsx
import { useSuspenseQueries } from '@effector-tanstack-query/react'

function UserList() {
  const items = useSuspenseQueries(usersFamily)
  // each items[i].data is User (non-nullable past the Suspense gate)
  return items.map((it) => <UserCard key={it.data.id} user={it.data} />)
}
```

Throws an aggregated `Promise.all(...)` of every pending item — `<Suspense>` waits until they all settle. First errored item throws to the nearest `<ErrorBoundary>`.

### Pure effector

```ts
import { useUnit } from 'effector-react'

function UserList() {
  const items = useUnit(usersFamily.$items)
  React.useEffect(() => {
    usersFamily.mounted()
    return () => usersFamily.unmounted()
  }, [])
  return items.map(/* … */)
}
```

`mounted()` / `unmounted()` are reference-counted — multiple consumers in the same scope share observers; the last unmount tears them down.

## SSR

Plugs into `prefetchQueries` like any other factory:

```ts
import { dehydrate } from '@tanstack/query-core'
import { serialize, allSettled } from 'effector'
import { prefetchQueries } from '@effector-tanstack-query/core'

// Server-side page handler
const { queryClient, scope } = makeRequestScope()

await allSettled(userIdsSet, { params: [1, 2, 3], scope })
await prefetchQueries([usersFamily], { scope })

return {
  dehydrated: dehydrate(queryClient),
  serialized: serialize(scope),
}
```

`prefetch` walks the current `source`, calls `qc.fetchQuery(...)` for every item in parallel, awaits all, then mounts observers so `$items` carries the populated snapshot through `serialize(scope)`. Set the source value via `allSettled(sourceEvent, { params: …, scope })` BEFORE prefetch — `query(item)` reads it synchronously.

## Pitfalls

- **`query` must be pure.** Don't read `Date.now()` or scope state inside it. Reactivity flows through `source`; arbitrary side effects break the diff (same item produces different `queryKey` → new observer every render).
- **Duplicates in source.** Two equal items produce one observer but two `$items` entries (parallel to source). Intentional in most cases (rendering the same row twice), occasionally surprising. De-dup at the source level if it matters.
- **Reordering is cheap.** Adding `[1, 2, 3] → [3, 2, 1]` doesn't re-fetch — observers stay keyed by `hashKey(queryKey)`. `$items` just re-projects.
- **Per-item `enabled`** is a plain `boolean`, not a `Store`. To switch enabledness, update the `source` so `query(item).enabled` evaluates differently — that's the only reactive path.
- **`name` is required for SSR.** Without it the `$items` snapshot is silently dropped from `serialize(scope)`.

## Working example

`examples/ssr` doesn't ship a family demo (yet); see the test suite at [`packages/core/src/__tests__/createQueries.test.ts`](https://github.com/ilyaagarkov/effector-tanstack-query/blob/master/packages/core/src/__tests__/createQueries.test.ts) for end-to-end SSR + diff + lifecycle behaviour.
