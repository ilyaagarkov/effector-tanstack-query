---
title: createMutation
description: Create a mutation bound to a QueryClient with sample-friendly finished events.
---

```ts
import { createMutation } from '@effector-tanstack-query/core'

// Uses the default $queryClient.
function createMutation<
  TData = unknown,
  TError = Error,
  TVariables = void,
  TOnMutateResult = unknown,
>(
  options: CreateMutationOptions<TData, TError, TVariables, TOnMutateResult>,
): MutationResult<TData, TError, TVariables, TOnMutateResult>

// Explicit client.
function createMutation<
  TData = unknown,
  TError = Error,
  TVariables = void,
  TOnMutateResult = unknown,
>(
  queryClient: QueryClient,
  options: CreateMutationOptions<TData, TError, TVariables, TOnMutateResult>,
): MutationResult<TData, TError, TVariables, TOnMutateResult>
```

## Factory form

Pass an existing options factory through `source` and `mutation`:

```ts
import { createMutation, mutationOptions } from '@effector-tanstack-query/core'

// updateTodo.mo.ts — plain values in, ordinary options out, no Effector.
export const updateTodoOptions = ({ todoId }: { todoId: number }) =>
  mutationOptions({
    mutationKey: ['todos', 'update'],
    mutationFn: (patch: { title: string }) => patchTodo(todoId, patch),
    onMutate: async (patch) => ({ previousTitle: patch.title }),
  })

const updateTodo = createMutation({
  name: 'todo.update',
  source: { todoId: $todoId },
  mutation: updateTodoOptions,
})

updateTodo.mutate({ title: 'Buy milk' })

// The explicit-client overload works the same way.
const explicit = createMutation(queryClient, {
  source: { todoId: $todoId },
  mutation: updateTodoOptions,
})
```

`source` accepts a store, a shallow object of stores, or an array/tuple of
stores; `mutation` receives their plain values. `source` holds the context
of the mutation (the todo being edited), while `variables` remain the payload
of each call (the patch). `name` is the only other top-level field. Every
mutation option lives inside the factory, and mixing in inline options is a
type error.

`TData`, `TError`, `TVariables` and the `onMutate` result are inferred from
the returned options. Native helpers such as `mutationOptions` from
`@tanstack/react-query`, our [`mutationOptions`](/effector-tanstack-query/api/query-options/#mutationoptions),
and plain objects are all accepted.

### Lifecycle

The factory must be pure and synchronous; network work belongs in
`mutationFn`. It runs when the scope first reads the options and again on every
source change. The new options go to the observer through
`MutationObserver.setOptions`, just as `useMutation(options(params))`
behaves when a component re-renders:

- **The next call** runs with the options for the current source.
- **A pending call** keeps running its `mutationFn`. TanStack hands it the
  new options, so the option-level `onSuccess` / `onError` / `onSettled`
  that run when it finishes come from the new source. To keep the old values,
  read them from `variables` or from the `onMutate` result.
- **A changed `mutationKey`** resets the observer on TanStack Query 5.14 and
  later. The pending call still finishes in the `MutationCache`, but it no
  longer reaches `$status` / `$data` or `finished`. Earlier 5.x versions
  forward the new options without a reset. Keep the key stable and pass the
  changing parameter through `source`.
- **Concurrent calls** behave as in the inline form: the stores and `finished`
  follow the latest call.

If the factory throws, the next call fails with that error. You get
`$status: 'error'`, `$error`, `finished.failure` and the per-call `onError`,
but the Effector graph never throws, and once the source changes to a value
the factory accepts, the mutation recovers.

### Typing composition

Spread a helper's result into `mutationOptions(...)` to add callbacks with full
types:

```ts
const updateTodo = createMutation({
  source: { todoId: $todoId },
  mutation: (params) =>
    mutationOptions({
      ...updateTodoOptions(params),
      onSuccess: (todo, patch, rollback) => {/* all typed */},
    }),
})
```

A bare returned object works too. When the factory's parameter is annotated,
or the factory takes none, its callbacks are typed from the sibling
`mutationFn` and `onMutate`, as in `useMutation({ … })`:

```ts
createMutation({
  source: $todoId,
  mutation: (todoId: number) => ({
    mutationFn: (patch: Patch) => patchTodo(todoId, patch),
    onSuccess: (todo) => {/* todo: Todo */},
  }),
})
```

Without that annotation, TypeScript can't type such callbacks: their
parameters are `unknown` (never `any`), so using them is a type error until you
annotate them or wrap the object in `mutationOptions`. The mutation's result
types are still inferred.

Explicit generics (`createMutation<Todo, ApiError, Patch>({ source, mutation })`)
are supported, but they leave the source type at its default, as with
`createQuery`. The factory then cannot rely on the source value's type.

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

## Return value (`MutationResult<TData, TError, TVariables, TOnMutateResult>`)

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
| `mutateWith` | `EventCallable<MutateWithParams<…>>` — `{ variables; onSuccess?; onError?; onSettled? }` | Trigger with per-call callbacks; each receives the typed `onMutate` result (or `undefined`) |
| `reset`      | `EventCallable<void>`                              | Reset to idle                            |
| `start`      | `EventCallable<void>`                              | Subscribe observer                       |
| `unmounted`  | `EventCallable<void>`                              | Unsubscribe (allows gcTime cleanup)      |
| `finished`   | `{ success: Event<{ params; result }>; failure: Event<{ params; error }> }` | Sample-friendly outcome events |
| `$observer`  | `Store<MutationObserver \| null>`                  | Per-scope observer (created on `start()`) |
| `$queryClient` | `Store<QueryClient \| null>`                     | Resolved client for this mutation        |

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
