import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { act, render } from '@testing-library/react'
import * as React from 'react'
import { Provider } from 'effector-react'
import { allSettled, fork } from 'effector'
import { MutationObserver, QueryClient } from '@tanstack/query-core'
import {
  $queryClient,
  createMutation,
  setQueryClient,
} from '@effector-tanstack-query/core'
import { useIsMutating, useMutation } from '..'
import { sleep } from './test-utils'
import type { Scope } from 'effector'

function renderWithScope(scope: Scope, ui: React.ReactElement) {
  return render(<Provider value={scope}>{ui}</Provider>)
}

describe('useIsMutating', () => {
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

  function Indicator({
    filters,
  }: {
    filters?: Parameters<typeof useIsMutating>[0]
  }) {
    const count = useIsMutating(filters)
    return <span data-testid="count">{count}</span>
  }

  it('returns 0 when there are no active mutations', () => {
    const scope = fork({ values: [[$queryClient, queryClient]] })
    const r = renderWithScope(scope, <Indicator />)
    expect(r.getByTestId('count').textContent).toBe('0')
  })

  it('increments to 1 while a mutation runs, back to 0 after it settles', async () => {
    // No explicit client → resolves the scope's $queryClient, same instance the
    // hook reads.
    const mutation = createMutation<string, Error, string>({
      name: 'isMutating.single',
      mutationKey: ['createUser'],
      mutationFn: () => sleep(10).then(() => 'done'),
    })
    const scope = fork({ values: [[$queryClient, queryClient]] })

    function Page() {
      useMutation(mutation)
      return <Indicator />
    }

    const r = renderWithScope(scope, <Page />)
    expect(r.getByTestId('count').textContent).toBe('0')

    await act(async () => {
      await allSettled(mutation.mutate, { scope, params: 'alice' })
    })
    expect(r.getByTestId('count').textContent).toBe('1')

    await act(async () => {
      await vi.advanceTimersByTimeAsync(11)
    })
    expect(r.getByTestId('count').textContent).toBe('0')
  })

  it('counts multiple simultaneous mutations', async () => {
    const m1 = createMutation<string, Error, void>({
      name: 'isMutating.multi1',
      mutationFn: () => sleep(10).then(() => 'a'),
    })
    const m2 = createMutation<string, Error, void>({
      name: 'isMutating.multi2',
      mutationFn: () => sleep(10).then(() => 'b'),
    })
    const scope = fork({ values: [[$queryClient, queryClient]] })

    function Page() {
      useMutation(m1)
      useMutation(m2)
      return <Indicator />
    }

    const r = renderWithScope(scope, <Page />)

    await act(async () => {
      await allSettled(m1.mutate, { scope })
      await allSettled(m2.mutate, { scope })
    })
    expect(r.getByTestId('count').textContent).toBe('2')

    await act(async () => {
      await vi.advanceTimersByTimeAsync(11)
    })
    expect(r.getByTestId('count').textContent).toBe('0')
  })

  it('filters by mutationKey — ignores non-matching mutations', async () => {
    const userMutation = createMutation<string, Error, void>({
      name: 'isMutating.user',
      mutationKey: ['createUser'],
      mutationFn: () => sleep(10).then(() => 'u'),
    })
    const postMutation = createMutation<string, Error, void>({
      name: 'isMutating.post',
      mutationKey: ['createPost'],
      mutationFn: () => sleep(10).then(() => 'p'),
    })
    const scope = fork({ values: [[$queryClient, queryClient]] })

    function Page() {
      useMutation(userMutation)
      useMutation(postMutation)
      const all = useIsMutating()
      const users = useIsMutating({ mutationKey: ['createUser'] })
      return (
        <span>
          <span data-testid="all">{all}</span>
          <span data-testid="users">{users}</span>
        </span>
      )
    }

    const r = renderWithScope(scope, <Page />)

    await act(async () => {
      await allSettled(userMutation.mutate, { scope })
      await allSettled(postMutation.mutate, { scope })
    })
    expect(r.getByTestId('all').textContent).toBe('2')
    expect(r.getByTestId('users').textContent).toBe('1')

    await act(async () => {
      await vi.advanceTimersByTimeAsync(11)
    })
    expect(r.getByTestId('all').textContent).toBe('0')
  })

  it('reacts to a $queryClient change in the scope', async () => {
    const scope = fork({ values: [[$queryClient, queryClient]] })
    const r = renderWithScope(scope, <Indicator />)
    expect(r.getByTestId('count').textContent).toBe('0')

    // A second client with an in-flight mutation.
    const otherClient = new QueryClient({
      defaultOptions: { mutations: { retry: false } },
    })
    otherClient.mount()
    const observer = new MutationObserver(otherClient, {
      mutationFn: () => sleep(50).then(() => 'x'),
    })
    void observer.mutate().catch(() => {})

    await act(async () => {
      await allSettled(setQueryClient, { scope, params: otherClient })
    })
    expect(r.getByTestId('count').textContent).toBe('1')

    await act(async () => {
      await vi.advanceTimersByTimeAsync(51)
    })
    expect(r.getByTestId('count').textContent).toBe('0')
    otherClient.clear()
  })

  it('returns 0 when no QueryClient is set (SSR / no scope client)', () => {
    const scope = fork() // no $queryClient value
    const r = renderWithScope(scope, <Indicator />)
    expect(r.getByTestId('count').textContent).toBe('0')
  })
})
