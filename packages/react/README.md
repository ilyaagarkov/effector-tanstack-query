# @effector-tanstack-query/react

React hooks for [`@effector-tanstack-query/core`](https://www.npmjs.com/package/@effector-tanstack-query/core) — subscribe a component to a query/mutation with auto mount/unmount lifecycle.

- `useQuery(query)` — subscribes to query stores, returns `{ data, error, isFetching, refresh, … }`
- `useMutation(mutation)` — returns `{ data, mutate, mutateWith, reset, … }`
- `useInfiniteQuery(query)` — paginated variant
- `useSuspenseQuery(query)` / `useSuspenseInfiniteQuery(query)` — Suspense-friendly with non-nullable `data`
- `<HydrationBoundary state={...}>` — merges a server-prefetched `DehydratedState` into the scope's `QueryClient` (SSR companion to `EffectorNext` / `fork({ values })`)

```bash
npm install @effector-tanstack-query/core @effector-tanstack-query/react \
  @tanstack/query-core effector effector-react
```

```tsx
import { useQuery } from '@effector-tanstack-query/react'

function UserProfile() {
  const { data, isPending, error, refresh } = useQuery(userQuery)
  if (isPending) return <p>Loading…</p>
  if (error) return <p>Error: {error.message}</p>
  return (
    <div>
      <h1>{data.name}</h1>
      <button onClick={refresh}>refresh</button>
    </div>
  )
}
```

**Full documentation:** https://ilyaagarkov.github.io/effector-tanstack-query/

**Source & examples:** https://github.com/ilyaagarkov/effector-tanstack-query

## License

MIT
