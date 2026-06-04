---
title: useIsFetching
description: React hook returning the number of queries currently fetching in the scope's QueryClient.
---

```ts
import { useIsFetching } from '@effector-tanstack-query/react'

function GlobalSpinner() {
  const fetching = useIsFetching()
  return fetching > 0 ? <Spinner /> : null
}
```

Returns the number of queries currently **fetching** in the scope's
`QueryClient`. Use it for global indicators — top-bar progress, a tray badge,
a "syncing…" label. Parity with `useIsFetching` from `@tanstack/react-query`.

## Filtering

Pass a `QueryFilters` object to count only matching queries. Filters match by
**value** (not identity), so a fresh object literal each render is fine — no
`useMemo` needed.

```ts
// Only queries whose key starts with ['user']
const userFetching = useIsFetching({ queryKey: ['user'] })
```

`QueryFilters` is re-exported for convenience:

```ts
import type { QueryFilters } from '@effector-tanstack-query/react'
```

## Scope awareness

The client is resolved via `useUnit($queryClient)`, so each `fork` scope counts
its own in-flight queries. When the scope's `$queryClient` changes, the hook
re-subscribes to the new cache automatically.

When no client is set (e.g. a server/RSC pass with no scope client), the hook
returns `0` instead of throwing — the tree renders without a spinner.

## Type signature

```ts
function useIsFetching(filters?: QueryFilters): number
```

The return is always a plain `number`, never `number | undefined`.

## Example — top-bar progress

```tsx
function TopBar() {
  const fetching = useIsFetching()
  const mutating = useIsMutating()
  const busy = fetching + mutating > 0
  return <ProgressBar visible={busy} />
}
```

See also [`useIsMutating`](/effector-tanstack-query/react/use-is-mutating/).
