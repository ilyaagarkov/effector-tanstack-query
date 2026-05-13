# @effector-tanstack-query/core

Core package: [TanStack Query](https://tanstack.com/query) state and
operations exposed as effector units.

- Every observer field (`data`, `status`, `isPending`, …) becomes a `Store<T>`
- Every imperative action (`refetch`, `fetchNextPage`, `mutate`, `reset`, …) is an `EventCallable`
- A `Store` placed inside `queryKey` triggers automatic refetch on change
- SSR works via `dehydrate`/`hydrate` for the cache **and** `serialize(scope)`/`fork({ values })` for the effector graph

```bash
npm install @effector-tanstack-query/core @tanstack/query-core effector
```

```ts
import { QueryClient } from '@tanstack/query-core'
import { setQueryClient, createQuery } from '@effector-tanstack-query/core'

const queryClient = new QueryClient()
queryClient.mount()
setQueryClient(queryClient)

const userQuery = createQuery({
  name: 'user',
  queryKey: ['user', 1],
  queryFn: () => fetch('/api/users/1').then((r) => r.json()),
})

userQuery.mounted()
```

For React hooks see [`@effector-tanstack-query/react`](https://www.npmjs.com/package/@effector-tanstack-query/react).

**Full documentation:** https://ilyaagarkov.github.io/effector-tanstack-query/

**Source & examples:** https://github.com/ilyaagarkov/effector-tanstack-query

## License

MIT
