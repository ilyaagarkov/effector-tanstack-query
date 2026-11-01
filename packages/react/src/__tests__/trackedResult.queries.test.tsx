// Issue #27 for the multi-query hooks: tracking is per item and per field.
// Reading `results[0].data` must not subscribe the component to `data` of
// the other items, nor to any `isFetching`. Changes to the list itself —
// a different tuple, a family source adding items — always re-render.
//
// Counting and fetch-control helpers live in ./tracked-utils.
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { render } from '@testing-library/react'
import * as React from 'react'
import { Provider } from 'effector-react'
import { allSettled, createEvent, createStore, fork, sample } from 'effector'
import type { StoreWritable } from 'effector'
import { QueryClient } from '@tanstack/query-core'
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
  createQueries,
  createQuery,
} from '@effector-tanstack-query/core'
import { useQueries, useSuspenseQueries } from '..'

function Gate({ children }: { children: React.ReactNode }) {
  return (
    <React.Suspense fallback={<span>loading</span>}>{children}</React.Suspense>
  )
}

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

/** Seeded, never-stale query with its own controlled responses. */
function seededQuery(name: string, id: number) {
  const key = queryKey()
  const response = controlledFn<Todo>()
  queryClient.setQueryData(key, { id })
  const query = createQuery(queryClient, {
    name,
    queryKey: key,
    queryFn: response.fn,
    staleTime: Infinity,
  })
  return { key, query, response }
}

type Seeded = ReturnType<typeof seededQuery>

/** Background refetch, with start and completion in separate commits. */
async function backgroundRefetch(q: Seeded, data: Todo) {
  void queryClient.refetchQueries({ queryKey: q.key, exact: true })
  await flush()
  q.response.last().resolve(data)
  await flush()
}

/**
 * Family over `$ids`, every item seeded with `{ id }` and backed by its own
 * controlled responses.
 */
function seededFamily(name: string, ids: number[]) {
  const prefix = queryKey()[0]!
  const $ids: StoreWritable<number[]> = createStore(ids)
  const setIds = createEvent<number[]>()
  sample({ clock: setIds, target: $ids })
  const responses = new Map<number, ReturnType<typeof controlledFn<Todo>>>()
  const responseFor = (id: number) => {
    if (!responses.has(id)) responses.set(id, controlledFn<Todo>())
    return responses.get(id)!
  }
  const keyFor = (id: number) => [prefix, id]
  for (const id of ids) queryClient.setQueryData(keyFor(id), { id })

  const family = createQueries<number, Todo>({
    name,
    source: $ids,
    query: (id) => ({
      queryKey: keyFor(id),
      queryFn: () => responseFor(id).fn(),
      staleTime: Infinity,
    }),
  })
  const scope = fork({ values: [[$queryClient, queryClient]] })

  const refetchItem = async (id: number, data: Todo) => {
    void queryClient.refetchQueries({ queryKey: keyFor(id), exact: true })
    await flush()
    responseFor(id).last().resolve(data)
    await flush()
  }
  return { setIds, family, scope, keyFor, responseFor, refetchItem }
}

describe('useQueries (tuple) — tracked result', () => {
  it('tracks fields per item', async () => {
    const first = seededQuery('queries.tuple.first', 1)
    const second = seededQuery('queries.tuple.second', 2)

    function Consumer() {
      const [a] = useQueries([first.query, second.query] as const)
      return <span>a: {a.data?.id}</span>
    }

    const { counter, getByText } = renderCounted(<Consumer />, {
      scope: fork(),
    })
    await flush()
    getByText('a: 1')

    // Unread item: neither its fetch state nor its data re-render.
    expect(
      await commitsDuring(counter, () =>
        backgroundRefetch(second, { id: 20 }),
      ),
    ).toBe(0)
    // Read item, identical data: fetch state isn't read.
    expect(
      await commitsDuring(counter, () => backgroundRefetch(first, { id: 1 })),
    ).toBe(0)
    // Read item, read field changed.
    expect(
      await commitsDuring(counter, () => backgroundRefetch(first, { id: 10 })),
    ).toBe(1)
    getByText('a: 10')
  })

  it('re-renders on a read flag of one item only', async () => {
    const first = seededQuery('queries.tuple.flag.first', 1)
    const second = seededQuery('queries.tuple.flag.second', 2)

    function Consumer() {
      const [, b] = useQueries([first.query, second.query] as const)
      return <span>{b.isFetching ? 'b fetching' : 'b idle'}</span>
    }

    const { counter, getByText } = renderCounted(<Consumer />, {
      scope: fork(),
    })
    await flush()

    expect(
      await commitsDuring(counter, () => backgroundRefetch(first, { id: 1 })),
    ).toBe(0)
    expect(
      await commitsDuring(counter, () => backgroundRefetch(second, { id: 2 })),
    ).toBe(2)
    getByText('b idle')
  })

  it('tracks the same field across items read in a map()', async () => {
    const first = seededQuery('queries.tuple.map.first', 1)
    const second = seededQuery('queries.tuple.map.second', 2)

    function Consumer() {
      const results = useQueries([first.query, second.query] as const)
      return <span>{results.map((r) => r.data?.id).join(',')}</span>
    }

    const { counter, getByText } = renderCounted(<Consumer />, {
      scope: fork(),
    })
    await flush()
    getByText('1,2')

    expect(
      await commitsDuring(counter, () => backgroundRefetch(second, { id: 2 })),
    ).toBe(0)
    expect(
      await commitsDuring(counter, () => backgroundRefetch(second, { id: 3 })),
    ).toBe(1)
    getByText('1,3')
  })

  it('tracks a newly added item once the tuple grows', async () => {
    const first = seededQuery('queries.tuple.grow.first', 1)
    const second = seededQuery('queries.tuple.grow.second', 2)

    function Consumer({ queries }: { queries: ReadonlyArray<Seeded['query']> }) {
      const results = useQueries(queries)
      return <span>{results.map((r) => r.data?.id).join(',')}</span>
    }

    const scope = fork()
    const counter: Counter = { commits: 0 }
    const tree = (queries: ReadonlyArray<Seeded['query']>) => (
      <Provider value={scope}>
        <Counted counter={counter}>
          <Consumer queries={queries} />
        </Counted>
      </Provider>
    )

    const { getByText, rerender } = render(tree([first.query]))
    await flush()
    getByText('1')

    rerender(tree([first.query, second.query]))
    await flush()
    getByText('1,2')

    expect(
      await commitsDuring(counter, () => backgroundRefetch(second, { id: 5 })),
    ).toBe(1)
    getByText('1,5')
  })

  it("re-renders on every field with 'all'", async () => {
    const first = seededQuery('queries.tuple.all.first', 1)
    const second = seededQuery('queries.tuple.all.second', 2)

    function Consumer() {
      const [a] = useQueries([first.query, second.query] as const, {
        notifyOnChangeProps: 'all',
      })
      return <span>a: {a.data?.id}</span>
    }

    const { counter } = renderCounted(<Consumer />, { scope: fork() })
    await flush()

    expect(
      await commitsDuring(counter, () => backgroundRefetch(second, { id: 2 })),
    ).toBe(2)
  })
})

describe('useQueries (family) — tracked result', () => {
  it('skips fetch state of items when only data is read', async () => {
    const f = seededFamily('queries.family.data', [1, 2])

    function Consumer() {
      const items = useQueries(f.family)
      return <span>{items.map((it) => it.data?.id).join(',')}</span>
    }

    const { counter, getByText } = renderCounted(<Consumer />, {
      scope: f.scope,
    })
    await flush()
    getByText('1,2')

    expect(
      await commitsDuring(counter, () => f.refetchItem(2, { id: 2 })),
    ).toBe(0)
    expect(
      await commitsDuring(counter, () => f.refetchItem(2, { id: 7 })),
    ).toBe(1)
    getByText('1,7')
  })

  it('tracks fields per item', async () => {
    const f = seededFamily('queries.family.perItem', [1, 2])

    function Consumer() {
      const items = useQueries(f.family)
      return <span>first: {items[0]?.data?.id}</span>
    }

    const { counter, getByText } = renderCounted(<Consumer />, {
      scope: f.scope,
    })
    await flush()
    getByText('first: 1')

    expect(
      await commitsDuring(counter, () => f.refetchItem(2, { id: 9 })),
    ).toBe(0)
    expect(
      await commitsDuring(counter, () => f.refetchItem(1, { id: 8 })),
    ).toBe(1)
    getByText('first: 8')
  })

  it('re-renders when the source adds or removes items', async () => {
    const f = seededFamily('queries.family.source', [1, 2])
    queryClient.setQueryData(f.keyFor(3), { id: 3 })

    function Consumer() {
      const items = useQueries(f.family)
      return <span>{items.map((it) => it.data?.id).join(',')}</span>
    }

    const { getByText } = renderCounted(<Consumer />, { scope: f.scope })
    await flush()
    getByText('1,2')

    await allSettled(f.setIds, { scope: f.scope, params: [1, 2, 3] })
    await flush()
    getByText('1,2,3')

    await allSettled(f.setIds, { scope: f.scope, params: [3] })
    await flush()
    getByText('3')
  })

  it("re-renders on every field with 'all'", async () => {
    const f = seededFamily('queries.family.all', [1, 2])

    function Consumer() {
      const items = useQueries(f.family, { notifyOnChangeProps: 'all' })
      return <span>{items.map((it) => it.data?.id).join(',')}</span>
    }

    const { counter } = renderCounted(<Consumer />, { scope: f.scope })
    await flush()

    expect(
      await commitsDuring(counter, () => f.refetchItem(2, { id: 2 })),
    ).toBeGreaterThan(0)
  })
})

describe('useSuspenseQueries (tuple) — tracked result', () => {
  it('tracks fields per item past the Suspense gate', async () => {
    const first = seededQuery('suspenseQueries.tuple.first', 1)
    const second = seededQuery('suspenseQueries.tuple.second', 2)

    function Consumer() {
      const [a] = useSuspenseQueries([first.query, second.query] as const)
      return <span>a: {a.data.id}</span>
    }

    const { counter, getByText } = renderCounted(
      <Gate>
        <Consumer />
      </Gate>,
      { scope: fork() },
    )
    await flush()
    getByText('a: 1')

    expect(
      await commitsDuring(counter, () => backgroundRefetch(second, { id: 20 })),
    ).toBe(0)
    expect(
      await commitsDuring(counter, () => backgroundRefetch(first, { id: 1 })),
    ).toBe(0)
    expect(
      await commitsDuring(counter, () => backgroundRefetch(first, { id: 10 })),
    ).toBe(1)
    getByText('a: 10')
  })

  it('re-renders on a read isFetching', async () => {
    const first = seededQuery('suspenseQueries.tuple.flag.first', 1)
    const second = seededQuery('suspenseQueries.tuple.flag.second', 2)

    function Consumer() {
      const [, b] = useSuspenseQueries([first.query, second.query] as const)
      return <span>{b.isFetching ? 'b fetching' : 'b idle'}</span>
    }

    const { counter, getByText } = renderCounted(
      <Gate>
        <Consumer />
      </Gate>,
      { scope: fork() },
    )
    await flush()

    expect(
      await commitsDuring(counter, () => backgroundRefetch(first, { id: 1 })),
    ).toBe(0)
    expect(
      await commitsDuring(counter, () => backgroundRefetch(second, { id: 2 })),
    ).toBe(2)
    getByText('b idle')
  })

  it('suspends when an unread item goes back to pending', async () => {
    const first = seededQuery('suspenseQueries.tuple.reset.first', 1)
    const second = seededQuery('suspenseQueries.tuple.reset.second', 2)

    function Consumer() {
      const [a] = useSuspenseQueries([first.query, second.query] as const)
      return <span>a: {a.data.id}</span>
    }

    const { getByText } = renderCounted(
      <Gate>
        <Consumer />
      </Gate>,
      { scope: fork() },
    )
    await flush()
    getByText('a: 1')

    void queryClient.resetQueries({ queryKey: second.key, exact: true })
    await flush()
    getByText('loading')

    second.response.last().resolve({ id: 2 })
    await flush()
    getByText('a: 1')
  })

  it("re-renders on every field with 'all'", async () => {
    const first = seededQuery('suspenseQueries.tuple.all.first', 1)
    const second = seededQuery('suspenseQueries.tuple.all.second', 2)

    function Consumer() {
      const [a] = useSuspenseQueries([first.query, second.query] as const, {
        notifyOnChangeProps: 'all',
      })
      return <span>a: {a.data.id}</span>
    }

    const { counter } = renderCounted(
      <Gate>
        <Consumer />
      </Gate>,
      { scope: fork() },
    )
    await flush()

    expect(
      await commitsDuring(counter, () => backgroundRefetch(second, { id: 2 })),
    ).toBeGreaterThan(0)
  })
})

describe('useSuspenseQueries (family) — tracked result', () => {
  it('skips fetch state of items when only data is read', async () => {
    const f = seededFamily('suspenseQueries.family.data', [1, 2])

    function Consumer() {
      const items = useSuspenseQueries(f.family)
      return <span>{items.map((it) => it.data.id).join(',')}</span>
    }

    const { counter, getByText } = renderCounted(
      <Gate>
        <Consumer />
      </Gate>,
      { scope: f.scope },
    )
    await flush()
    getByText('1,2')

    expect(
      await commitsDuring(counter, () => f.refetchItem(2, { id: 2 })),
    ).toBe(0)
    expect(
      await commitsDuring(counter, () => f.refetchItem(2, { id: 7 })),
    ).toBe(1)
    getByText('1,7')
  })

  it('suspends for an added item that has no data yet', async () => {
    const f = seededFamily('suspenseQueries.family.add', [1])

    function Consumer() {
      const items = useSuspenseQueries(f.family)
      return <span>{items.map((it) => it.data.id).join(',')}</span>
    }

    const { getByText } = renderCounted(
      <Gate>
        <Consumer />
      </Gate>,
      { scope: f.scope },
    )
    await flush()
    getByText('1')

    void allSettled(f.setIds, { scope: f.scope, params: [1, 2] })
    await flush()
    getByText('loading')

    f.responseFor(2).last().resolve({ id: 2 })
    await flush()
    getByText('1,2')
  })

  it("re-renders on every field with 'all'", async () => {
    const f = seededFamily('suspenseQueries.family.all', [1, 2])

    function Consumer() {
      const items = useSuspenseQueries(f.family, {
        notifyOnChangeProps: 'all',
      })
      return <span>{items.map((it) => it.data.id).join(',')}</span>
    }

    const { counter } = renderCounted(
      <Gate>
        <Consumer />
      </Gate>,
      { scope: f.scope },
    )
    await flush()

    expect(
      await commitsDuring(counter, () => f.refetchItem(2, { id: 2 })),
    ).toBeGreaterThan(0)
  })
})
