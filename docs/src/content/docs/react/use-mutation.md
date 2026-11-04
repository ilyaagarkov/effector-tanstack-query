---
title: useMutation
description: React hook that subscribes to a createMutation result with auto start/unmount.
---

```ts
import { useMutation } from '@effector-tanstack-query/react'

function Component() {
  const {
    data,
    error,
    status,
    variables,
    isPaused,
    isPending,
    isSuccess,
    isError,
    isIdle,
    mutate,
    mutateWith,
    reset,
  } = useMutation(addTodo)
}
```

## Behavior

- Calls `addTodo.start()` on mount, `addTodo.unmounted()` on cleanup.
- Re-renders only when a field the component read changes — a component that reads only `data` doesn't re-render while the mutation is pending. Pass `{ notifyOnChangeProps: 'all' }` to re-render on every field. See [Re-renders and tracked results](/effector-tanstack-query/guides/render-tracking/).
- Returns bound `mutate(variables)`, `mutateWith(...)`, and `reset()` callbacks.

## Per-call callbacks via `mutateWith`

`mutate` only takes the variables — module-level reactions (cache invalidation, toasts, etc.) belong in a `sample({ clock: addTodo.finished.success, ... })`. When you need a **one-shot component-local** reaction (navigate after a button click, focus a freshly created input), use `mutateWith`:

```tsx
function Component() {
  const { mutateWith, isPending } = useMutation(addTodo)
  return (
    <button
      disabled={isPending}
      onClick={() =>
        mutateWith({
          variables: 'todo',
          onSuccess: (data) => navigate(`/todos/${data.id}`),
          onError: (error) => toast.error(error.message),
        })
      }
    >
      Add
    </button>
  )
}
```

Per-call callbacks fire **in addition to** the observer-level ones set in `createMutation`'s options — never instead.

Each receives the result of the options' `onMutate` as its third argument, typed — e.g. a snapshot for an optimistic-update rollback. It's `undefined` when `onMutate` isn't set or didn't run:

```tsx
const updateTodo = createMutation({
  mutationFn: (todo: Todo) => api.updateTodo(todo),
  onMutate: (todo) => ({ previous: getCachedTodo(todo.id) }),
})

const { mutateWith } = useMutation(updateTodo)
mutateWith({
  variables: todo,
  onError: (_error, _todo, rollback) => {
    if (rollback?.previous) restoreTodo(rollback.previous) // rollback is typed
  },
})
```

## Type signature

```ts
function useMutation<
  TData = unknown,
  TError = Error,
  TVariables = void,
  TOnMutateResult = unknown,
>(
  mutation: MutationResult<TData, TError, TVariables, TOnMutateResult>,
  // notifyOnChangeProps: 'tracked' (default) | 'all' | a list of result fields
  options?: ResultHookOptions<
    UseMutationResult<TData, TError, TVariables, TOnMutateResult>
  >,
): UseMutationResult<TData, TError, TVariables, TOnMutateResult>

interface UseMutationResult<TData, TError, TVariables, TOnMutateResult = unknown> {
  data: TData | undefined
  error: TError | null
  status: 'idle' | 'pending' | 'success' | 'error'
  variables: TVariables | undefined
  isPaused: boolean
  isPending: boolean
  isSuccess: boolean
  isError: boolean
  isIdle: boolean
  mutate: (variables: TVariables) => void
  mutateWith: (args: {
    variables: TVariables
    // onMutateResult: TOnMutateResult | undefined
    onSuccess?: (data, vars, onMutateResult, ctx) => void
    onError?: (error, vars, onMutateResult, ctx) => void
    onSettled?: (data, error, vars, onMutateResult, ctx) => void
  }) => void
  reset: () => void
}
```
