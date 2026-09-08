---
title: createQueryFromOptions
description: Evaluate a standard TanStack Query Options factory from reactive Effector source values.
---

`createQueryFromOptions` connects reactive Effector parameters to a reusable
TanStack [Query Options](https://tanstack.com/query/latest/docs/framework/react/guides/query-options)
factory. The factory receives resolved plain values — never stores — and
remains usable with other TanStack Query consumers.

```ts
import { createStore } from 'effector'
import { queryOptions } from '@tanstack/react-query'
import { createQueryFromOptions } from '@effector-tanstack-query/core'

const todoOptions = ({ todoId }: { todoId: number }) =>
  queryOptions({
    queryKey: ['todo', todoId] as const,
    queryFn: ({ signal }) => fetchTodo(todoId, { signal }),
  })

const $todoId = createStore(1)

const todoQuery = createQueryFromOptions({
  name: 'todo.detail',
  source: { todoId: $todoId },
  queryOptions: todoOptions,
})
```

The same `todoOptions` factory can still be passed to `useQuery`,
`useSuspenseQuery`, `queryClient.prefetchQuery`, or any other TanStack Query
consumer.

## Interface

```ts
function createQueryFromOptions<
  TSource extends QueryOptionsSource,
  TQueryFnData,
  TError = Error,
  TData = TQueryFnData,
>(options: {
  name?: string
  source: TSource
  queryOptions: (
    source: QueryOptionsSourceValue<TSource>
  ) => QueryObserverOptions<
    TQueryFnData,
    TError,
    TData
  >
  enabled?: boolean | Store<boolean>
}): QueryResult<TData, TError>
```

Like [`createQuery`](/effector-tanstack-query/api/create-query/), an explicit
`QueryClient` can be passed as the first argument.

## Source

`source` accepts either one store or a shape of stores:

```ts
createQueryFromOptions({
  name: 'localizedTodo',
  source: {
    todoId: $todoId,
    locale: $locale,
  },
  queryOptions: ({ todoId, locale }) => todoOptions({ todoId, locale }),
})
```

Whenever any source store changes, the factory is evaluated again in the
active Effector scope. Its complete return value is applied through
`QueryObserver.setOptions`, including `queryKey`, `queryFn`, `select`, cache
policies, retry policies, and metadata.

## Consumer-level `enabled`

The optional `enabled` field is a consumer-specific reactive gate. When it is
`false`, it overrides the factory and disables the observer. When it is
`true`, the factory's own `enabled` value is preserved.

```ts
const todoQuery = createQueryFromOptions({
  name: 'todo.detail',
  source: { todoId: $todoId },
  queryOptions: todoOptions,
  enabled: $routeIsReady,
})
```

`prefetch` is a no-op when the resolved `enabled` value is the literal
`false`. All other lifecycle, SSR, fork isolation, and return-value semantics
are the same as [`createQuery`](/effector-tanstack-query/api/create-query/).
