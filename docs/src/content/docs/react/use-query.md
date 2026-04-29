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

- Subscribes to all relevant stores via `useUnit({ data, error, ... })`.
- Calls `query.mounted()` in a `useEffect` on mount.
- Calls `query.unmounted()` in cleanup on unmount.
- Returns a flat object — no extra wrappers.

## Type signature

```ts
function useQuery<TData, TError = Error>(
  query: QueryResult<TData, TError>,
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

For non-React consumers, or when you want full control over the lifecycle:

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
