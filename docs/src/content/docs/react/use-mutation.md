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
    reset,
  } = useMutation(addTodo)
}
```

## Behavior

- Calls `addTodo.start()` on mount, `addTodo.unmounted()` on cleanup.
- Subscribes to all state stores.
- Returns bound `mutate(variables)` and `reset()` callbacks.

For per-call callbacks, use the underlying `mutateWith` event:

```tsx
function Component() {
  const mutateWith = useUnit(addTodo.mutateWith)
  return (
    <button
      onClick={() =>
        mutateWith({
          variables: 'todo',
          onSuccess: (data) => navigate(`/todos/${data.id}`),
        })
      }
    >
      Add
    </button>
  )
}
```

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
  reset: () => void
}
```
