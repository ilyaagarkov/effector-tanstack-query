---
title: useIsMutating
description: React hook returning the number of mutations currently running in the scope's QueryClient.
---

```ts
import { useIsMutating } from '@effector-tanstack-query/react'

function SaveIndicator() {
  const mutating = useIsMutating()
  return mutating > 0 ? <span>Saving…</span> : null
}
```

Returns the number of mutations currently **running** in the scope's
`QueryClient`. Mirrors [`useIsFetching`](/effector-tanstack-query/react/use-is-fetching/)
for mutations, and matches `useIsMutating` from `@tanstack/react-query`.

## Filtering

Pass a `MutationFilters` object to count only matching mutations. Filters match
by **value**, so a fresh object literal each render is fine.

```ts
// Only mutations registered with mutationKey ['createUser']
const creating = useIsMutating({ mutationKey: ['createUser'] })
```

`MutationFilters` is re-exported for convenience:

```ts
import type { MutationFilters } from '@effector-tanstack-query/react'
```

## Scope awareness

The client is resolved via `useUnit($queryClient)`, so each `fork` scope counts
its own running mutations and re-subscribes when the scope's `$queryClient`
changes. With no client set, the hook returns `0` rather than throwing.

## Type signature

```ts
function useIsMutating(filters?: MutationFilters): number
```

The return is always a plain `number`, never `number | undefined`.

See also [`useIsFetching`](/effector-tanstack-query/react/use-is-fetching/).
