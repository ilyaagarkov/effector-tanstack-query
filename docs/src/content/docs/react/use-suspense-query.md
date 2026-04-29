---
title: useSuspenseQuery
description: Suspense-friendly hook that throws the inflight promise during pending and the error during failure.
---

```ts
import { useSuspenseQuery } from '@effector-tanstack-query/react'

function Component() {
  const data = useSuspenseQuery(query) // returns TData directly, never undefined
  return <h1>{data.name}</h1>
}
```

Wrap with `<Suspense>` and `<ErrorBoundary>`:

```tsx
<ErrorBoundary fallback={(e) => <p>Error: {e.message}</p>}>
  <Suspense fallback={<p>Loading…</p>}>
    <Component />
  </Suspense>
</ErrorBoundary>
```

## Behavior

- `'pending'` → throws `observer.fetchOptimistic(observer.options)` — a promise deduplicated by `queryHash`.
- `'error'` → throws the error object (caught by ErrorBoundary).
- `'success'` → returns `result.data` (typed as `TData`, never `undefined`).
- Cache hit → returns immediately, doesn't suspend.

## Type signature

```ts
function useSuspenseQuery<TData, TError = Error>(
  query: QueryResult<TData, TError>,
): TData
```

## Subscription

The hook calls `observer.subscribe` directly via `useSyncExternalStore` (so re-renders fire on cache updates after suspense resolves) AND calls `query.mounted()` / `query.unmounted()` for compatibility with concurrent `useQuery` consumers reading the same query through scope.

See [Suspense guide](/effector-tanstack-query/guides/suspense/) for details.
