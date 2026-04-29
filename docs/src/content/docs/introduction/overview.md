---
title: Overview
description: What effector-tanstack-query is, what it isn't, and when to reach for it.
---

`effector-tanstack-query` is a thin adapter that exposes [TanStack Query](https://tanstack.com/query) as effector units. It does **not** reimplement the cache, dedup, or revalidation logic — it forwards them.

## What you get

- **Stores instead of result objects.** Every observer field (`data`, `status`, `isPending`, …) becomes a `Store<T>` you can `combine` and `sample` from.
- **Events instead of imperative methods.** `mounted` / `unmounted` / `mutate` / `refresh` / `fetchNextPage` are `EventCallable`s — call them directly or wire them via `sample`.
- **Reactive query keys.** A `Store` placed inside `queryKey` triggers a refetch when it updates. No manual `invalidateQueries`.
- **SSR via two layers.** Hydrate `queryClient` with `dehydrate`/`hydrate` AND restore effector scope via `serialize(scope)` / `fork({ values })`.
- **React entry point.** Optional `@effector-tanstack-query/react` package ships `useQuery`, `useMutation`, `useSuspenseQuery`, etc. — same data, just with auto mount/unmount.

## What this is *not*

- **Not a different cache.** Behavior, semantics, and options come straight from TanStack Query (`@tanstack/query-core`). If TanStack Query supports `staleTime: Infinity`, so do we — same defaults, same edge cases.
- **Not React-bound.** Core works in any environment with effector. React is opt-in via the `/react` subpackage.
- **Not a `useQueries` replacement** for now. Multiple independent queries are usually expressed in effector via several `createQuery` calls + `combine`. A future `createQueries` factory may be added if real use cases warrant it.

## Comparison

| Concept             | react-query                          | effector-tanstack-query                          |
| ------------------- | ------------------------------------ | ------------------------------------------------ |
| Read query state    | `const { data } = useQuery(...)`     | `useUnit(query.$data)` or `useQuery(query)`      |
| Reactive key        | `useState` + `queryKey: [..., id]`   | `Store` directly inside `queryKey`               |
| Trigger fetch       | implicit on mount                    | `query.mounted()` (or via `useQuery` hook)       |
| Invalidate          | `queryClient.invalidateQueries(...)` | `query.refresh()`                                |
| React to outcome    | callbacks per `mutate(vars, opts)`   | `sample({ clock: m.finished.success, ... })`     |
| SSR hydration       | `<HydrationBoundary>`                | `hydrate(qc, ...)` + `fork({ values: ... })`     |

Both run on top of the same `@tanstack/query-core` cache.
