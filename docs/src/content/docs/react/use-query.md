---
title: useQuery
description: React hook that subscribes to a createQuery result with auto mount/unmount.
---

```ts
import { useQuery } from '@effector-tanstack-query/react'

function Component() {
  const {
    data,
    error,
    status,
    isPending,
    isFetching,
    isSuccess,
    isError,
    isPlaceholderData,
    fetchStatus,
    refresh,
  } = useQuery(query)
}
```

## Behavior

- Re-renders only when a field the component read changes — a background refetch doesn't re-render a component that reads only `data`. Pass `{ notifyOnChangeProps: 'all' }` to re-render on every field. See [Re-renders and tracked results](/effector-tanstack-query/guides/render-tracking/).
- Calls `query.mounted()` in a `useEffect` on mount.
- Calls `query.unmounted()` in cleanup on unmount.
- Returns a flat object — no extra wrappers.

## Type signature

```ts
function useQuery<TData, TError = Error>(
  query: QueryResult<TData, TError>,
  options?: { notifyOnChangeProps?: 'tracked' | 'all' | Array<field> }, // default: 'tracked'
): UseQueryResult<TData, TError>

interface UseQueryResult<TData, TError> {
  data: TData | undefined
  error: TError | null
  status: 'pending' | 'success' | 'error'
  isPending: boolean
  isFetching: boolean
  isSuccess: boolean
  isError: boolean
  isPlaceholderData: boolean
  fetchStatus: 'fetching' | 'paused' | 'idle'
  refresh: () => void
}
```

## When to use the low-level pattern instead

When you want full control over the lifecycle, use the stores directly:

```tsx
import { useUnit } from 'effector-react'

function Component() {
  const { data, isPending } = useUnit({
    data: query.$data,
    isPending: query.$isPending,
  })
  const mounted = useUnit(query.mounted)
  const unmounted = useUnit(query.unmounted)
  React.useEffect(() => {
    mounted()
    return () => unmounted()
  }, [])
  // ...
}
```
