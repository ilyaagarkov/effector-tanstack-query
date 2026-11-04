// #21: the result of `onMutate` keeps its type through `createMutation` to
// the per-call callbacks of `mutateWith`, matching upstream nullability
// (which varies across 5.x — see ./upstream).
import { expectTypeOf } from 'vitest'
import { QueryClient } from '@tanstack/query-core'
import type { MutationObserverOptions } from '@tanstack/query-core'
import { createMutation } from '../index'
import type { MutationResult } from '../index'
import type { CallRollback } from './upstream'

type Todo = { id: number; title: string }
type Rollback = { previousTitle: string }
const client = new QueryClient()

// Synchronous onMutate, default client.
const sync = createMutation({
  name: 'onMutate.sync',
  mutationFn: async (variables: { title: string }): Promise<Todo> => ({
    id: 1,
    ...variables,
  }),
  onMutate: (variables) => ({ previousTitle: variables.title }),
})
expectTypeOf(sync).toEqualTypeOf<
  MutationResult<Todo, Error, { title: string }, Rollback>
>()
sync.mutateWith({
  variables: { title: 'new' },
  onSuccess: (data, variables, rollback) => {
    expectTypeOf(data).toEqualTypeOf<Todo>()
    expectTypeOf(variables).toEqualTypeOf<{ title: string }>()
    expectTypeOf(rollback).toEqualTypeOf<CallRollback<Rollback, 'onSuccess'>>()
  },
  onError: (error, _variables, rollback) => {
    expectTypeOf(error).toEqualTypeOf<Error>()
    expectTypeOf(rollback).toEqualTypeOf<CallRollback<Rollback, 'onError'>>()
  },
  onSettled: (data, error, _variables, rollback) => {
    expectTypeOf(data).toEqualTypeOf<Todo | undefined>()
    expectTypeOf(error).toEqualTypeOf<Error | null>()
    expectTypeOf(rollback).toEqualTypeOf<CallRollback<Rollback, 'onSettled'>>()
  },
})

// Asynchronous onMutate, explicit client: the awaited value is the result.
const async = createMutation(client, {
  name: 'onMutate.async',
  mutationFn: async (id: number) => id,
  onMutate: async () => ({ snapshot: [1, 2] }),
})
async.mutateWith({
  variables: 1,
  onError: (_error, _variables, rollback) => {
    expectTypeOf(rollback).toEqualTypeOf<CallRollback<{ snapshot: number[] }, 'onError'>>()
  },
})

// Options built elsewhere keep the type too.
declare const options: MutationObserverOptions<Todo, Error, number, Rollback>
const fromOptions = createMutation(options)
fromOptions.mutateWith({
  variables: 1,
  onError: (_error, _variables, rollback) => {
    expectTypeOf(rollback).toEqualTypeOf<CallRollback<Rollback, 'onError'>>()
  },
})

// Without onMutate the result stays `unknown`, as upstream.
const plain = createMutation({
  name: 'onMutate.none',
  mutationFn: async (id: number) => id,
})
plain.mutateWith({
  variables: 1,
  onError: (_error, _variables, rollback) => {
    expectTypeOf(rollback).toEqualTypeOf<unknown>()
  },
})

// Existing explicit three-generic calls and annotations still compile.
const explicit = createMutation<Todo, Error, number>({
  name: 'onMutate.explicit',
  mutationFn: async (id) => ({ id, title: '' }),
})
const annotated: MutationResult<Todo, Error, number> = explicit
expectTypeOf(annotated.$data.getState()).toEqualTypeOf<Todo | undefined>()

// Data, error and variables don't widen to make the fix compile.
expectTypeOf(sync.$data.getState()).toEqualTypeOf<Todo | undefined>()
expectTypeOf(sync.$error.getState()).toEqualTypeOf<Error | null>()
expectTypeOf(sync.$variables.getState()).toEqualTypeOf<
  { title: string } | undefined
>()
