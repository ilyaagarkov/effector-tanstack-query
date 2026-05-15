---
title: HydrationBoundary
description: Merges a server-prefetched DehydratedState into the scope's QueryClient cache during the render phase.
---

```tsx
import { HydrationBoundary } from '@effector-tanstack-query/react'

function PageRoot({ dehydratedState, scope, children }) {
  return (
    <Provider value={scope}>
      <HydrationBoundary state={dehydratedState} />
      {children}
    </Provider>
  )
}
```

A direct analogue of [`<HydrationBoundary>`](https://tanstack.com/query/latest/docs/framework/react/reference/hydration#hydrationboundary) from `@tanstack/react-query` — but the `QueryClient` is read from the **effector scope** (`useUnit($queryClient)`), not from `QueryClientProvider` context. This matches how the rest of the library binds clients to scopes.

`<HydrationBoundary>` is a **side-effect component**, not a wrapper. Render it as a sibling of your consumers — same parent, declared first. React renders sibling children top-to-bottom, so `hydrate(qc, state)` finishes before any descendant in the tree gets to call `useQuery`. The wrapper form (`<HydrationBoundary>{children}</HydrationBoundary>`) still works — it's the same hydration, just nested one level deeper — but the flat sibling form reads more naturally as "snapshot two layers, render the tree".

## Behavior

- Calls `hydrate(queryClient, state, options)` inside `useMemo([queryClient, state, options])`. Hydration finishes during the **render phase**, so children render on first paint with a populated cache — no loading flash, no hydration mismatch.
- `hydrate` is idempotent. Re-rendering with the same `state` reference is a no-op. Pass a **new** `state` reference per page-load when the snapshot changes (e.g., on App Router navigation).
- No-op if the scope has no `QueryClient` (`$queryClient.current === null`) or `state` is `undefined`. Children still render.

> Effector store snapshots (`serialize(scope)`) flow through your existing `<Provider>` / `<EffectorNext values>` layer — `HydrationBoundary` does **not** touch them. The two layers are orthogonal: cache hydration here, store hydration in the effector provider.

## Type signature

```ts
function HydrationBoundary(props: HydrationBoundaryProps): React.ReactElement

interface HydrationBoundaryProps {
  state?: DehydratedState           // from dehydrate(queryClient)
  options?: HydrateOptions          // forwarded to @tanstack/query-core
  children?: React.ReactNode
}
```

## Why not just call `hydrate()` directly

You can:

```ts
hydrate(queryClient, dehydratedState)
```

But you'd need to do it once, before any observer in the scope mounts and reads the cache. Common attempts:

- **Outside React** — works for a singleton qc, but the React tree may render before the import is awaited.
- **`useEffect`** — runs after commit, too late. Observers that mounted in the first render see an empty cache → dispatch `pending` → blow away the data your effector stores hydrated from `serialize`.
- **`useState` initializer** — works but is an awkward way to express a render-phase side effect.

`<HydrationBoundary>` is the canonical packaging: `useMemo` with referentially-stable deps ([state]) runs once, in render, exactly where it needs to.

## Typical SSR flow

```tsx
// app/page.tsx — server component
const queryClient = new QueryClient()
const scope = fork({ values: [[$queryClient, queryClient]] })
await prefetchQueries([userQuery], { scope })

return (
  <EffectorNext values={serialize(scope)}>
    <HydrationBoundary state={dehydrate(queryClient)} />   {/* side effect */}
    <PageBody />                                            {/* consumer */}
  </EffectorNext>
)
```

`<EffectorNext>` provides the scope (so `useUnit($queryClient)` inside `<HydrationBoundary>` resolves to the client's QC). `<HydrationBoundary>` runs first as a sibling, calls `hydrate(qc, state)`, then `<PageBody />` renders with a populated cache.

See [SSR](/effector-tanstack-query/guides/ssr/) for the full Next.js App Router walkthrough.
