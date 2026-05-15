---
title: Migrating from @tanstack/react-query
description: Run @tanstack/react-query and @effector-tanstack-query side-by-side on a shared QueryClient — migrate components at your own pace without duplicating the cache.
---

You don't have to migrate the whole codebase in one sweep. Both libraries can read and write the **same** `QueryClient` cache at the same time — a `setQueryData` from vanilla `useQuery` re-renders our `useQuery`, an `invalidate` triggered through an effector factory re-renders vanilla components. Migrate routes (or even individual components) when it's convenient, and let the cache stay the source of truth in between.

This guide covers the SSR-aware setup. If you don't ship server-rendered pages, the client-only setup is a subset — skip straight to [Shared cache, shared key](#shared-cache-shared-key).

## Three things that must line up

For the two APIs to share a cache entry instead of accidentally maintaining two:

1. **One `QueryClient` instance.** On the client that's the browser singleton you built in your top-level provider. On the server it's the per-request `QueryClient` you built in your page's server component.
2. **One `queryKey`.** Byte-identical array shape and values — the very same primitive key is what links the two observers to the same cache row.
3. **Matching defaults** — `staleTime`, `gcTime`, `retry`. Diverging defaults mean one side will refetch while the other thinks the data is still fresh; you'll see "the new code somehow fetches twice".

Get those three right and the migration mechanics fall out. Skip any of them and you'll spend hours wondering why the cache "doesn't share".

## Shared cache, shared key

```ts
// model/users.ts
import { createQuery } from '@effector-tanstack-query/core'

export const USERS_KEY = ['users'] as const

export function fetchUsers(): Promise<User[]> {
  return fetch('/api/users').then((r) => r.json())
}

// New code — effector factory. queryKey/queryFn/staleTime are the
// single source of truth.
export const usersQuery = createQuery({
  name: 'users',
  queryKey: USERS_KEY,
  queryFn: fetchUsers,
  staleTime: 60_000,
})
```

```tsx
// component.tsx — vanilla side (legacy code, untouched)
import { useQuery as useVanillaQuery } from '@tanstack/react-query'
import { USERS_KEY, fetchUsers } from '@/model/users'

function LegacyList() {
  const { data } = useVanillaQuery({
    queryKey: USERS_KEY,         // ← same key
    queryFn: fetchUsers,         // ← same function
    staleTime: 60_000,           // ← same defaults
  })
  return data?.map(/* … */)
}
```

```tsx
// other-component.tsx — migrated side
import { useQuery } from '@effector-tanstack-query/react'
import { usersQuery } from '@/model/users'

function NewList() {
  const { data } = useQuery(usersQuery)
  return data?.map(/* … */)
}
```

Both components read from the same cache row. `invalidateQueries({ queryKey: USERS_KEY })` from anywhere re-fetches once and pushes new data to both.

## Bridging the two scopes

`@tanstack/react-query`'s hooks look up the `QueryClient` from React **context** (`<QueryClientProvider>`). This library looks it up from the **effector scope** (`useUnit($queryClient)`). For a migration setup both lookups have to land on the same instance.

That's what [`<QueryClientCompatProvider>`](#queryclientcompatprovider) does: read `$queryClient` and hand the same instance to `<QueryClientProvider>`.

```bash
pnpm add @tanstack/react-query
# already installed: @effector-tanstack-query/react
```

```tsx
// migration-area-layout.tsx (client)
'use client'

import { QueryClientCompatProvider } from '@effector-tanstack-query/react/compat'

export function MigrationLayout({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientCompatProvider
      defaultOptions={{ queries: { retry: false, staleTime: 60_000 } }}
    >
      {children}
    </QueryClientCompatProvider>
  )
}
```

`@tanstack/react-query` is an **optional peer dep** — non-migrating users don't have to install it. The compat module is published as a separate subpath (`@effector-tanstack-query/react/compat`) so its weight is only paid when you import it.

## SSR (Next.js App Router)

```tsx
// app/migration/page.tsx (server)
import { dehydrate, HydrationBoundary } from '@tanstack/react-query'
import { serialize } from 'effector'
import { EffectorNext } from '@effector/next'
import { prefetchQueries } from '@effector-tanstack-query/core'
import { QueryClientCompatProvider } from '@effector-tanstack-query/react/compat'
import { usersQuery } from '@/model/users'
import { makeRequestScope } from '@/lib/server'

export default async function MigrationPage() {
  const { queryClient, scope } = makeRequestScope()

  // One prefetch, both sides. Same queryKey → same cache entry.
  await prefetchQueries([usersQuery], { scope })

  return (
    <QueryClientCompatProvider
      defaultOptions={{ queries: { retry: false, staleTime: 60_000 } }}
    >
      <HydrationBoundary state={dehydrate(queryClient)} />
      <EffectorNext values={serialize(scope)}>
        <PageBody />
      </EffectorNext>
    </QueryClientCompatProvider>
  )
}
```

A few things to notice:

- **Vanilla `<HydrationBoundary>`** (from `@tanstack/react-query`) is what hydrates the cache here — not `@effector-tanstack-query/react`'s `<HydrationBoundary>`. In a migration setup vanilla covers both sides: on the server it hydrates the per-render fallback `QueryClient` from `<QueryClientCompatProvider>` (so vanilla `useQuery` gets data for SSR HTML), and on the client it hydrates the browser singleton (which `$queryClient` also points at, so effector observers see the same data).
- **Sibling pattern.** `<HydrationBoundary>` is a side-effect-only component — it calls `hydrate(qc, state)` during render. Rendered as a sibling of `<EffectorNext>` rather than as a wrapper, so the layered story reads naturally as "snapshot two layers, then render the tree".
- **Single prefetch fills both sides.** `prefetchQueries([usersQuery], { scope })` writes into the per-request `QueryClient` AND mounts the effector observer (populates `$data`). `dehydrate(queryClient)` carries the cache snapshot; `serialize(scope)` carries the effector store snapshot. Both ride the RSC payload to the client.

## `QueryClientCompatProvider`

```ts
import { QueryClientCompatProvider } from '@effector-tanstack-query/react/compat'

interface QueryClientCompatProviderProps {
  children: React.ReactNode
  /**
   * `defaultOptions` for the per-render server fallback `QueryClient`.
   * Has no effect on the client — there it forwards the singleton built
   * in your top-level provider.
   */
  defaultOptions?: DefaultOptions
}
```

Internally:

- **Client.** `useUnit($queryClient)` returns the singleton browser `QueryClient` (set by your top-level provider via `setQueryClient(qc)` + `allSettled($queryClient, { params: qc, scope })`). Hands that exact instance to `<QueryClientProvider>`. Vanilla `useQuery` and our `useQuery` now see the same cache.

- **Server.** `$queryClient` is `serialize: 'ignore'` (instances can't ride through `serialize(scope)`, and per-request QCs **must not** become a module-level singleton on the server — that would leak data between concurrent requests). So `useUnit($queryClient)` resolves to `null` inside the RSC rendering scope. To keep vanilla `useQuery` working during the server pass, the provider creates a **throwaway per-render `QueryClient`** via `useState(() => isServer ? new QueryClient(...) : null)`. The neighbouring `<HydrationBoundary state={dehydrate(...)}>` then `hydrate`s this throwaway with the same snapshot that gets shipped to the client — so server-rendered HTML shows data instead of a loading flash.

- **Hydration handover.** When the client mounts, `useUnit($queryClient)` flips from `null` to the singleton, the provider re-renders with the singleton client, react-query re-subscribes its observers, and from that moment forward both APIs read and write the same browser-side `QueryClient`. The throwaway server QC is GCed with the React tree it was created in.

The `useState` initializer makes the fallback per-component-instance, not module-level — concurrent SSR requests don't share it.

## Pitfalls

- **Don't create a second `QueryClient` "just for react-query".** Two clients = two caches. `<QueryClientCompatProvider>` exists precisely so you don't have to.
- **Don't double-prefetch.** One `prefetchQueries(...)` (or one `qc.prefetchQuery(...)`) fills the shared cache entry — calling both wastes a network round-trip.
- **Default options must match between sides.** Centralise them on the effector factory; copy them into vanilla call-sites byte-for-byte; refactor when they drift.
- **Provider order.** `<QueryClientProvider>` (i.e. `<QueryClientCompatProvider>`) must be an ancestor of `<HydrationBoundary>` from `@tanstack/react-query` — the boundary looks up the QC via context and crashes without a provider.
- **Module-level singletons on the server are unsafe.** It can be tempting to `let qc = qc ?? new QueryClient()` at module scope to "share" it with client components. Don't — that singleton would survive across concurrent requests and leak data between users. The per-render fallback the provider creates is correct and per-request by construction.

## Finishing the migration

Once every component for a feature has been moved to `useQuery(factory)`:

1. Drop the vanilla `useQuery({ queryKey, queryFn })` call sites.
2. Remove `@tanstack/react-query` from that route's tree — drop the `<QueryClientCompatProvider>` + vanilla `<HydrationBoundary>` pair and replace with `<HydrationBoundary>` from `@effector-tanstack-query/react` (sibling, same pattern; no `QueryClientProvider` needed).
3. When no vanilla `useQuery` remains anywhere, uninstall `@tanstack/react-query` — `@effector-tanstack-query/react` only depends on `@tanstack/query-core`.

A complete working migration playground (both APIs on one cache, with mutation propagation in both directions) lives in [`examples/ssr/app/migration`](https://github.com/ilyaagarkov/effector-tanstack-query/tree/master/examples/ssr/app/migration).
