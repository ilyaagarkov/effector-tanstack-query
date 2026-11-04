// #21: the `onMutate` result keeps its type from `createMutation` through
// `useMutation` to the per-call callbacks of `mutateWith`.
import { describe, expectTypeOf, it } from 'vitest'
import { mutationOptions } from '@tanstack/react-query'
import { createMutation } from '@effector-tanstack-query/core'
import { useMutation } from '..'
import type { UseMutationResult } from '..'

type Todo = { id: number; title: string }
type Rollback = { previousTitle: string }

const updateTodo = createMutation({
  name: 'react.onMutate',
  mutationFn: async (variables: { title: string }): Promise<Todo> => ({
    id: 1,
    ...variables,
  }),
  onMutate: (variables) => ({ previousTitle: variables.title }),
})

describe('useMutation — onMutate result', () => {
  it('reaches the per-call callbacks of mutateWith', () => {
    function probe() {
      const { mutateWith } = useMutation(updateTodo)
      mutateWith({
        variables: { title: 'new' },
        onSuccess: (_data, _variables, rollback) => {
          expectTypeOf(rollback).toEqualTypeOf<Rollback | undefined>()
        },
        onError: (_error, _variables, rollback) => {
          expectTypeOf(rollback).toEqualTypeOf<Rollback | undefined>()
        },
        onSettled: (_data, _error, _variables, rollback) => {
          expectTypeOf(rollback).toEqualTypeOf<Rollback | undefined>()
        },
      })
    }
    void probe
  })

  it('keeps the type with a native mutationOptions helper', () => {
    const options = mutationOptions({
      mutationFn: async (id: number) => id,
      onMutate: async (id) => ({ snapshot: [id] }),
    })
    const mutation = createMutation(options)
    function probe() {
      useMutation(mutation).mutateWith({
        variables: 1,
        onError: (_error, _variables, rollback) => {
          expectTypeOf(rollback).toEqualTypeOf<
            { snapshot: number[] } | undefined
          >()
        },
      })
    }
    void probe
  })

  it('keeps data, error and variables', () => {
    function probe() {
      return useMutation(updateTodo)
    }
    expectTypeOf<ReturnType<typeof probe>>().toEqualTypeOf<
      UseMutationResult<Todo, Error, { title: string }, Rollback>
    >()
  })

  it('accepts existing three-generic annotations', () => {
    const plain = createMutation<Todo, Error, number>({
      name: 'react.onMutate.plain',
      mutationFn: async (id) => ({ id, title: '' }),
    })
    function probe(): UseMutationResult<Todo, Error, number> {
      return useMutation(plain)
    }
    void probe
  })
})
