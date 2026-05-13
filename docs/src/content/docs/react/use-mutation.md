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
- Subscribes to all state stores.
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

## Type signature

```ts
function useMutation<TData = unknown, TError = Error, TVariables = void>(
  mutation: MutationResult<TData, TError, TVariables>,
): UseMutationResult<TData, TError, TVariables>

interface UseMutationResult<TData, TError, TVariables> {
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
    onSuccess?: (data, vars, ctx) => void
    onError?: (error, vars, ctx) => void
    onSettled?: (data, error, vars, ctx) => void
  }) => void
  reset: () => void
}
```
