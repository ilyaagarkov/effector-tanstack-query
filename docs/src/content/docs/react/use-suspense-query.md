---
title: useSuspenseQuery
description: Suspense-friendly hook that throws the inflight promise while pending and the error when a query fails without data.
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
- `'error'` without data → throws the error (caught by ErrorBoundary).
- `'error'` with data (a failed refetch) → returns the data with `status: 'error'`, `isError: true` and `error` set.
- `'success'` → returns the result object with `data: TData` (non-nullable).
- Cache hit → returns immediately, doesn't suspend.

The hook returns the **same shape as `useQuery`**, but with the static guarantees of the Suspense gate baked into the types — `data` can't be `undefined` and `isPending` is always `false`. The result is a union on `status`: narrow on `isError` (or `status === 'error'`) to read `error` as `TError`; otherwise it's `null`.

## Return value

| Field               | Type                                       | Description                                  |
| ------------------- | ------------------------------------------ | -------------------------------------------- |
| `data`              | `TData`                                    | Non-nullable                                 |
| `error`             | `TError \| null`                           | Set after a failed refetch, otherwise `null` |
| `status`            | `'success' \| 'error'`                     | `'error'` after a failed refetch             |
| `isPending`         | `false`                                    |                                              |
| `isSuccess`         | `boolean`                                  |                                              |
| `isError`           | `boolean`                                  | Narrows `error` to `TError`                  |
| `isFetching`        | `boolean`                                  | `true` during background refetch             |
| `isPlaceholderData` | `boolean`                                  |                                              |
| `fetchStatus`       | `'fetching' \| 'paused' \| 'idle'`         |                                              |
| `refresh`           | `() => void`                               | Invalidates and refetches                    |

## Type signature

```ts
function useSuspenseQuery<TData, TError = Error>(
  query: QueryResult<TData, TError>,
  // notifyOnChangeProps: 'tracked' (default) | 'all' | a list of result fields
  options?: ResultHookOptions<UseSuspenseQueryResult<TData, TError>>,
): UseSuspenseQueryResult<TData, TError>
```

## Subscription

The hook subscribes to observer notifications (so background refetches refresh the UI) AND calls `query.mounted()` / `query.unmounted()` for compatibility with concurrent `useQuery` consumers reading the same query through scope.

Past the gate it re-renders only when a field the component read changes — a component that reads only `data` doesn't re-render while a background refetch runs. Going back to `pending` or failing always re-renders, so the hook can suspend again or throw. Pass `{ notifyOnChangeProps: 'all' }` to re-render on every field. See [Re-renders and tracked results](/effector-tanstack-query/guides/render-tracking/).

See the [Suspense guide](/effector-tanstack-query/guides/suspense/) for details.
