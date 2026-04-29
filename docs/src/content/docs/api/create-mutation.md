---
title: createMutation
description: Create a mutation bound to a QueryClient with sample-friendly finished events.
---

```ts
import { createMutation } from '@effector-tanstack-query/core'

function createMutation<
  TData = unknown,
  TError = Error,
  TVariables = void,
  TOnMutateResult = unknown,
>(
  queryClient: QueryClient,
  options: CreateMutationOptions<TData, TError, TVariables, TOnMutateResult>,
): MutationResult<TData, TError, TVariables>
```

## Options

`CreateMutationOptions` extends `MutationObserverOptions` from `@tanstack/query-core`:

| Field           | Type                                          | Notes                                  |
| --------------- | --------------------------------------------- | -------------------------------------- |
| `mutationFn`    | `(vars: TVariables) => Promise<TData>`        | Required (or via `setMutationDefaults`) |
| `mutationKey`   | `unknown[]`                                   | For `setMutationDefaults` lookups      |
| `onMutate`      | `(vars) => TOnMutateResult \| Promise<…>`     | Runs before mutationFn; returns context |
| `onSuccess`     | `(data, vars, context, ctx)`                  | Observer-level; per-call via `mutateWith` |
| `onError`       | `(error, vars, context, ctx)`                 | Observer-level                         |
| `onSettled`     | `(data, error, vars, context, ctx)`           | Observer-level                         |
| `retry`         | `boolean \| number \| RetryFn`                | Same as TanStack Query                 |
| `networkMode`   | `'online' \| 'always' \| 'offlineFirst'`      | Same as TanStack Query                 |
| `meta`          | `Record<string, unknown>`                     | Forwarded to `MutationCache` callbacks |
| `name`          | `string` (recommended)                        | Stable name for SID-based SSR          |

## Return value (`MutationResult<TData, TError, TVariables>`)

| Field        | Type                                               | Description                              |
| ------------ | -------------------------------------------------- | ---------------------------------------- |
| `$data`      | `Store<TData \| undefined>`                        | Mutation result                          |
| `$error`     | `Store<TError \| null>`                            | Last error                               |
| `$status`    | `Store<'idle' \| 'pending' \| 'success' \| 'error'>` | Mutation status                        |
| `$variables` | `Store<TVariables \| undefined>`                   | Last `mutate` args                       |
| `$isPaused`  | `Store<boolean>`                                   | Paused (e.g. offline)                    |
| `$isPending` | `Store<boolean>`                                   | Mutation running                         |
| `$isSuccess` | `Store<boolean>`                                   | Succeeded                                |
| `$isError`   | `Store<boolean>`                                   | Failed                                   |
| `$isIdle`    | `Store<boolean>`                                   | Not triggered                            |
| `mutate`     | `EventCallable<TVariables>`                        | Trigger mutation                         |
| `mutateWith` | `EventCallable<{ variables; onSuccess?; onError?; onSettled? }>` | Trigger with per-call callbacks |
| `reset`      | `EventCallable<void>`                              | Reset to idle                            |
| `start`      | `EventCallable<void>`                              | Subscribe observer                       |
| `unmounted`  | `EventCallable<void>`                              | Unsubscribe (allows gcTime cleanup)      |
| `finished`   | `{ success: Event<{ params; result }>; failure: Event<{ params; error }> }` | Sample-friendly outcome events |

## `finished` events

Fire **once per terminal transition** (`pending → success/error`). Do not fire on `reset()`.

```ts
sample({
  clock: addTodo.finished.success,
  fn: ({ params, result }) => result.id,
  target: focusNewlyCreatedItem,
})
```

## Lifecycle

`start()` subscribes the observer. `unmounted()` unsubscribes — required for `gcTime` to release the mutation entry from the `MutationCache`. The [`useMutation`](/effector-tanstack-query/react/use-mutation/) hook handles both.
