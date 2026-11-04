// #22: createMutation({ source, mutation }) — reusable mutation options
// factories with reactive parameters. Options follow the source natively:
// they are recomputed on every source change and applied through
// `MutationObserver.setOptions`, like `useMutation(options(params))` on
// re-render in @tanstack/react-query.
import {
  allSettled,
  createEvent,
  createStore,
  createWatch,
  fork,
} from 'effector'
import { QueryClient, onlineManager } from '@tanstack/query-core'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { $queryClient, createMutation, mutationOptions } from '../index'
import { sleep } from './test-utils'

type Todo = { id: number; title: string }

// Mirrors a framework-independent `.mo` definition: plain values in,
// ordinary mutation options out, no Effector inside.
const updateTodoOptions = ({ todoId }: { todoId: number }) =>
  mutationOptions({
    mutationKey: ['todo', 'update'],
    mutationFn: async (patch: { title: string }): Promise<Todo> => ({
      id: todoId,
      ...patch,
    }),
  })

describe('createMutation — factory form', () => {
  let client: QueryClient

  beforeEach(() => {
    client = new QueryClient({ defaultOptions: { mutations: { retry: false } } })
    client.mount()
  })
  afterEach(() => {
    client.unmount()
    client.clear()
  })

  it('passes plain values of a store source to the factory', async () => {
    const $todoId = createStore(7)
    const mutation = createMutation(client, {
      name: 'mutationFactory.store',
      source: $todoId,
      mutation: (todoId) => updateTodoOptions({ todoId }),
    })
    const scope = fork()
    await allSettled(mutation.start, { scope })
    await allSettled(mutation.mutate, { scope, params: { title: 'a' } })
    await sleep(10)
    expect(scope.getState(mutation.$data)).toEqual({ id: 7, title: 'a' })
    expect(scope.getState(mutation.$variables)).toEqual({ title: 'a' })
  })

  it('accepts a ready-made factory with a shape source', async () => {
    const $todoId = createStore(3)
    const mutation = createMutation(client, {
      name: 'mutationFactory.shape',
      source: { todoId: $todoId },
      mutation: updateTodoOptions,
    })
    const scope = fork()
    await allSettled(mutation.start, { scope })
    await allSettled(mutation.mutate, { scope, params: { title: 'b' } })
    await sleep(10)
    expect(scope.getState(mutation.$data)).toEqual({ id: 3, title: 'b' })
  })

  it('accepts a tuple source', async () => {
    const $id = createStore(1)
    const $prefix = createStore('p')
    const mutation = createMutation(client, {
      source: [$id, $prefix],
      mutation: ([id, prefix]) => ({
        mutationFn: async (title: string) => `${prefix}-${id}-${title}`,
      }),
    })
    const scope = fork()
    await allSettled(mutation.start, { scope })
    await allSettled(mutation.mutate, { scope, params: 'x' })
    await sleep(10)
    expect(scope.getState(mutation.$data)).toBe('p-1-x')
  })

  it('uses the scope client without an explicit QueryClient', async () => {
    const mutation = createMutation({
      name: 'mutationFactory.defaultClient',
      source: { todoId: createStore(5) },
      mutation: updateTodoOptions,
    })
    const scope = fork({ values: [[$queryClient, client]] })
    await allSettled(mutation.start, { scope })
    await allSettled(mutation.mutate, { scope, params: { title: 'c' } })
    await sleep(10)
    expect(scope.getState(mutation.$data)).toEqual({ id: 5, title: 'c' })
    expect(client.getMutationCache().getAll()).toHaveLength(1)
  })

  it('applies a source change to the next invocation', async () => {
    const changed = createEvent<number>()
    const $todoId = createStore(1).on(changed, (_, id) => id)
    const onSuccess = vi.fn()
    const mutation = createMutation(client, {
      source: { todoId: $todoId },
      mutation: ({ todoId }) => ({
        ...updateTodoOptions({ todoId }),
        onSuccess: (data: Todo) => onSuccess(todoId, data.id),
      }),
    })
    const scope = fork()
    await allSettled(mutation.start, { scope })
    await allSettled(mutation.mutate, { scope, params: { title: 'a' } })
    await sleep(10)
    await allSettled(changed, { scope, params: 2 })
    await allSettled(mutation.mutate, { scope, params: { title: 'b' } })
    await sleep(10)
    expect(scope.getState(mutation.$data)).toEqual({ id: 2, title: 'b' })
    expect(onSuccess.mock.calls).toEqual([
      [1, 1],
      [2, 2],
    ])
  })

  it('uses the current source when started after the source changed', async () => {
    const changed = createEvent<number>()
    const $todoId = createStore(1).on(changed, (_, id) => id)
    const mutation = createMutation(client, {
      source: { todoId: $todoId },
      mutation: updateTodoOptions,
    })
    const scope = fork()
    await allSettled(changed, { scope, params: 9 })
    await allSettled(mutation.start, { scope })
    await allSettled(mutation.mutate, { scope, params: { title: 'a' } })
    await sleep(10)
    expect(scope.getState(mutation.$data)).toEqual({ id: 9, title: 'a' })
  })

  it('keeps applying source changes after unmount and restart', async () => {
    const changed = createEvent<number>()
    const $todoId = createStore(1).on(changed, (_, id) => id)
    const mutation = createMutation(client, {
      source: { todoId: $todoId },
      mutation: updateTodoOptions,
    })
    const scope = fork()
    await allSettled(mutation.start, { scope })
    await allSettled(mutation.unmounted, { scope })
    await allSettled(changed, { scope, params: 4 })
    await allSettled(mutation.start, { scope })
    await allSettled(mutation.mutate, { scope, params: { title: 'r' } })
    await sleep(10)
    expect(scope.getState(mutation.$data)).toEqual({ id: 4, title: 'r' })
  })

  // Native semantics, pinned: a pending mutation receives the options of
  // the new source (TanStack's MutationObserver.setOptions forwards them to
  // the pending Mutation). The running mutationFn call keeps its closure.
  it('in-flight: option callbacks follow a source change with a stable key', async () => {
    const changed = createEvent<number>()
    const $todoId = createStore(1).on(changed, (_, id) => id)
    const onSuccess = vi.fn()
    const success = vi.fn()
    const mutation = createMutation(client, {
      source: { todoId: $todoId },
      mutation: ({ todoId }) => ({
        mutationKey: ['todo', 'update'],
        mutationFn: (title: string) => sleep(20).then(() => `${todoId}:${title}`),
        onSuccess: () => onSuccess(todoId),
      }),
    })
    const scope = fork()
    const unwatch = createWatch({
      unit: mutation.finished.success,
      scope,
      fn: success,
    })
    await allSettled(mutation.start, { scope })
    await allSettled(mutation.mutate, { scope, params: 'a' })
    await sleep(5)
    await allSettled(changed, { scope, params: 2 })
    await sleep(30)
    expect(scope.getState(mutation.$data)).toBe('1:a')
    expect(onSuccess.mock.calls).toEqual([[2]])
    expect(success).toHaveBeenCalledWith({ params: 'a', result: '1:a' })
    unwatch()
  })

  // Native semantics, pinned: a new mutationKey resets the observer, so the
  // pending mutation completes in the cache but no longer reaches the stores.
  // TanStack added the reset in query-core 5.14.0; earlier 5.x versions only
  // forward the options (this project tests against the lockfile version).
  it('in-flight: a mutationKey change resets the observer', async () => {
    const changed = createEvent<number>()
    const $todoId = createStore(1).on(changed, (_, id) => id)
    const success = vi.fn()
    const mutation = createMutation(client, {
      source: { todoId: $todoId },
      mutation: ({ todoId }) => ({
        mutationKey: ['todo', todoId],
        mutationFn: (title: string) => sleep(20).then(() => title),
      }),
    })
    const scope = fork()
    const unwatch = createWatch({
      unit: mutation.finished.success,
      scope,
      fn: success,
    })
    await allSettled(mutation.start, { scope })
    await allSettled(mutation.mutate, { scope, params: 'a' })
    await sleep(5)
    expect(scope.getState(mutation.$status)).toBe('pending')
    await allSettled(changed, { scope, params: 2 })
    expect(scope.getState(mutation.$status)).toBe('idle')
    await sleep(30)
    expect(success).not.toHaveBeenCalled()
    expect(client.getMutationCache().getAll()[0]!.state.status).toBe('success')
    unwatch()
  })

  // As with the inline form: the observer tracks only its latest mutation.
  it('concurrent invocations: stores and finished follow the latest call', async () => {
    const calls: string[] = []
    const success = vi.fn()
    const mutation = createMutation(client, {
      source: createStore(1),
      mutation: (id) => ({
        mutationFn: (title: string) => {
          calls.push(title)
          return sleep(title === 'slow' ? 30 : 5).then(() => `${id}:${title}`)
        },
      }),
    })
    const scope = fork()
    const unwatch = createWatch({
      unit: mutation.finished.success,
      scope,
      fn: success,
    })
    await allSettled(mutation.start, { scope })
    await allSettled(mutation.mutate, { scope, params: 'slow' })
    await allSettled(mutation.mutate, { scope, params: 'fast' })
    await sleep(40)
    expect(calls).toEqual(['slow', 'fast'])
    expect(scope.getState(mutation.$data)).toBe('1:fast')
    expect(success).toHaveBeenCalledTimes(1)
    expect(success).toHaveBeenCalledWith({ params: 'fast', result: '1:fast' })
    unwatch()
  })

  it('isolates source values and events per fork scope', async () => {
    const $todoId = createStore(0)
    const mutation = createMutation(client, {
      source: { todoId: $todoId },
      mutation: updateTodoOptions,
    })
    const first = fork({ values: [[$todoId, 1]] })
    const second = fork({ values: [[$todoId, 2]] })
    const firstSuccess = vi.fn()
    const secondSuccess = vi.fn()
    const u1 = createWatch({
      unit: mutation.finished.success,
      scope: first,
      fn: firstSuccess,
    })
    const u2 = createWatch({
      unit: mutation.finished.success,
      scope: second,
      fn: secondSuccess,
    })
    await allSettled(mutation.start, { scope: first })
    await allSettled(mutation.start, { scope: second })
    await allSettled(mutation.mutate, { scope: first, params: { title: 'f' } })
    await sleep(10)
    expect(first.getState(mutation.$data)).toEqual({ id: 1, title: 'f' })
    expect(second.getState(mutation.$data)).toBeUndefined()
    expect(firstSuccess).toHaveBeenCalledTimes(1)
    expect(secondSuccess).not.toHaveBeenCalled()

    await allSettled(mutation.mutate, { scope: second, params: { title: 's' } })
    await sleep(10)
    expect(second.getState(mutation.$data)).toEqual({ id: 2, title: 's' })
    expect(first.getState(mutation.$data)).toEqual({ id: 1, title: 'f' })
    expect(secondSuccess).toHaveBeenCalledTimes(1)
    u1()
    u2()
  })

  it('reports a factory exception as the mutation error and recovers', async () => {
    const changed = createEvent<number>()
    const $todoId = createStore(-1).on(changed, (_, id) => id)
    const invalid = new Error('invalid todo')
    const failure = vi.fn()
    const onError = vi.fn()
    const mutation = createMutation(client, {
      source: { todoId: $todoId },
      mutation: ({ todoId }) => {
        if (todoId < 0) throw invalid
        return updateTodoOptions({ todoId })
      },
    })
    const scope = fork()
    const unwatch = createWatch({
      unit: mutation.finished.failure,
      scope,
      fn: failure,
    })
    await allSettled(mutation.start, { scope })
    await allSettled(mutation.mutateWith, {
      scope,
      params: { variables: { title: 'a' }, onError },
    })
    await sleep(10)
    expect(scope.getState(mutation.$status)).toBe('error')
    expect(scope.getState(mutation.$error)).toBe(invalid)
    expect(failure).toHaveBeenCalledWith({
      params: { title: 'a' },
      error: invalid,
    })
    expect(onError.mock.calls[0]![0]).toBe(invalid)

    await allSettled(changed, { scope, params: 1 })
    await allSettled(mutation.mutate, { scope, params: { title: 'b' } })
    await sleep(10)
    expect(scope.getState(mutation.$status)).toBe('success')
    expect(scope.getState(mutation.$data)).toEqual({ id: 1, title: 'b' })
    unwatch()
  })

  it('does not throw from the graph when the factory fails before start', async () => {
    const mutation = createMutation(client, {
      source: createStore(0),
      mutation: (): { mutationFn: () => Promise<number> } => {
        throw new Error('broken')
      },
    })
    const scope = fork()
    await allSettled(mutation.start, { scope })
    expect(scope.getState(mutation.$observer)).not.toBeNull()
    expect(scope.getState(mutation.$status)).toBe('idle')
  })

  it('fires option-level and per-call callbacks together', async () => {
    const optionSuccess = vi.fn()
    const callSuccess = vi.fn()
    const mutation = createMutation(client, {
      source: { todoId: createStore(1) },
      mutation: ({ todoId }) => ({
        ...updateTodoOptions({ todoId }),
        onMutate: () => ({ previous: todoId }),
        onSuccess: optionSuccess,
      }),
    })
    const scope = fork()
    await allSettled(mutation.start, { scope })
    await allSettled(mutation.mutateWith, {
      scope,
      params: { variables: { title: 'a' }, onSuccess: callSuccess },
    })
    await sleep(10)
    expect(optionSuccess).toHaveBeenCalledTimes(1)
    expect(callSuccess).toHaveBeenCalledTimes(1)
    expect(callSuccess.mock.calls[0]!.slice(0, 3)).toEqual([
      { id: 1, title: 'a' },
      { title: 'a' },
      { previous: 1 },
    ])
  })

  it('merges mutation defaults registered for the factory key', async () => {
    client.setMutationDefaults(['todo', 'defaults'], {
      mutationFn: async (title: string) => `default:${title}`,
    })
    const mutation = createMutation(client, {
      source: createStore(1),
      mutation: () => ({ mutationKey: ['todo', 'defaults'] }),
    })
    const scope = fork()
    await allSettled(mutation.start, { scope })
    await allSettled(mutation.mutate, { scope, params: 'x' as never })
    await sleep(10)
    expect(scope.getState(mutation.$data)).toBe('default:x')
  })

  it('retries according to the factory options', async () => {
    let attempts = 0
    const mutation = createMutation(client, {
      source: createStore(1),
      mutation: () => ({
        retry: 1,
        retryDelay: 0,
        mutationFn: async () => {
          attempts++
          if (attempts === 1) throw new Error('flaky')
          return 'ok'
        },
      }),
    })
    const scope = fork()
    await allSettled(mutation.start, { scope })
    await allSettled(mutation.mutate, { scope })
    await sleep(20)
    expect(attempts).toBe(2)
    expect(scope.getState(mutation.$data)).toBe('ok')
  })

  it('pauses offline and honors networkMode from the factory', async () => {
    const online = vi.spyOn(onlineManager, 'isOnline').mockReturnValue(false)
    const changed = createEvent<'online' | 'always'>()
    const $mode = createStore<'online' | 'always'>('online').on(
      changed,
      (_, mode) => mode,
    )
    const mutation = createMutation(client, {
      source: $mode,
      mutation: (networkMode) => ({
        networkMode,
        mutationFn: async () => networkMode,
      }),
    })
    const scope = fork()
    await allSettled(mutation.start, { scope })
    await allSettled(mutation.mutate, { scope })
    await sleep(10)
    expect(scope.getState(mutation.$isPaused)).toBe(true)
    expect(scope.getState(mutation.$status)).toBe('pending')

    await allSettled(mutation.reset, { scope })
    await allSettled(changed, { scope, params: 'always' })
    await allSettled(mutation.mutate, { scope })
    await sleep(10)
    expect(scope.getState(mutation.$isPaused)).toBe(false)
    expect(scope.getState(mutation.$data)).toBe('always')
    online.mockRestore()
  })

  it('serializes state through the name-derived sids', async () => {
    const mutation = createMutation(client, {
      name: 'mutationFactory.sid',
      source: { todoId: createStore(1) },
      mutation: updateTodoOptions,
    })
    const scope = fork()
    await allSettled(mutation.start, { scope })
    await allSettled(mutation.mutate, { scope, params: { title: 's' } })
    await sleep(10)
    const { serialize } = await import('effector')
    expect(Object.values(serialize(scope))).toContainEqual({
      id: 1,
      title: 's',
    })
  })
})

describe('createMutation — inline form is unchanged', () => {
  it('does not re-create or re-apply options for inline mutations', async () => {
    const client = new QueryClient()
    const mutation = createMutation(client, {
      mutationFn: async (n: number) => n * 2,
    })
    const scope = fork()
    await allSettled(mutation.start, { scope })
    const observer = scope.getState(mutation.$observer)!
    const setOptions = vi.spyOn(observer, 'setOptions')
    await allSettled(mutation.mutate, { scope, params: 2 })
    await sleep(10)
    expect(scope.getState(mutation.$data)).toBe(4)
    expect(setOptions).not.toHaveBeenCalled()
    client.clear()
  })
})

describe('mutationOptions', () => {
  it('returns the options object unchanged', () => {
    const options = { mutationKey: ['k'], mutationFn: async () => 1 }
    expect(mutationOptions(options)).toBe(options)
  })
})
