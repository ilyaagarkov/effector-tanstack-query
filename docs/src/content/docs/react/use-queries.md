---
title: useQueries
description: Read multiple queries in parallel — static tuple of factories or a createQueries family.
---

Read multiple queries in one hook call. Accepts either:

- a **static tuple** of factories — `useQueries([userQuery, postsQuery] as const)`
- a **family** from [`createQueries`](/effector-tanstack-query/api/create-queries/) — `useQueries(usersFamily)`

The hook picks the right behaviour by inspecting the argument at runtime.

## Static tuple

Use when the set of queries on a page is known at compile time — same shape as `useQuery` but called once for the whole tuple.

```tsx
const [user, posts, settings] = useQueries([
  userQuery,
  postsQuery,
  settingsQuery,
] as const)

if (user.isPending || posts.isPending || settings.isPending) return <Skeleton />
return <Page user={user.data} posts={posts.data} settings={settings.data} />
```

`as const` is recommended — it lets TypeScript preserve per-element types in the result tuple. Each element returns the same shape as `useQuery(factory)`, including a per-element `refresh`.

**Constraint:** the tuple length must be stable between renders. Use a literal array, not `someState.map((x) => ...)`. For dynamic lists, use the family overload.

## Family (createQueries)

```tsx
const $userIds = createStore<number[]>([1, 2, 3])
const usersFamily = createQueries({
  name: 'users.list',
  source: $userIds,
  query: (id) => ({ queryKey: ['user', id], queryFn: () => fetchUser(id) }),
})

function UserList() {
  const items = useQueries(usersFamily)
  return items.map((it, i) =>
    it.isPending ? <Skeleton key={i} /> : <UserCard key={i} user={it.data!} />,
  )
}
```

Returns one `UseQueryResult` per `source` item in source order. Each item's `refresh()` invokes `family.refreshOne(item)` so you don't have to thread the source manually.

The hook handles `family.mounted()` / `unmounted()` via a single `useEffect`. Multiple components consuming the same family share the underlying observers — only the last unmount tears them down.

## When to choose which

- **Tuple**: the queries are different — different `queryFn`, different shape, fixed set. Bundle them in a `[user, posts, settings]` literal.
- **Family**: the queries are uniform — same `queryFn` shape, varying by `item`. List of users by ID, list of products in a basket, etc.

For a deeper walkthrough see [Queries family](/effector-tanstack-query/guides/queries-family/).
