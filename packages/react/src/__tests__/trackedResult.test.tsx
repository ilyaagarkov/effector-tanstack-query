// Issue #27: result hooks track the fields a component reads and re-render
// only when one of those changes (`notifyOnChangeProps: 'tracked'`, the
// default). `'all'` opts back into re-rendering on every field.
//
// Counting and fetch-control helpers live in ./tracked-utils.
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { act, fireEvent, render } from '@testing-library/react'
import * as React from 'react'
import { Provider } from 'effector-react'
import { createWatch, fork } from 'effector'
import { QueryClient } from '@tanstack/query-core'
import type { InfiniteData } from '@tanstack/query-core'
import { queryKey } from './test-utils'
import {
  commitsDuring,
  controlledFn,
  Counted,
  flush,
  renderCounted,
} from './tracked-utils'
import type { Counter, Todo } from './tracked-utils'
import {
  $queryClient,
  createInfiniteQuery,
  createMutation,
  createQuery,
} from '@effector-tanstack-query/core'
import { useInfiniteQuery, useMutation, useQuery } from '..'

describe('useQuery — notifyOnChangeProps', () => {
  let queryClient: QueryClient

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    })
    queryClient.mount()
  })

  afterEach(() => {
    queryClient.clear()
  })

  /** Seeded, never-stale query — mounting doesn't fetch, refetches are explicit. */
  function seededQuery(name: string) {
    const key = queryKey()
    const response = controlledFn<Todo>()
    queryClient.setQueryData(key, { id: 1 })
    const query = createQuery(queryClient, {
      name,
      queryKey: key,
      queryFn: response.fn,
      staleTime: Infinity,
    })
    const refetch = () =>
      queryClient.refetchQueries({ queryKey: key, exact: true })
    return { key, query, response, refetch }
  }

  /** Background refetch, with start and completion in separate commits. */
  async function backgroundRefetch(
    { response, refetch }: ReturnType<typeof seededQuery>,
    outcome: { data: Todo } | { error: Error },
  ) {
    void refetch()
    await flush()
    if ('data' in outcome) response.last().resolve(outcome.data)
    else response.last().reject(outcome.error)
    await flush()
  }

  describe("'all'", () => {
    it('re-renders a data-only consumer when isFetching flips', async () => {
      const q = seededQuery('all.dataOnly')

      function Consumer() {
        const { data } = useQuery(q.query, { notifyOnChangeProps: 'all' })
        return <span>{data?.id}</span>
      }

      const { counter } = renderCounted(<Consumer />, { scope: fork() })
      await flush()

      const commits = await commitsDuring(counter, () =>
        backgroundRefetch(q, { data: { id: 1 } }),
      )
      expect(commits).toBe(2)
    })
  })

  describe("default ('tracked')", () => {
    it("treats an explicit 'tracked' the same as the default", async () => {
      const q = seededQuery('tracked.explicit')

      function Consumer() {
        const { data } = useQuery(q.query, { notifyOnChangeProps: 'tracked' })
        return <span>{data?.id}</span>
      }

      const { counter } = renderCounted(<Consumer />, { scope: fork() })
      await flush()

      const commits = await commitsDuring(counter, () =>
        backgroundRefetch(q, { data: { id: 1 } }),
      )
      expect(commits).toBe(0)
    })

    it('skips a background refetch that returns identical data', async () => {
      const q = seededQuery('tracked.identical')

      function Consumer() {
        const { data } = useQuery(q.query)
        return <span>{data?.id}</span>
      }

      const { counter, getByText } = renderCounted(<Consumer />, {
        scope: fork(),
      })
      await flush()
      getByText('1')

      const commits = await commitsDuring(counter, () =>
        backgroundRefetch(q, { data: { id: 1 } }),
      )
      expect(commits).toBe(0)
      expect(q.response.fn).toHaveBeenCalledTimes(1)
    })

    it('re-renders once when the read data actually changes', async () => {
      const q = seededQuery('tracked.changed')

      function Consumer() {
        const { data } = useQuery(q.query)
        return <span>id: {data?.id}</span>
      }

      const { counter, getByText } = renderCounted(<Consumer />, {
        scope: fork(),
      })
      await flush()

      const commits = await commitsDuring(counter, () =>
        backgroundRefetch(q, { data: { id: 2 } }),
      )
      expect(commits).toBe(1)
      getByText('id: 2')
    })

    it('skips a failed refetch that keeps the previous data', async () => {
      const q = seededQuery('tracked.failedRefetch')

      function Consumer() {
        const { data } = useQuery(q.query)
        return <span>id: {data?.id}</span>
      }

      const { counter, getByText } = renderCounted(<Consumer />, {
        scope: fork(),
      })
      await flush()

      const commits = await commitsDuring(counter, () =>
        backgroundRefetch(q, { error: new Error('boom') }),
      )
      expect(commits).toBe(0)
      getByText('id: 1')
    })

    it('re-renders on every change of a field that is read', async () => {
      const q = seededQuery('tracked.isFetching')
      const seen: boolean[] = []

      function Consumer() {
        const { data, isFetching } = useQuery(q.query)
        seen.push(isFetching)
        return (
          <span>
            {data?.id} {isFetching ? 'fetching' : 'idle'}
          </span>
        )
      }

      const { counter, getByText } = renderCounted(<Consumer />, {
        scope: fork(),
      })
      await flush()

      const commits = await commitsDuring(counter, async () => {
        void q.refetch()
        await flush()
        getByText('1 fetching')

        q.response.last().resolve({ id: 1 })
        await flush()
        getByText('1 idle')
      })

      expect(commits).toBe(2) // request start + completion
      expect(seen.at(-1)).toBe(false)
      expect(seen).toContain(true)
    })

    it('re-renders when a read error appears', async () => {
      const q = seededQuery('tracked.error')

      function Consumer() {
        const { error } = useQuery(q.query)
        return <span>{error ? error.message : 'no error'}</span>
      }

      const { counter, getByText } = renderCounted(<Consumer />, {
        scope: fork(),
      })
      await flush()
      getByText('no error')

      const commits = await commitsDuring(counter, () =>
        backgroundRefetch(q, { error: new Error('boom') }),
      )
      expect(commits).toBe(1)
      getByText('boom')
    })

    it('starts tracking a field that a later render reads conditionally', async () => {
      const q = seededQuery('tracked.conditional')

      // `error` is read only once `isError` is true, so the first render
      // tracks `isError` alone. After that the tracked set includes `error`.
      function Consumer() {
        const result = useQuery(q.query)
        return <span>{result.isError ? result.error!.message : 'ok'}</span>
      }

      const { counter, getByText } = renderCounted(<Consumer />, {
        scope: fork(),
      })
      await flush()
      getByText('ok')

      await backgroundRefetch(q, { error: new Error('first') })
      getByText('first')

      // `isError` stays true; only `error` changes. Re-renders only if the
      // field read in the previous render is now tracked.
      const commits = await commitsDuring(counter, () =>
        backgroundRefetch(q, { error: new Error('second') }),
      )
      expect(commits).toBe(1)
      getByText('second')
    })

    it('tracks every field when the result is spread with a rest element', async () => {
      const q = seededQuery('tracked.rest')

      function Consumer() {
        const { data, ...rest } = useQuery(q.query)
        void rest
        return <span>{data?.id}</span>
      }

      const { counter } = renderCounted(<Consumer />, { scope: fork() })
      await flush()

      const commits = await commitsDuring(counter, () =>
        backgroundRefetch(q, { data: { id: 1 } }),
      )
      expect(commits).toBe(2)
    })

    it('tracks a field first read in an event handler from then on', async () => {
      const q = seededQuery('tracked.handler')
      const readInHandler: boolean[] = []

      function Consumer() {
        const result = useQuery(q.query)
        return (
          <button onClick={() => readInHandler.push(result.isFetching)}>
            {result.data?.id}
          </button>
        )
      }

      const { counter, getByRole } = renderCounted(<Consumer />, {
        scope: fork(),
      })
      await flush()

      fireEvent.click(getByRole('button'))
      expect(readInHandler).toEqual([false])

      const commits = await commitsDuring(counter, () =>
        backgroundRefetch(q, { data: { id: 1 } }),
      )
      expect(commits).toBe(2)
    })

    it('commits once when several tracked fields change in one update', async () => {
      const key = queryKey()
      const response = controlledFn<Todo>()
      const query = createQuery(queryClient, {
        name: 'tracked.batched',
        queryKey: key,
        queryFn: response.fn,
      })

      function Consumer() {
        const { data, status, isFetching } = useQuery(query)
        return (
          <span>
            {status} {String(isFetching)} {data?.id}
          </span>
        )
      }

      const { counter, getByText } = renderCounted(<Consumer />, {
        scope: fork(),
      })
      await flush()
      getByText('pending true')

      // data, status and isFetching all change when the first fetch resolves.
      const commits = await commitsDuring(counter, async () => {
        response.last().resolve({ id: 7 })
        await flush()
      })
      expect(commits).toBe(1)
      getByText('success false 7')
    })

    it('never renders a torn snapshot of the read fields', async () => {
      const key = queryKey()
      const response = controlledFn<Todo>()
      const query = createQuery(queryClient, {
        name: 'tracked.consistent',
        queryKey: key,
        queryFn: response.fn,
      })
      const snapshots: Array<[string, Todo | undefined]> = []

      function Consumer() {
        const { data, status } = useQuery(query)
        snapshots.push([status, data])
        return <span>{status}</span>
      }

      renderCounted(<Consumer />, { scope: fork() })
      await flush()
      response.last().resolve({ id: 3 })
      await flush()

      expect(snapshots.length).toBeGreaterThan(1)
      for (const [status, data] of snapshots) {
        if (status === 'success') expect(data).toEqual({ id: 3 })
        if (status === 'pending') expect(data).toBeUndefined()
      }
    })

    it('keeps each consumer’s tracked set independent', async () => {
      const q = seededQuery('tracked.independent')
      const dataCounter: Counter = { commits: 0 }
      const fetchingCounter: Counter = { commits: 0 }

      function DataConsumer() {
        const { data } = useQuery(q.query)
        return <span>{data?.id}</span>
      }
      function FetchingConsumer() {
        const { isFetching } = useQuery(q.query)
        return <span>{String(isFetching)}</span>
      }

      render(
        <Provider value={fork()}>
          <Counted counter={dataCounter}>
            <DataConsumer />
          </Counted>
          <Counted counter={fetchingCounter}>
            <FetchingConsumer />
          </Counted>
        </Provider>,
      )
      await flush()
      const data0 = dataCounter.commits
      const fetching0 = fetchingCounter.commits

      await backgroundRefetch(q, { data: { id: 1 } })

      expect(dataCounter.commits - data0).toBe(0)
      expect(fetchingCounter.commits - fetching0).toBe(2)
    })

    it('does not filter the model stores themselves', async () => {
      const q = seededQuery('tracked.modelStores')
      const scope = fork()
      const isFetchingUpdates: boolean[] = []
      const unwatch = createWatch({
        unit: q.query.$isFetching,
        fn: (value) => isFetchingUpdates.push(value),
        scope,
      })

      function Consumer() {
        const { data } = useQuery(q.query)
        return <span>{data?.id}</span>
      }

      renderCounted(<Consumer />, { scope })
      await flush()
      await backgroundRefetch(q, { data: { id: 1 } })
      unwatch()

      expect(isFetchingUpdates).toEqual([true, false])
      expect(scope.getState(q.query.$isFetching)).toBe(false)
    })

    it('keeps the mount/unmount lifecycle and a stable refresh', async () => {
      const key = queryKey()
      const response = controlledFn<Todo>()
      let aborted = false
      const query = createQuery<Todo>(queryClient, {
        name: 'tracked.lifecycle',
        queryKey: key,
        queryFn: ({ signal }) => {
          signal.addEventListener('abort', () => {
            aborted = true
          })
          return response.fn()
        },
      })
      const refreshes = new Set<() => void>()

      function Consumer() {
        const { data, refresh } = useQuery(query)
        refreshes.add(refresh)
        return <button onClick={refresh}>{data?.id ?? 'none'}</button>
      }

      const { getByText, unmount } = renderCounted(<Consumer />, {
        scope: fork(),
      })
      await flush()
      expect(response.fn).toHaveBeenCalledTimes(1)

      response.last().resolve({ id: 1 })
      await flush()
      fireEvent.click(getByText('1'))
      await flush()
      expect(response.fn).toHaveBeenCalledTimes(2)
      expect(refreshes.size).toBe(1)

      unmount()
      await flush()
      expect(aborted).toBe(true)
    })

    it('works without an effector Provider', async () => {
      const q = seededQuery('tracked.noProvider')

      function Consumer() {
        const { data } = useQuery(q.query)
        return <span>id: {data?.id}</span>
      }

      const { counter, getByText } = renderCounted(<Consumer />)
      await flush()
      getByText('id: 1')

      expect(
        await commitsDuring(counter, () =>
          backgroundRefetch(q, { data: { id: 1 } }),
        ),
      ).toBe(0)
      expect(
        await commitsDuring(counter, () =>
          backgroundRefetch(q, { data: { id: 2 } }),
        ),
      ).toBe(1)
      getByText('id: 2')
    })

    describe('fork scopes', () => {
      function scopedQuery(name: string) {
        const key = queryKey()
        const query = createQuery<Todo>({
          name,
          queryKey: key,
          queryFn: async () => ({ id: 0 }),
          staleTime: Infinity,
        })
        const makeScope = (id: number) => {
          const client = new QueryClient()
          client.setQueryData(key, { id })
          return { client, scope: fork({ values: [[$queryClient, client]] }) }
        }
        return { key, query, makeScope }
      }

      it('ignores updates in another scope', async () => {
        const { key, query, makeScope } = scopedQuery('tracked.scopeIsolation')
        const a = makeScope(1)
        const b = makeScope(2)

        const counterA: Counter = { commits: 0 }
        const counterB: Counter = { commits: 0 }

        function Consumer({ label }: { label: string }) {
          const { data } = useQuery(query)
          return (
            <span>
              {label}: {data?.id}
            </span>
          )
        }

        const { getByText } = render(
          <>
            <Provider value={a.scope}>
              <Counted counter={counterA}>
                <Consumer label="a" />
              </Counted>
            </Provider>
            <Provider value={b.scope}>
              <Counted counter={counterB}>
                <Consumer label="b" />
              </Counted>
            </Provider>
          </>,
        )
        await flush()
        getByText('a: 1')
        getByText('b: 2')
        const a0 = counterA.commits
        const b0 = counterB.commits

        await act(async () => {
          a.client.setQueryData(key, { id: 10 })
        })
        await flush()

        expect(counterA.commits - a0).toBe(1)
        expect(counterB.commits - b0).toBe(0)
        getByText('a: 10')
        getByText('b: 2')
        expect(b.scope.getState(query.$data)).toEqual({ id: 2 })
      })

      it('reads the new scope when the Provider value changes', async () => {
        const { key, query, makeScope } = scopedQuery('tracked.scopeSwap')
        const a = makeScope(1)
        const b = makeScope(2)

        function Consumer() {
          const { data } = useQuery(query)
          return <span>id: {data?.id}</span>
        }

        const { getByText, rerender } = render(
          <Provider value={a.scope}>
            <Consumer />
          </Provider>,
        )
        await flush()
        getByText('id: 1')

        rerender(
          <Provider value={b.scope}>
            <Consumer />
          </Provider>,
        )
        await flush()
        getByText('id: 2')

        // Updates in the new scope still reach the component.
        await act(async () => {
          b.client.setQueryData(key, { id: 3 })
        })
        await flush()
        getByText('id: 3')
      })
    })

    describe('concurrent rendering', () => {
      it('keeps reading the committed query while a transition is suspended', async () => {
        // The suspended transition renders Consumer with queryB, but that
        // render never commits: notifications must still be checked against
        // queryA. Primitive data makes both queries hold equal values, so a
        // check against the wrong query would drop or invent updates.
        const responseA = controlledFn<number>()
        const keyA = queryKey()
        const keyB = queryKey()
        queryClient.setQueryData(keyA, 1)
        queryClient.setQueryData(keyB, 1)
        const make = (name: string, key: string[], fn: () => Promise<number>) =>
          createQuery<number>(queryClient, {
            name,
            queryKey: key,
            queryFn: fn,
            staleTime: Infinity,
          })
        const queryA = make('tracked.transition.a', keyA, responseA.fn)
        const queryB = make(
          'tracked.transition.b',
          keyB,
          () => new Promise<number>(() => {}),
        )

        const counter: Counter = { commits: 0 }
        function Consumer({ query }: { query: typeof queryA }) {
          const { data } = useQuery(query)
          return <span>value: {data}</span>
        }
        // Keeps queryB mounted so its scope store holds the same value as
        // queryA's.
        function KeepMounted() {
          useQuery(queryB)
          return null
        }
        const never = new Promise<never>(() => {})
        function Never(): React.ReactNode {
          throw never
        }

        let switchTo!: (query: typeof queryA) => void
        function Parent() {
          const [query, setQuery] = React.useState(queryA)
          switchTo = (next) => React.startTransition(() => setQuery(next))
          return (
            <React.Suspense fallback={<span>loading</span>}>
              <Counted counter={counter}>
                <Consumer query={query} />
              </Counted>
              {query === queryB && <Never />}
            </React.Suspense>
          )
        }

        const { getByText, queryByText } = render(
          <Provider value={fork()}>
            <KeepMounted />
            <Parent />
          </Provider>,
        )
        await flush()
        getByText('value: 1')

        // The transition renders Consumer with queryB, then suspends: React
        // keeps the committed UI (still queryA) and the render is pending.
        await act(async () => switchTo(queryB))
        await flush()
        getByText('value: 1')
        expect(queryByText('loading')).toBeNull()

        // Untracked change of the committed query: nothing to re-render.
        const commits = await commitsDuring(counter, async () => {
          void queryClient.refetchQueries({ queryKey: keyA, exact: true })
          await flush()
          responseA.last().resolve(1)
          await flush()
        })
        expect(commits).toBe(0)
        getByText('value: 1')

        // Tracked change of the committed query still lands.
        await act(async () => {
          queryClient.setQueryData(keyA, 10)
        })
        await flush()
        getByText('value: 10')
      })
    })

    describe('StrictMode', () => {
      it('skips identical refetches', async () => {
        const q = seededQuery('tracked.strict.identical')

        function Consumer() {
          const { data } = useQuery(q.query)
          return <span>{data?.id}</span>
        }

        const { counter } = renderCounted(<Consumer />, {
          scope: fork(),
          strict: true,
        })
        await flush()

        const commits = await commitsDuring(counter, () =>
          backgroundRefetch(q, { data: { id: 1 } }),
        )
        expect(commits).toBe(0)
      })

      it('still reports read fields', async () => {
        const q = seededQuery('tracked.strict.isFetching')

        function Consumer() {
          const { isFetching } = useQuery(q.query)
          return <span>{String(isFetching)}</span>
        }

        const { counter } = renderCounted(<Consumer />, {
          scope: fork(),
          strict: true,
        })
        await flush()

        const commits = await commitsDuring(counter, () =>
          backgroundRefetch(q, { data: { id: 1 } }),
        )
        expect(commits).toBe(2)
      })
    })
  })
})

describe('useInfiniteQuery — notifyOnChangeProps', () => {
  let queryClient: QueryClient

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    })
    queryClient.mount()
  })

  afterEach(() => {
    queryClient.clear()
  })

  function seededInfiniteQuery(name: string) {
    const key = queryKey()
    const response = controlledFn<number[]>()
    const seed: InfiniteData<number[], number> = {
      pages: [[1, 2]],
      pageParams: [0],
    }
    queryClient.setQueryData(key, seed)
    const query = createInfiniteQuery(queryClient, {
      name,
      queryKey: key,
      queryFn: response.fn,
      initialPageParam: 0,
      getNextPageParam: (_last: number[], pages: number[][]) => pages.length,
      staleTime: Infinity,
    })
    return { query, response }
  }

  it('skips fetchNextPage progress for a hasNextPage-only consumer', async () => {
    const { query, response } = seededInfiniteQuery('infinite.tracked.next')

    function Consumer() {
      const { hasNextPage, fetchNextPage } = useInfiniteQuery(query)
      return <button onClick={fetchNextPage}>{String(hasNextPage)}</button>
    }

    const { counter, getByRole } = renderCounted(<Consumer />, {
      scope: fork(),
    })
    await flush()

    // isFetching / isFetchingNextPage / data change; hasNextPage stays true.
    const commits = await commitsDuring(counter, async () => {
      fireEvent.click(getByRole('button'))
      await flush()
      response.last().resolve([3, 4])
      await flush()
    })
    expect(commits).toBe(0)
  })

  it('re-renders on isFetchingNextPage when it is read', async () => {
    const { query, response } = seededInfiniteQuery('infinite.tracked.flag')

    function Consumer() {
      const { isFetchingNextPage, fetchNextPage } = useInfiniteQuery(query)
      return (
        <button onClick={fetchNextPage}>
          {isFetchingNextPage ? 'loading more' : 'idle'}
        </button>
      )
    }

    const { counter, getByRole, getByText } = renderCounted(<Consumer />, {
      scope: fork(),
    })
    await flush()

    const commits = await commitsDuring(counter, async () => {
      fireEvent.click(getByRole('button'))
      await flush()
      getByText('loading more')
      response.last().resolve([3, 4])
      await flush()
    })
    expect(commits).toBe(2)
    getByText('idle')
  })

  it("re-renders on every field with 'all'", async () => {
    const { query, response } = seededInfiniteQuery('infinite.all')

    function Consumer() {
      const { hasNextPage, fetchNextPage } = useInfiniteQuery(query, {
        notifyOnChangeProps: 'all',
      })
      return <button onClick={fetchNextPage}>{String(hasNextPage)}</button>
    }

    const { counter, getByRole } = renderCounted(<Consumer />, {
      scope: fork(),
    })
    await flush()

    const commits = await commitsDuring(counter, async () => {
      fireEvent.click(getByRole('button'))
      await flush()
      response.last().resolve([3, 4])
      await flush()
    })
    expect(commits).toBeGreaterThan(0)
  })
})

describe('useMutation — notifyOnChangeProps', () => {
  let queryClient: QueryClient

  beforeEach(() => {
    queryClient = new QueryClient()
  })

  afterEach(() => {
    queryClient.clear()
  })

  function controlledMutation(name: string) {
    const response = controlledFn<string>()
    const mutation = createMutation<string, Error, string>(queryClient, {
      name,
      mutationFn: () => response.fn(),
    })
    return { mutation, response }
  }

  it('skips pending/variables updates for a data-only consumer', async () => {
    const { mutation, response } = controlledMutation('mutation.tracked')

    function Consumer() {
      const { data, mutate } = useMutation(mutation)
      return <button onClick={() => mutate('go')}>{data ?? 'none'}</button>
    }

    const { counter, getByRole, getByText } = renderCounted(<Consumer />, {
      scope: fork(),
    })
    await flush()

    const startCommits = await commitsDuring(counter, async () => {
      fireEvent.click(getByRole('button'))
      await flush()
    })
    expect(startCommits).toBe(0)

    const doneCommits = await commitsDuring(counter, async () => {
      response.last().resolve('done')
      await flush()
    })
    expect(doneCommits).toBe(1)
    getByText('done')
  })

  it('re-renders on isPending when it is read', async () => {
    const { mutation, response } = controlledMutation('mutation.tracked.pending')

    function Consumer() {
      const { isPending, mutate } = useMutation(mutation)
      return (
        <button onClick={() => mutate('go')}>
          {isPending ? 'saving' : 'idle'}
        </button>
      )
    }

    const { counter, getByRole, getByText } = renderCounted(<Consumer />, {
      scope: fork(),
    })
    await flush()

    const commits = await commitsDuring(counter, async () => {
      fireEvent.click(getByRole('button'))
      await flush()
      getByText('saving')
      response.last().resolve('done')
      await flush()
    })
    expect(commits).toBe(2)
    getByText('idle')
  })

  it("re-renders on mutation start with 'all'", async () => {
    const { mutation } = controlledMutation('mutation.all')

    function Consumer() {
      const { data, mutate } = useMutation(mutation, {
        notifyOnChangeProps: 'all',
      })
      return <button onClick={() => mutate('go')}>{data ?? 'none'}</button>
    }

    const { counter, getByRole } = renderCounted(<Consumer />, {
      scope: fork(),
    })
    await flush()

    const commits = await commitsDuring(counter, async () => {
      fireEvent.click(getByRole('button'))
      await flush()
    })
    expect(commits).toBeGreaterThan(0)
  })
})
