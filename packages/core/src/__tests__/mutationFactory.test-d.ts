// #22: types of createMutation({ source, mutation }) and mutationOptions.
import { expectTypeOf } from 'vitest'
import { createStore } from 'effector'
import type { Store } from 'effector'
import { QueryClient } from '@tanstack/query-core'
import type { MutationObserverOptions } from '@tanstack/query-core'
import { createMutation, mutationOptions } from '../index'
import type { CallRollback, OptionRollback } from './upstream'
import type {
  CreateMutationFactoryOptions,
  CreateMutationOptions,
  MutationResult,
} from '../index'

type Todo = { id: number; title: string }
type Patch = { title: string }
type Rollback = { previousTitle: string }
class ApiError extends Error {
  status = 500
}
const client = new QueryClient()
const $todoId = createStore(1)
const $flag = createStore(true)

const updateTodoOptions = ({ todoId }: { todoId: number }) =>
  mutationOptions({
    mutationKey: ['todo', 'update', todoId],
    mutationFn: async (patch: Patch): Promise<Todo> => ({ id: todoId, ...patch }),
    onMutate: async (patch) => ({ previousTitle: patch.title }),
  })

// The upstream comparison types carry the onMutate result itself; only its
// nullability follows the installed version.
expectTypeOf<NonNullable<CallRollback<Rollback, 'onSuccess'>>>().toEqualTypeOf<Rollback>()
expectTypeOf<NonNullable<CallRollback<Rollback, 'onError'>>>().toEqualTypeOf<Rollback>()
expectTypeOf<NonNullable<OptionRollback<Rollback, 'onSuccess'>>>().toEqualTypeOf<Rollback>()

// --- Inference from a ready-made factory: data, error, variables, rollback.
const fromShape = createMutation({
  name: 'types.shape',
  source: { todoId: $todoId },
  mutation: updateTodoOptions,
})
expectTypeOf(fromShape).toEqualTypeOf<
  MutationResult<Todo, Error, Patch, Rollback>
>()
fromShape.mutateWith({
  variables: { title: 'x' },
  onSuccess: (data, variables, rollback) => {
    expectTypeOf(data).toEqualTypeOf<Todo>()
    expectTypeOf(variables).toEqualTypeOf<Patch>()
    expectTypeOf(rollback).toEqualTypeOf<CallRollback<Rollback, 'onSuccess'>>()
  },
  onError: (error, _variables, rollback) => {
    expectTypeOf(error).toEqualTypeOf<Error>()
    expectTypeOf(rollback).toEqualTypeOf<CallRollback<Rollback, 'onError'>>()
  },
})

// Explicit client overload.
const explicit = createMutation(client, {
  source: { todoId: $todoId },
  mutation: updateTodoOptions,
})
expectTypeOf(explicit).toEqualTypeOf<
  MutationResult<Todo, Error, Patch, Rollback>
>()

// --- Source parameters and variables stay distinct.
createMutation({
  source: { todoId: $todoId, enabled: $flag },
  mutation: (params) => {
    expectTypeOf(params).toEqualTypeOf<{ todoId: number; enabled: boolean }>()
    return updateTodoOptions(params)
  },
})
const fromStore = createMutation({
  source: $todoId,
  mutation: (todoId) => {
    expectTypeOf(todoId).toEqualTypeOf<number>()
    return updateTodoOptions({ todoId })
  },
})
expectTypeOf(fromStore.mutate).toBeCallableWith({ title: 'x' })
expectTypeOf(fromStore.$variables).toEqualTypeOf<Store<Patch | undefined>>()
createMutation({
  source: [$todoId, $flag],
  mutation: (tuple) => {
    expectTypeOf(tuple).toEqualTypeOf<[number, boolean]>()
    return updateTodoOptions({ todoId: tuple[0] })
  },
})

// --- Bare returned objects infer from mutationFn.
const bare = createMutation({
  source: $todoId,
  mutation: (id) => ({
    mutationFn: async (title: string) => ({ id, title }),
  }),
})
expectTypeOf(bare).toEqualTypeOf<
  MutationResult<Todo, Error, string, unknown>
>()

// TypeScript limit: with an unannotated factory parameter, a callback of a
// bare object can't be typed from its siblings. It receives `unknown` (never
// `any`), so using it is a diagnostic. The result type stays precise.
const bareCallback = createMutation({
  source: $todoId,
  mutation: (id) => ({
    mutationFn: async (title: string) => ({ id, title }),
    onSuccess: (data) => {
      expectTypeOf(data).toEqualTypeOf<unknown>()
      // @ts-expect-error data is unknown until annotated
      void data.title
    },
  }),
})
expectTypeOf(bareCallback.$data).toEqualTypeOf<Store<Todo | undefined>>()
// With an annotated (or no) factory parameter, callbacks of a bare object
// are typed from their siblings, as in useMutation({ ... }).
const bareAnnotated = createMutation({
  source: $todoId,
  mutation: (id: number) => ({
    mutationFn: async (title: string) => ({ id, title }),
    onMutate: (title) => {
      expectTypeOf(title).toEqualTypeOf<string>()
      return { previousTitle: title }
    },
    onSuccess: (data, variables, rollback) => {
      expectTypeOf(data).toEqualTypeOf<Todo>()
      expectTypeOf(variables).toEqualTypeOf<string>()
      expectTypeOf(rollback).toEqualTypeOf<OptionRollback<Rollback, 'onSuccess'>>()
    },
    onError: (error, _variables, rollback) => {
      expectTypeOf(error).toEqualTypeOf<Error>()
      expectTypeOf(rollback).toEqualTypeOf<OptionRollback<Rollback, 'onError'>>()
    },
  }),
})
expectTypeOf(bareAnnotated).toEqualTypeOf<
  MutationResult<Todo, Error, string, Rollback>
>()
const bareShape = createMutation({
  source: { todoId: $todoId },
  mutation: ({ todoId }: { todoId: number }) => ({
    mutationFn: async (patch: Patch) => ({ id: todoId, ...patch }),
    onSuccess: (data) => {
      expectTypeOf(data).toEqualTypeOf<Todo>()
    },
  }),
})
expectTypeOf(bareShape.$data).toEqualTypeOf<Store<Todo | undefined>>()
const bareNoParam = createMutation(client, {
  source: $todoId,
  mutation: () => ({
    mutationFn: async (patch: Patch) => patch,
    onSettled: (data, error) => {
      expectTypeOf(data).toEqualTypeOf<Patch | undefined>()
      expectTypeOf(error).toEqualTypeOf<Error | null>()
    },
  }),
})
expectTypeOf(bareNoParam).toEqualTypeOf<
  MutationResult<Patch, Error, Patch, unknown>
>()
// An annotated mismatch with the source is still rejected.
// @ts-expect-error the factory parameter must match the source value
createMutation({ source: $todoId, mutation: (id: string) => ({ mutationFn: async () => id }) })

// Annotated callbacks (or a helper) keep the precise type.
createMutation({
  source: $todoId,
  mutation: (id) => ({
    mutationFn: async (title: string): Promise<Todo> => ({ id, title }),
    onSuccess: (data: Todo) => {
      expectTypeOf(data).toEqualTypeOf<Todo>()
    },
  }),
})
// Composition through the helper keeps the precise type.
const composed = createMutation({
  source: { todoId: $todoId },
  mutation: (params) =>
    mutationOptions({
      ...updateTodoOptions(params),
      onSuccess: (data, variables, rollback) => {
        expectTypeOf(data).toEqualTypeOf<Todo>()
        expectTypeOf(variables).toEqualTypeOf<Patch>()
        expectTypeOf(rollback).toEqualTypeOf<OptionRollback<Rollback, 'onSuccess'>>()
      },
      onError: (_error, _variables, rollback) => {
        expectTypeOf(rollback).toEqualTypeOf<OptionRollback<Rollback, 'onError'>>()
      },
    }),
})
expectTypeOf(composed).toEqualTypeOf<
  MutationResult<Todo, Error, Patch, Rollback>
>()

// --- onSuccess does not transform data (older 5.x also require it to
// return void, so the callback returns nothing here).
const returning = createMutation({
  source: $todoId,
  mutation: (id) =>
    mutationOptions({
      mutationFn: async (): Promise<Todo> => ({ id, title: '' }),
      onSuccess: () => {},
    }),
})
expectTypeOf(returning.$data).toEqualTypeOf<Store<Todo | undefined>>()

// --- void and unknown variables.
const noVariables = createMutation({
  source: $todoId,
  mutation: (id) => mutationOptions({ mutationFn: async () => id }),
})
expectTypeOf(noVariables.mutate).toBeCallableWith()
noVariables.mutate()
const unknownVariables = createMutation({
  source: $todoId,
  mutation: () => mutationOptions({ mutationFn: async (input: unknown) => input }),
})
expectTypeOf(unknownVariables.mutate).parameter(0).toEqualTypeOf<unknown>()

// --- Custom error types.
const customError = createMutation({
  source: $todoId,
  mutation: (id) =>
    mutationOptions<Todo, ApiError, Patch>({
      mutationFn: async (patch) => ({ id, ...patch }),
    }),
})
expectTypeOf(customError.$error).toEqualTypeOf<Store<ApiError | null>>()

// --- Synchronous onMutate.
const syncRollback = createMutation({
  source: $todoId,
  mutation: () =>
    mutationOptions({
      mutationFn: async (patch: Patch) => patch,
      onMutate: (patch) => ({ previousTitle: patch.title }),
    }),
})
expectTypeOf(syncRollback).toEqualTypeOf<
  MutationResult<Patch, Error, Patch, Rollback>
>()

// --- Plain factories typed with core options remain valid inputs.
declare const typedFactory: (
  id: number,
) => MutationObserverOptions<Todo, ApiError, Patch, Rollback>
expectTypeOf(
  createMutation({ source: $todoId, mutation: typedFactory }),
).toEqualTypeOf<MutationResult<Todo, ApiError, Patch, Rollback>>()

// --- Explicit generics with the factory form. As with createQuery, explicit
// generics leave the source at its default, so the factory can't rely on it.
const explicitGenerics = createMutation<Todo, ApiError, Patch>({
  source: $todoId,
  mutation: () => ({ mutationFn: async (patch) => ({ id: 1, ...patch }) }),
})
expectTypeOf(explicitGenerics.mutate).toBeCallableWith({ title: 'x' })
const explicitGenericsClient = createMutation<Todo, ApiError, Patch>(client, {
  source: $todoId,
  mutation: () => ({ mutationFn: async (patch) => ({ id: 1, ...patch }) }),
})
expectTypeOf(explicitGenericsClient.$data).toEqualTypeOf<
  Store<Todo | undefined>
>()
expectTypeOf(explicitGenerics.$error).toEqualTypeOf<Store<ApiError | null>>()

// --- Mixing the forms is rejected, including spreads and variables.
// @ts-expect-error mutation options belong inside the factory
createMutation({ source: $todoId, mutation: (id: number) => updateTodoOptions({ todoId: id }), onSuccess: () => {} })
// @ts-expect-error the factory must return mutation options
createMutation({ source: $todoId, mutation: () => ({ mutationFn: 1 }) })
const retryOverride = { retry: 3 }
// @ts-expect-error mutation options belong inside the factory
createMutation({ source: $todoId, mutation: (id: number) => updateTodoOptions({ todoId: id }), ...retryOverride })
const mixed = {
  source: $todoId,
  mutation: (id: number) => updateTodoOptions({ todoId: id }),
  mutationFn: async () => 1,
}
// @ts-expect-error mutationFn belongs inside the factory
createMutation(mixed)
// @ts-expect-error mutationFn belongs inside the factory
createMutation(client, mixed)
// @ts-expect-error a factory requires a source
createMutation({ mutation: updateTodoOptions })
// @ts-expect-error source must be a store or a shape of stores
createMutation({ source: { todoId: 1 }, mutation: updateTodoOptions })
// @ts-expect-error the factory must match the source value
createMutation({ source: createStore('id'), mutation: updateTodoOptions })
// @ts-expect-error variables of the mutation must match its mutationFn
fromShape.mutate({ name: 'x' })

// --- The inline form and its explicit generics are unchanged.
const inline = createMutation<Todo, Error, number>({
  mutationFn: async (id) => ({ id, title: '' }),
})
expectTypeOf(inline).toEqualTypeOf<MutationResult<Todo, Error, number>>()
const inlineInferred = createMutation(client, {
  mutationFn: async (id: number) => id,
})
expectTypeOf(inlineInferred.$error).toEqualTypeOf<Store<Error | null>>()
expectTypeOf<
  Parameters<typeof createMutation<Todo, Error, number>>
>().toEqualTypeOf<
  [
    arg1: QueryClient | CreateMutationOptions<Todo, Error, number>,
    arg2?: CreateMutationOptions<Todo, Error, number>,
  ]
>()

// --- mutationOptions: identity typing and mutationKey overloads.
const keyed = mutationOptions({
  mutationKey: ['k'],
  mutationFn: async (n: number) => String(n),
})
expectTypeOf(keyed.mutationKey).toEqualTypeOf<readonly unknown[]>()
expectTypeOf(keyed.mutationFn).not.toBeAny()
const unkeyed = mutationOptions({ mutationFn: async (n: number) => n })
// @ts-expect-error mutationKey is not part of the keyless overload
void unkeyed.mutationKey
// The returned options remain valid inline input.
expectTypeOf(createMutation(keyed)).toEqualTypeOf<
  MutationResult<string, Error, number, unknown>
>()

// --- The factory options type is exported.
type Exported = CreateMutationFactoryOptions<
  Store<number>,
  Todo,
  ApiError,
  Patch,
  Rollback
>
expectTypeOf<Exported['source']>().toEqualTypeOf<Store<number>>()
