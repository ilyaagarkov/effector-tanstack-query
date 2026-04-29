---
title: Naming & SIDs
description: Why every createQuery / createMutation / createInfiniteQuery should be given a unique name.
---

## TL;DR

Always pass `name`. It's the only way SSR via `serialize(scope)` / `fork({ values })` works for this library.

## What is a SID?

In effector, each store has an internal **SID** (stable ID) used by `serialize(scope)` to know which value belongs to which store on the client. Without a SID, `serialize` silently skips the store — the value never makes it to the client.

In application code, SIDs are usually injected automatically by `effector/babel-plugin` or `@effector/swc-plugin`. But these plugins **don't run on `node_modules`**, so any third-party library has to assign SIDs manually.

## How `name` is used

When you pass `name`, this library assigns SIDs and human-readable names to every internal store using a deterministic prefix:

```ts
createQuery(queryClient, {
  name: 'userQuery',
  queryKey: ['user'],
  queryFn: fetchUser,
})

// Internally:
// $data:     sid = '@tanstack/query-effector.userQuery.$data'
// $status:   sid = '@tanstack/query-effector.userQuery.$status'
// $error:    sid = '@tanstack/query-effector.userQuery.$error'
// ... etc.
```

Same `name` = same SID across server and client builds, so `serialize(scope)` produces a payload that `fork({ values })` can rehydrate.

## What if I don't pass a name?

A development-mode warning fires once per role (createQuery / createMutation / createInfiniteQuery):

```
[@tanstack/query-effector] createQuery created without a "name" — internal stores
will be excluded from serialize(scope). Pass a unique "name" to enable SSR via
fork({ values: serialize(scope) }).
```

Behavior without `name`:

- ✅ Everything still works at runtime — all stores update, all observers fire.
- ✅ SSR via `dehydrate(queryClient)` + `hydrate(queryClient, ...)` still works.
- ❌ But `serialize(scope)` returns `{}` for the library's stores; the client scope starts empty.

## Picking good names

- Be unique within an app — duplicate names will collide on the same SID.
- Use namespacing if you build a feature-scoped factory: `'user.profile'`, `'user.settings'`.
- Names should be stable across builds (don't generate them randomly or based on counters).

## Example

```ts
// Good — explicit, stable names
const userQuery = createQuery(qc, { name: 'user', queryKey: ['user'], queryFn })
const settingsQuery = createQuery(qc, { name: 'settings', queryKey: ['settings'], queryFn })
const addTodo = createMutation(qc, { name: 'addTodo', mutationFn })

// Avoid — would collide if reused
const a = createQuery(qc, { name: 'q', queryKey: ['x'], queryFn })
const b = createQuery(qc, { name: 'q', queryKey: ['y'], queryFn }) // ⚠️ same SID prefix
```
