---
title: QueryClient
description: Register a default QueryClient or inject one per-scope for SSR.
---

Every query and mutation is bound to a [`QueryClient`](https://tanstack.com/query/latest/docs/reference/QueryClient). This library exposes the client as an effector store — `$queryClient` — so factories can pull from it automatically and you can swap it per scope under SSR.

## Set a default client

For most client-side apps, register the client once at startup with `setQueryClient`:

```ts
import { QueryClient } from '@tanstack/query-core'
import { setQueryClient } from '@effector-tanstack-query/core'

const queryClient = new QueryClient()
queryClient.mount() // enables refetchOnWindowFocus / refetchOnReconnect
setQueryClient(queryClient)
```

After this, factories no longer need a client argument:

```ts
import { createQuery, createMutation } from '@effector-tanstack-query/core'

const userQuery = createQuery({
  name: 'user',
  queryKey: ['user'],
  queryFn: fetchUser,
})

const addTodo = createMutation({
  name: 'addTodo',
  mutationFn: postTodo,
})
```

## Per-scope client (SSR, tests)

Under `fork({ values: [[$queryClient, qc]] })` every scope gets its own client → its own per-scope `Observer`. Observers are created lazily on `mounted()` / `start()`, so the client is resolved from the scope at that moment.

```ts
import { fork, allSettled } from 'effector'
import { $queryClient } from '@effector-tanstack-query/core'

const queryClient = new QueryClient()
const scope = fork({ values: [[$queryClient, queryClient]] })

await allSettled(userQuery.mounted, { scope })
// userQuery.$observer in this scope is bound to `queryClient`.
```

Mixing serialized state with `$queryClient` injection (typical client hydration):

```ts
import { setQueryClient } from '@effector-tanstack-query/core'

const scope = fork({ values: serializedScope })
await allSettled(setQueryClient, { scope, params: queryClient })
```

`allSettled(setQueryClient, { scope, params: qc })` fires the event inside the scope only, updating `$queryClient` for that scope.

## Explicit client per factory

If you want a factory locked to a specific client regardless of any scope override, pass it as the first argument:

```ts
const userQuery = createQuery(otherClient, {
  name: 'user',
  queryKey: ['user'],
  queryFn: fetchUser,
})
// `userQuery` always uses `otherClient` — fork({ values: [[$queryClient, ...]] })
// has no effect on this factory.
```

Use this when you have multiple long-lived clients (e.g. one per microservice) and don't want them mixed up by accident.

## What happens without a client

Mounting a query without any client set throws:

```
[@tanstack/query-effector] No QueryClient is set. Call setQueryClient(qc)
before mounting, pass it to fork({ values: [[$queryClient, qc]] }), or pass
it explicitly to the factory.
```

The error fires inside `mountFx`, so `query.$observer` stays `null` and the rest of the application keeps working.

## API

- `$queryClient: Store<QueryClient | null>` — the global default. `null` until set.
- `setQueryClient: EventCallable<QueryClient>` — set the global default; also usable per-scope via `allSettled(setQueryClient, { scope, params })`.

Both are exported from `@effector-tanstack-query/core`.
