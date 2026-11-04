// #22: useMutation consumes a factory-form mutation; source changes reach
// the next invocation inside a scope.
import { afterEach, beforeEach, describe, it, vi } from 'vitest'
import { act, render } from '@testing-library/react'
import { Provider } from 'effector-react'
import { allSettled, createEvent, createStore, fork } from 'effector'
import { QueryClient } from '@tanstack/query-core'
import { createMutation, mutationOptions } from '@effector-tanstack-query/core'
import { useMutation } from '../index'
import { sleep } from './test-utils'

const renameOptions = ({ id }: { id: number }) =>
  mutationOptions({
    mutationKey: ['rename'],
    mutationFn: (title: string) => sleep(10).then(() => `${id}:${title}`),
  })

describe('useMutation — factory form', () => {
  let client: QueryClient
  beforeEach(() => {
    vi.useFakeTimers()
    client = new QueryClient({ defaultOptions: { mutations: { retry: false } } })
    client.mount()
  })
  afterEach(() => {
    client.clear()
    vi.useRealTimers()
  })

  it('mutates with the current source value', async () => {
    const changed = createEvent<number>()
    const $id = createStore(1).on(changed, (_, id) => id)
    const rename = createMutation(client, {
      name: 'react.mutationFactory',
      source: { id: $id },
      mutation: renameOptions,
    })
    const scope = fork()

    function Page() {
      const { data, status, mutate } = useMutation(rename)
      return (
        <button onClick={() => mutate('x')}>
          {status}:{data ?? 'none'}
        </button>
      )
    }

    const rendered = render(
      <Provider value={scope}>
        <Page />
      </Provider>,
    )
    rendered.getByText('idle:none')

    act(() => rendered.getByRole('button').click())
    await act(() => vi.advanceTimersByTimeAsync(10))
    rendered.getByText('success:1:x')

    await act(() => allSettled(changed, { scope, params: 2 }))
    act(() => rendered.getByRole('button').click())
    await act(() => vi.advanceTimersByTimeAsync(10))
    rendered.getByText('success:2:x')
  })
})
