import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { act, render } from '@testing-library/react'
import * as React from 'react'
import { Provider, useUnit } from 'effector-react'
import { allSettled, fork } from 'effector'
import { MutationCache, QueryClient } from '@tanstack/query-core'
import { sleep } from './test-utils'
import { createMutation } from '@effector-tanstack-query/core'
import type { Scope } from 'effector'

function renderWithScope(scope: Scope, ui: React.ReactElement) {
  const result = render(<Provider value={scope}>{ui}</Provider>)
  return {
    ...result,
    rerender: (rerenderUi: React.ReactElement) =>
      result.rerender(<Provider value={scope}>{rerenderUi}</Provider>),
  }
}

describe('createMutation (React integration)', () => {
  let queryClient: QueryClient

  beforeEach(() => {
    vi.useFakeTimers()
    queryClient = new QueryClient({
      defaultOptions: { mutations: { retry: false } },
    })
    queryClient.mount()
  })

  afterEach(() => {
    queryClient.clear()
    vi.useRealTimers()
  })

  it('should start in idle state', async () => {
    const scope = fork()

    const mutation = createMutation(queryClient, {
      mutationFn: () => Promise.resolve('data'),
    })

    function Page() {
      const { status, isIdle } = useUnit({
        status: mutation.$status,
        isIdle: mutation.$isIdle,
      })
      return (
        <span>
          {status}, idle: {String(isIdle)}
        </span>
      )
    }

    const rendered = renderWithScope(scope, <Page />)
    await allSettled(mutation.start, { scope })

    rendered.getByText('idle, idle: true')
  })

  it('should transition to success state after mutate', async () => {
    const scope = fork()

    const mutation = createMutation(queryClient, {
      mutationFn: (text: string) => sleep(10).then(() => text.toUpperCase()),
    })

    function Page() {
      const { data, status } = useUnit({
        data: mutation.$data,
        status: mutation.$status,
      })
      return (
        <span>
          {status}: {data ?? 'none'}
        </span>
      )
    }

    const rendered = renderWithScope(scope, <Page />)
    await allSettled(mutation.start, { scope })
    rendered.getByText('idle: none')

    await allSettled(mutation.mutate, { scope, params: 'hello' })
    await act(async () => {
      await vi.advanceTimersByTimeAsync(11)
    })

    rendered.getByText('success: HELLO')
  })

  it('should transition to error state on failure', async () => {
    const scope = fork()
    const error = new Error('mutation failed')

    const mutation = createMutation<string, Error, string>(queryClient, {
      mutationFn: () => sleep(10).then(() => Promise.reject(error)),
    })

    function Page() {
      const { status, error: err } = useUnit({
        status: mutation.$status,
        error: mutation.$error,
      })
      return (
        <span>
          {status}: {err?.message ?? 'none'}
        </span>
      )
    }

    const rendered = renderWithScope(scope, <Page />)
    await allSettled(mutation.start, { scope })

    await allSettled(mutation.mutate, { scope, params: 'test' })
    await act(async () => {
      await vi.advanceTimersByTimeAsync(11)
    })

    rendered.getByText('error: mutation failed')
  })

  it('should track variables', async () => {
    const scope = fork()

    const mutation = createMutation(queryClient, {
      mutationFn: (vars: { id: number }) =>
        sleep(5).then(() => `item-${vars.id}`),
    })

    function Page() {
      const { variables, data } = useUnit({
        variables: mutation.$variables,
        data: mutation.$data,
      })
      return (
        <div>
          <span>vars: {variables ? String(variables.id) : 'none'}</span>
          <span>data: {data ?? 'none'}</span>
        </div>
      )
    }

    const rendered = renderWithScope(scope, <Page />)
    await allSettled(mutation.start, { scope })

    await allSettled(mutation.mutate, { scope, params: { id: 42 } })
    await act(async () => {
      await vi.advanceTimersByTimeAsync(6)
    })

    rendered.getByText('vars: 42')
    rendered.getByText('data: item-42')
  })

  it('should be able to reset state', async () => {
    const scope = fork()

    const mutation = createMutation(queryClient, {
      mutationFn: () => Promise.resolve('mutation'),
    })

    function Page() {
      const { data, status } = useUnit({
        data: mutation.$data,
        status: mutation.$status,
      })
      return (
        <span>
          {status}: {data ?? 'empty'}
        </span>
      )
    }

    const rendered = renderWithScope(scope, <Page />)
    await allSettled(mutation.start, { scope })
    rendered.getByText('idle: empty')

    await allSettled(mutation.mutate, { scope, params: undefined })
    await act(async () => {
      await vi.advanceTimersByTimeAsync(0)
    })

    rendered.getByText('success: mutation')

    await allSettled(mutation.reset, { scope })
    await act(async () => {
      await vi.advanceTimersByTimeAsync(0)
    })

    rendered.getByText('idle: empty')
  })

  it('should call onSuccess callback', async () => {
    const onSuccess = vi.fn()
    const scope = fork()

    const mutation = createMutation(queryClient, {
      mutationFn: (count: number) => Promise.resolve(count * 2),
      onSuccess: (data) => {
        onSuccess(data)
      },
    })

    await allSettled(mutation.start, { scope })

    await allSettled(mutation.mutate, { scope, params: 5 })
    await vi.advanceTimersByTimeAsync(0)

    await allSettled(mutation.mutate, { scope, params: 10 })
    await vi.advanceTimersByTimeAsync(0)

    expect(onSuccess).toHaveBeenCalledTimes(2)
    expect(onSuccess).toHaveBeenCalledWith(10)
    expect(onSuccess).toHaveBeenCalledWith(20)
  })

  it('should call onError callback', async () => {
    const onError = vi.fn()
    const scope = fork()

    const mutation = createMutation<void, Error, string>(queryClient, {
      mutationFn: (text: string) => Promise.reject(new Error(`fail: ${text}`)),
      onError: (error) => {
        onError(error.message)
      },
    })

    await allSettled(mutation.start, { scope })

    await allSettled(mutation.mutate, { scope, params: 'first' })
    await vi.advanceTimersByTimeAsync(0)

    await allSettled(mutation.mutate, { scope, params: 'second' })
    await vi.advanceTimersByTimeAsync(0)

    expect(onError).toHaveBeenCalledTimes(2)
    expect(onError).toHaveBeenCalledWith('fail: first')
    expect(onError).toHaveBeenCalledWith('fail: second')
  })

  it('should call onSettled callback on both success and error', async () => {
    const onSettled = vi.fn()
    let shouldFail = false
    const scope = fork()

    const mutation = createMutation(queryClient, {
      mutationFn: (text: string) => {
        if (shouldFail) return Promise.reject(new Error('fail'))
        return Promise.resolve(text)
      },
      onSettled: (data, error) => {
        onSettled(data, error?.message)
      },
    })

    await allSettled(mutation.start, { scope })

    // Success
    await allSettled(mutation.mutate, { scope, params: 'ok' })
    await vi.advanceTimersByTimeAsync(0)

    // Error
    shouldFail = true
    await allSettled(mutation.mutate, { scope, params: 'fail' })
    await vi.advanceTimersByTimeAsync(0)

    expect(onSettled).toHaveBeenCalledTimes(2)
    expect(onSettled).toHaveBeenCalledWith('ok', undefined)
    expect(onSettled).toHaveBeenCalledWith(undefined, 'fail')
  })

  it('should be able to retry a failed mutation', async () => {
    let attempts = 0
    const scope = fork()

    const mutation = createMutation(queryClient, {
      mutationFn: async () => {
        attempts++
        if (attempts < 3) throw new Error(`attempt ${attempts}`)
        return 'success'
      },
      retry: 2,
      retryDelay: 5,
    })

    function Page() {
      const { data, status } = useUnit({
        data: mutation.$data,
        status: mutation.$status,
      })
      return (
        <span>
          {status}: {data ?? 'none'}
        </span>
      )
    }

    const rendered = renderWithScope(scope, <Page />)
    await allSettled(mutation.start, { scope })

    await allSettled(mutation.mutate, { scope, params: undefined })
    await act(async () => {
      await vi.advanceTimersByTimeAsync(50)
    })

    rendered.getByText('success: success')
    expect(attempts).toBe(3)
  })

  it('should handle multiple sequential mutations', async () => {
    const scope = fork()
    let count = 0

    const mutation = createMutation(queryClient, {
      mutationFn: async () => {
        count++
        await sleep(5)
        return count
      },
    })

    function Page() {
      const { data, status } = useUnit({
        data: mutation.$data,
        status: mutation.$status,
      })
      return (
        <span>
          {status}: {data ?? 'none'}
        </span>
      )
    }

    const rendered = renderWithScope(scope, <Page />)
    await allSettled(mutation.start, { scope })

    // First mutation
    await allSettled(mutation.mutate, { scope, params: undefined })
    await act(async () => {
      await vi.advanceTimersByTimeAsync(6)
    })
    rendered.getByText('success: 1')

    // Second mutation
    await allSettled(mutation.mutate, { scope, params: undefined })
    await act(async () => {
      await vi.advanceTimersByTimeAsync(6)
    })
    rendered.getByText('success: 2')
  })

  it('should show pending state while mutation is in progress', async () => {
    const scope = fork()

    const mutation = createMutation(queryClient, {
      mutationFn: () => sleep(20).then(() => 'done'),
    })

    function Page() {
      const { status, isPending } = useUnit({
        status: mutation.$status,
        isPending: mutation.$isPending,
      })
      return (
        <span>
          {status}, pending: {String(isPending)}
        </span>
      )
    }

    const rendered = renderWithScope(scope, <Page />)
    await allSettled(mutation.start, { scope })
    rendered.getByText('idle, pending: false')

    await allSettled(mutation.mutate, { scope, params: undefined })
    await act(async () => {
      await vi.advanceTimersByTimeAsync(1)
    })

    rendered.getByText('pending, pending: true')

    await act(async () => {
      await vi.advanceTimersByTimeAsync(20)
    })

    rendered.getByText('success, pending: false')
  })

  it('should reset error state after successful mutation', async () => {
    let shouldFail = true
    const scope = fork()

    const mutation = createMutation(queryClient, {
      mutationFn: async () => {
        await sleep(5)
        if (shouldFail) throw new Error('fail')
        return 'recovered'
      },
    })

    function Page() {
      const { data, status, error } = useUnit({
        data: mutation.$data,
        status: mutation.$status,
        error: mutation.$error,
      })
      return (
        <div>
          <span>status: {status}</span>
          <span>data: {data ?? 'none'}</span>
          <span>error: {error?.message ?? 'none'}</span>
        </div>
      )
    }

    const rendered = renderWithScope(scope, <Page />)
    await allSettled(mutation.start, { scope })

    // Fail
    await allSettled(mutation.mutate, { scope, params: undefined })
    await act(async () => {
      await vi.advanceTimersByTimeAsync(6)
    })
    rendered.getByText('status: error')
    rendered.getByText('error: fail')

    // Succeed
    shouldFail = false
    await allSettled(mutation.mutate, { scope, params: undefined })
    await act(async () => {
      await vi.advanceTimersByTimeAsync(6)
    })
    rendered.getByText('status: success')
    rendered.getByText('data: recovered')
    rendered.getByText('error: none')
  })

  it('should use mutation defaults from QueryClient', async () => {
    const onSuccess = vi.fn()
    const client = new QueryClient({
      defaultOptions: {
        mutations: {
          onSuccess,
        },
      },
    })
    client.mount()
    const scope = fork()

    const mutation = createMutation(client, {
      mutationFn: () => Promise.resolve('data'),
    })

    await allSettled(mutation.start, { scope })

    await allSettled(mutation.mutate, { scope, params: undefined })
    await vi.advanceTimersByTimeAsync(0)

    expect(onSuccess).toHaveBeenCalledTimes(1)

    client.clear()
  })

  it('should work with void variables', async () => {
    const scope = fork()

    const mutation = createMutation(queryClient, {
      mutationFn: () => Promise.resolve('no args needed'),
    })

    function Page() {
      const { data, status } = useUnit({
        data: mutation.$data,
        status: mutation.$status,
      })
      return (
        <span>
          {status}: {data ?? 'none'}
        </span>
      )
    }

    const rendered = renderWithScope(scope, <Page />)
    await allSettled(mutation.start, { scope })

    await allSettled(mutation.mutate, { scope, params: undefined })
    await act(async () => {
      await vi.advanceTimersByTimeAsync(0)
    })

    rendered.getByText('success: no args needed')
  })

  it('should allow invalidating queries from onSuccess callback', async () => {
    const qk = ['todos']
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries')

    const mutation = createMutation(queryClient, {
      mutationFn: () => Promise.resolve('added'),
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: qk })
      },
    })

    mutation.start()
    mutation.mutate(undefined as never)
    await vi.advanceTimersByTimeAsync(10)

    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: qk })
    invalidateSpy.mockRestore()
  })

  // ── onMutate context flow ───────────────────────────────────────────

  it('should pass onMutate result as context to onSuccess and onSettled', async () => {
    const onSuccess = vi.fn()
    const onSettled = vi.fn()
    const scope = fork()

    const mutation = createMutation<string, Error, string, { snapshot: string }>(
      queryClient,
      {
        mutationFn: (text: string) => sleep(5).then(() => text),
        onMutate: (variables) => ({ snapshot: `before-${variables}` }),
        onSuccess: (data, variables, onMutateResult) => {
          onSuccess(data, variables, onMutateResult)
        },
        onSettled: (data, error, variables, onMutateResult) => {
          onSettled(data, error?.message ?? null, variables, onMutateResult)
        },
      },
    )

    await allSettled(mutation.start, { scope })
    await allSettled(mutation.mutate, { scope, params: 'todo' })
    await vi.advanceTimersByTimeAsync(6)

    expect(onSuccess).toHaveBeenCalledWith('todo', 'todo', { snapshot: 'before-todo' })
    expect(onSettled).toHaveBeenCalledWith('todo', null, 'todo', {
      snapshot: 'before-todo',
    })
  })

  it('should pass onMutate result as context to onError on failure', async () => {
    const onError = vi.fn()
    const scope = fork()
    const failure = new Error('boom')

    const mutation = createMutation<string, Error, string, { saved: number }>(
      queryClient,
      {
        mutationFn: () => sleep(5).then(() => Promise.reject(failure)),
        onMutate: () => ({ saved: 7 }),
        onError: (error, variables, onMutateResult) => {
          onError(error.message, variables, onMutateResult)
        },
      },
    )

    await allSettled(mutation.start, { scope })
    await allSettled(mutation.mutate, { scope, params: 'oops' })
    await vi.advanceTimersByTimeAsync(6)

    expect(onError).toHaveBeenCalledWith('boom', 'oops', { saved: 7 })
  })

  // ── meta propagation ────────────────────────────────────────────────

  it('should pass meta to MutationCache callbacks', async () => {
    const successMock = vi.fn()
    const errorMock = vi.fn()

    const client = new QueryClient({
      defaultOptions: { mutations: { retry: false } },
      mutationCache: new MutationCache({
        onSuccess: (_data, _variables, _ctx, mutation) => {
          successMock(mutation.meta?.successMessage)
        },
        onError: (_error, _variables, _ctx, mutation) => {
          errorMock(mutation.meta?.errorMessage)
        },
      }),
    })
    client.mount()
    const scope = fork()

    const ok = createMutation(client, {
      mutationFn: () => Promise.resolve('ok'),
      meta: { successMessage: 'mutation succeeded' },
    })
    const fail = createMutation(client, {
      mutationFn: () => Promise.reject(new Error('fail')),
      meta: { errorMessage: 'mutation failed' },
    })

    await allSettled(ok.start, { scope })
    await allSettled(fail.start, { scope })

    await allSettled(ok.mutate, { scope, params: undefined })
    await vi.advanceTimersByTimeAsync(0)
    await allSettled(fail.mutate, { scope, params: undefined })
    await vi.advanceTimersByTimeAsync(0)

    expect(successMock).toHaveBeenCalledWith('mutation succeeded')
    expect(errorMock).toHaveBeenCalledWith('mutation failed')

    client.clear()
  })

  // ── callback errors ─────────────────────────────────────────────────

  it('should transition to error status if onSuccess callback rejects', async () => {
    const scope = fork()
    const onError = vi.fn()
    const failure = new Error('error from onSuccess')

    const mutation = createMutation<string, Error, string>(queryClient, {
      mutationFn: (text: string) => sleep(5).then(() => text),
      onSuccess: () => Promise.reject(failure),
      onError: (error) => {
        onError(error.message)
      },
    })

    function Page() {
      const { status } = useUnit({ status: mutation.$status })
      return <span>status: {status}</span>
    }

    const rendered = renderWithScope(scope, <Page />)
    await allSettled(mutation.start, { scope })
    await allSettled(mutation.mutate, { scope, params: 'todo' })
    await act(async () => {
      await vi.advanceTimersByTimeAsync(6)
    })

    rendered.getByText('status: error')
    expect(onError).toHaveBeenCalledWith('error from onSuccess')
  })

  it(
    'should remain in error status if onError callback rejects, keeping original error',
    async ({ onTestFinished }) => {
      const unhandledRejection = vi.fn()
      process.on('unhandledRejection', unhandledRejection)
      onTestFinished(() => {
        process.off('unhandledRejection', unhandledRejection)
      })

      const scope = fork()
      const fnError = new Error('mutateFn error')

      const mutation = createMutation<string, Error, string>(queryClient, {
        mutationFn: () => sleep(5).then(() => Promise.reject(fnError)),
        onError: () => Promise.reject(new Error('error from onError')),
      })

      function Page() {
        const { status, error } = useUnit({
          status: mutation.$status,
          error: mutation.$error,
        })
        return (
          <span>
            {status}: {error?.message ?? 'none'}
          </span>
        )
      }

      const rendered = renderWithScope(scope, <Page />)
      await allSettled(mutation.start, { scope })
      await allSettled(mutation.mutate, { scope, params: 'todo' })
      await act(async () => {
        await vi.advanceTimersByTimeAsync(6)
      })

      rendered.getByText('error: mutateFn error')
    },
  )
})
