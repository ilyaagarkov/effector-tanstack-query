---
title: useSuspenseQuery
description: Suspense-friendly hook that throws the inflight promise during pending and the error during failure.
---

```ts
import { useSuspenseQuery } from '@effector-tanstack-query/react'

function Component() {
  const { data, isFetching, refresh } = useSuspenseQuery(query)
  // `data` is non-nullable (Suspense absorbs pending); `isFetching` flips
  // true during background refetches.
  return (
    <div>
      <h1>{data.name}</h1>
      {isFetching && <span>refreshing…</span>}
    </div>
  )
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
- `'error'` → throws the error (caught by ErrorBoundary).
- `'success'` → returns the result object with `data: TData` (non-nullable).
- Cache hit → returns immediately, doesn't suspend.

The hook returns the **same shape as `useQuery`**, but with the static guarantees of the Suspense gate baked into the types — `data` can't be `undefined`, `isPending` is always `false`, `isError` is always `false`.

## Return value

| Field               | Type                                       | Description                                  |
| ------------------- | ------------------------------------------ | -------------------------------------------- |
| `data`              | `TData`                                    | Non-nullable                                 |
| `error`             | `TError \| null`                           | Always `null` past the Suspense gate         |
| `status`            | `'success'`                                |                                              |
| `isPending`         | `false`                                    |                                              |
| `isSuccess`         | `true`                                     |                                              |
| `isError`           | `false`                                    |                                              |
| `isFetching`        | `boolean`                                  | `true` during background refetch             |
| `isPlaceholderData` | `boolean`                                  |                                              |
| `fetchStatus`       | `'fetching' \| 'paused' \| 'idle'`         |                                              |
| `refresh`           | `() => void`                               | Invalidates and refetches                    |

## Type signature

```ts
function useSuspenseQuery<TData, TError = Error>(
  query: QueryResult<TData, TError>,
  options?: { notifyOnChangeProps?: 'tracked' | 'all' }, // default: 'tracked'
): UseSuspenseQueryResult<TData, TError>
```

## Subscription

The hook subscribes to observer notifications (so background refetches refresh the UI) AND calls `query.mounted()` / `query.unmounted()` for compatibility with concurrent `useQuery` consumers reading the same query through scope.

Past the gate it re-renders only when a field the component read changes — a component that reads only `data` doesn't re-render while a background refetch runs. Going back to `pending` or failing always re-renders, so the hook can suspend again or throw. Pass `{ notifyOnChangeProps: 'all' }` to re-render on every field. See [Re-renders and tracked results](/effector-tanstack-query/guides/render-tracking/).

See the [Suspense guide](/effector-tanstack-query/guides/suspense/) for details.
