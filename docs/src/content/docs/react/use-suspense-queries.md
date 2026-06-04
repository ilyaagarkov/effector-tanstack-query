---
title: useSuspenseQueries
description: Suspense variant of useQueries. Same two overloads, throws while any query is pending.
---

Suspense version of [`useQueries`](/effector-tanstack-query/react/use-queries/). Same two inputs:

- a **static tuple** of factories — `useSuspenseQueries([userQuery, postsQuery] as const)`
- a **family** from [`createQueries`](/effector-tanstack-query/api/create-queries/) — `useSuspenseQueries(usersFamily)`

While **any** query is pending, the hook throws an aggregated `Promise.all(...)` of every pending inflight — `<Suspense>` waits until they all settle, then re-renders. The first errored query throws its error past the gate to the nearest `<ErrorBoundary>`. On success, every result entry has `data` narrowed to non-nullable `TData`.

## Static tuple

```tsx
function Page() {
  const [user, posts] = useSuspenseQueries([userQuery, postsQuery] as const)
  // user.data: User    (non-nullable)
  // posts.data: Post[] (non-nullable)
  return <Layout user={user.data} posts={posts.data} />
}

<ErrorBoundary fallback={...}>
  <Suspense fallback={<Loading />}>
    <Page />
  </Suspense>
</ErrorBoundary>
```

## Family (createQueries)

```tsx
const $ids = createStore<number[]>([1, 2, 3])
const usersFamily = createQueries({
  name: 'users.list',
  source: $ids,
  query: (id) => ({ queryKey: ['user', id], queryFn: () => fetchUser(id) }),
})

function UserList() {
  const items = useSuspenseQueries(usersFamily)
  // each items[i].data is User (non-nullable past the Suspense gate)
  return items.map((it) => <UserCard key={it.data.id} user={it.data} />)
}
```

## SSR

The hook reads from effector stores when no observer can be materialised (the RSC server pass: `$observer` and `$queryClient` are `serialize: 'ignore'`). If `prefetchQueries(...)` populated the source items beforehand, the server pass renders with data — no Suspense fallback in the SSR HTML.

For full SSR setup see the [Suspense guide](/effector-tanstack-query/guides/suspense/) — the "SSR store fallback" section applies to `useSuspenseQueries` the same way.

## Error message

If **any** query lands in `pending` status with no observer and no `QueryClient` in scope (genuine misconfiguration — no `setQueryClient` AND no prefetch), the hook throws:

> `useSuspenseQueries: no QueryClient is set. Call setQueryClient(qc) or pass it to fork({ values: [[$queryClient, qc]] }).`
