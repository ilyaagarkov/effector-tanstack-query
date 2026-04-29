---
title: Mutations
description: Triggering side effects, reacting to outcome with sample, per-call callbacks, and offline behavior.
---

A mutation models a single side effect (POST / PUT / DELETE) and exposes the result + state as effector stores.

## Basic usage

```ts
import { createMutation } from '@effector-tanstack-query/core'

const addTodo = createMutation(queryClient, {
  name: 'addTodo',
  mutationFn: (text: string) =>
    fetch('/api/todos', {
      method: 'POST',
      body: JSON.stringify({ text }),
    }).then((r) => r.json()),
  onSuccess: () => queryClient.invalidateQueries({ queryKey: ['todos'] }),
})

addTodo.start()           // subscribe the observer (call once)
addTodo.mutate('Buy milk') // trigger the mutation
```

`addTodo.$status` flows: `'idle'` → `'pending'` → `'success' | 'error'`.

## Reacting to outcome with `sample`

For module-level side effects, use the `finished` events. Payload includes both `params` (the variables passed to `mutate`) and `result` / `error`.

```ts
import { sample } from 'effector'

sample({
  clock: addTodo.finished.success,
  fn: ({ params, result }) => `Added "${params}" → ${result.id}`,
  target: showToast,
})

sample({
  clock: addTodo.finished.failure,
  fn: ({ error }) => error.message,
  target: showError,
})
```

This is the **idiomatic effector pattern** — keeps reactions declarative and out of components.

## Per-call callbacks

When you need a component-local reaction (e.g. navigate after a button click), use `mutateWith` instead of `mutate`:

```ts
addTodo.mutateWith({
  variables: 'Buy groceries',
  onSuccess: (data) => navigate(`/todos/${data.id}`),
  onError: (error) => alert(error.message),
})
```

Per-call callbacks fire **in addition to** observer-level ones (`onSuccess` in `createMutation`'s options) — never instead.

## onMutate context

`onMutate` runs **before** the mutationFn and can return a context that flows to `onSuccess`, `onError`, and `onSettled`:

```ts
const updateUser = createMutation<User, Error, User, { snapshot: User }>(
  queryClient,
  {
    name: 'updateUser',
    mutationFn: putUser,
    onMutate: (newUser) => {
      const snapshot = queryClient.getQueryData(['user', newUser.id]) as User
      queryClient.setQueryData(['user', newUser.id], newUser) // optimistic update
      return { snapshot }
    },
    onError: (_err, _vars, context) => {
      if (context) queryClient.setQueryData(['user', context.snapshot.id], context.snapshot)
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: ['user'] }),
  },
)
```

The 4th generic `TOnMutateResult` types the context throughout.

## Reset

```ts
addTodo.reset() // back to idle, clears $data and $error
```

## Offline behavior

When the network is offline (per `onlineManager.isOnline()`), mutations don't run — they're **paused**. `$status` becomes `'pending'` and `$isPaused` becomes `true`.

```ts
addTodo.$isPaused // Store<boolean>
```

`onMutate` still fires (so optimistic updates work), but `mutationFn` doesn't. Resume with:

```ts
queryClient.getMutationCache().resumePausedMutations()
```

To opt out (e.g. mutate even when offline), set `networkMode: 'always'`. To run once but pause retries, use `'offlineFirst'`.

## Lifecycle: start / unmounted

Symmetric to queries:

- `start()` — subscribe the observer
- `unmounted()` — unsubscribe (lets `gcTime` collect the mutation entry)

The [`useMutation`](/effector-tanstack-query/react/use-mutation/) hook handles both.
