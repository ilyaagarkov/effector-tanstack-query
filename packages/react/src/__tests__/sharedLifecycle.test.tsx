import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { act, render, waitFor } from '@testing-library/react'
import * as React from 'react'
import { Provider } from 'effector-react'
import { allSettled, createEvent, fork, sample } from 'effector'
import type { Scope, Store } from 'effector'
import { QueryClient } from '@tanstack/query-core'
import type { QueryKey } from '@tanstack/query-core'
import {
  QueryClientProvider,
  useInfiniteQuery as useNativeInfiniteQuery,
  useQuery as useNativeQuery,
} from '@tanstack/react-query'
import { createInfiniteQuery, createQuery } from '@effector-tanstack-query/core'
import { useInfiniteQuery, useQuery } from '..'
import { queryKey } from './test-utils'

// Shared lifecycle (issue #19): unmounting one consumer of a query model must
// not tear down the observer while other consumers in the same scope remain.

type QueryModel = ReturnType<typeof createQuery<string>>
type InfiniteModel = ReturnType<
  typeof createInfiniteQuery<string, Error, number>
>
type Model = QueryModel | InfiniteModel

interface Variant {
  name: string
  create: (qc: QueryClient, key: Array<string>) => Model
  /** Adapter hook consumer; renders `${name}:${value}`. */
  Adapter: (props: { name: string; query: Model }) => React.ReactElement
  /** Native @tanstack/react-query consumer of the same key. */
  Native: (props: { name: string; queryKey: QueryKey }) => React.ReactElement
  set: (qc: QueryClient, key: QueryKey, value: string) => void
  read: (scope: Scope, query: Model) => unknown
}

const queryFn = () => Promise.resolve('initial')

const observerOf = (scope: Scope, query: Model) =>
  scope.getState(query.$observer as Store<unknown>)

const variants: Array<Variant> = [
  {
    name: 'createQuery',
    create: (qc, key) =>
      createQuery<string>(qc, {
        queryKey: key,
        queryFn,
        staleTime: Infinity,
      }),
    Adapter: ({ name, query }) => {
      const { data } = useQuery(query as QueryModel)
      return (
        <span>
          {name}:{data}
        </span>
      )
    },
    Native: ({ name, queryKey: key }) => {
      const { data } = useNativeQuery({
        queryKey: key,
        queryFn,
        staleTime: Infinity,
      })
      return (
        <span>
          {name}:{data}
        </span>
      )
    },
    set: (qc, key, value) => qc.setQueryData(key, value),
    read: (scope, query) => scope.getState((query as QueryModel).$data),
  },
  {
    name: 'createInfiniteQuery',
    create: (qc, key) =>
      createInfiniteQuery<string, Error, number>(qc, {
        queryKey: key,
        queryFn,
        initialPageParam: 0,
        getNextPageParam: () => undefined,
        staleTime: Infinity,
      }),
    Adapter: ({ name, query }) => {
      const { data } = useInfiniteQuery(query as InfiniteModel)
      return (
        <span>
          {name}:{data?.pages[0]}
        </span>
      )
    },
    Native: ({ name, queryKey: key }) => {
      const { data } = useNativeInfiniteQuery({
        queryKey: key,
        queryFn,
        initialPageParam: 0,
        getNextPageParam: () => undefined,
        staleTime: Infinity,
      })
      return (
        <span>
          {name}:{data?.pages[0]}
        </span>
      )
    },
    set: (qc, key, value) =>
      qc.setQueryData(key, { pages: [value], pageParams: [0] }),
    read: (scope, query) =>
      scope.getState((query as InfiniteModel).$data)?.pages[0],
  },
]

describe.each(variants)(
  'shared observer lifecycle (React, $name)',
  (variant) => {
    const { Adapter, Native } = variant
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

    function setup() {
      const key = queryKey()
      const query = variant.create(queryClient, key)
      return { key, query }
    }

    function setupFeature(query: Model) {
      const featureOpened = createEvent()
      const featureClosed = createEvent()
      sample({ clock: featureOpened, target: query.mounted })
      sample({ clock: featureClosed, target: query.unmounted })
      return { featureOpened, featureClosed }
    }

    it('keeps updating the remaining adapter consumer when another unmounts', async () => {
      const { key, query } = setup()
      const scope = fork()

      function App({ showA }: { showA: boolean }) {
        return (
          <>
            {showA && <Adapter name="A" query={query} />}
            <Adapter name="B" query={query} />
          </>
        )
      }

      const rendered = render(
        <Provider value={scope}>
          <App showA />
        </Provider>,
      )
      await waitFor(() => rendered.getByText('A:initial'))
      await waitFor(() => rendered.getByText('B:initial'))

      rendered.rerender(
        <Provider value={scope}>
          <App showA={false} />
        </Provider>,
      )

      expect(observerOf(scope, query)).not.toBeNull()
      act(() => {
        variant.set(queryClient, key, 'updated')
      })
      await waitFor(() => rendered.getByText('B:updated'))
    })

    it('releases the observer when the last adapter consumer unmounts', async () => {
      const { query } = setup()
      const scope = fork()

      const rendered = render(
        <Provider value={scope}>
          <Adapter name="A" query={query} />
          <Adapter name="B" query={query} />
        </Provider>,
      )
      await waitFor(() => rendered.getByText('B:initial'))

      rendered.unmount()
      expect(observerOf(scope, query)).toBeNull()
    })

    it('keeps the observer across StrictMode effect replays with a shared consumer', async () => {
      const { key, query } = setup()
      const scope = fork()

      function App({ showA }: { showA: boolean }) {
        return (
          <React.StrictMode>
            {showA && <Adapter name="A" query={query} />}
            <Adapter name="B" query={query} />
          </React.StrictMode>
        )
      }

      const rendered = render(
        <Provider value={scope}>
          <App showA />
        </Provider>,
      )
      await waitFor(() => rendered.getByText('B:initial'))

      rendered.rerender(
        <Provider value={scope}>
          <App showA={false} />
        </Provider>,
      )

      act(() => {
        variant.set(queryClient, key, 'updated')
      })
      await waitFor(() => rendered.getByText('B:updated'))

      rendered.unmount()
      expect(observerOf(scope, query)).toBeNull()
    })

    it('keeps the observer while a feature-owned lifecycle is still open', async () => {
      const { key, query } = setup()
      const scope = fork()
      const { featureOpened, featureClosed } = setupFeature(query)

      await allSettled(featureOpened, { scope })
      const rendered = render(
        <Provider value={scope}>
          <Adapter name="adapter" query={query} />
        </Provider>,
      )
      await waitFor(() => rendered.getByText('adapter:initial'))

      rendered.unmount()

      expect(observerOf(scope, query)).not.toBeNull()
      variant.set(queryClient, key, 'updated')
      expect(variant.read(scope, query)).toBe('updated')

      await allSettled(featureClosed, { scope })
      expect(observerOf(scope, query)).toBeNull()
    })

    it('keeps the adapter consumer updating when the feature closes first', async () => {
      const { key, query } = setup()
      const scope = fork()
      const { featureOpened, featureClosed } = setupFeature(query)

      await allSettled(featureOpened, { scope })
      const rendered = render(
        <Provider value={scope}>
          <Adapter name="adapter" query={query} />
        </Provider>,
      )
      await waitFor(() => rendered.getByText('adapter:initial'))

      await act(() => allSettled(featureClosed, { scope }))

      expect(observerOf(scope, query)).not.toBeNull()
      act(() => {
        variant.set(queryClient, key, 'updated')
      })
      await waitFor(() => rendered.getByText('adapter:updated'))

      rendered.unmount()
      expect(observerOf(scope, query)).toBeNull()
    })

    it('keeps a native consumer updating when another native consumer unmounts (control)', async () => {
      const { key } = setup()

      function App({ showA }: { showA: boolean }) {
        return (
          <>
            {showA && <Native name="A" queryKey={key} />}
            <Native name="B" queryKey={key} />
          </>
        )
      }

      const tree = (showA: boolean) => (
        <QueryClientProvider client={queryClient}>
          <App showA={showA} />
        </QueryClientProvider>
      )

      const rendered = render(tree(true))
      await waitFor(() => rendered.getByText('A:initial'))
      await waitFor(() => rendered.getByText('B:initial'))

      rendered.rerender(tree(false))

      act(() => {
        variant.set(queryClient, key, 'updated')
      })
      await waitFor(() => rendered.getByText('B:updated'))
    })

    it('does not count native observers as owners of the effector observer', async () => {
      const { key, query } = setup()
      const scope = fork()

      function App({ showAdapter }: { showAdapter: boolean }) {
        return (
          <>
            <Native name="native" queryKey={key} />
            {showAdapter && <Adapter name="adapter" query={query} />}
          </>
        )
      }

      const tree = (showAdapter: boolean) => (
        <QueryClientProvider client={queryClient}>
          <Provider value={scope}>
            <App showAdapter={showAdapter} />
          </Provider>
        </QueryClientProvider>
      )

      const rendered = render(tree(true))
      await waitFor(() => rendered.getByText('native:initial'))
      await waitFor(() => rendered.getByText('adapter:initial'))

      // Adapter was the only effector owner — its observer is released even
      // though a native observer on the same key is still active.
      rendered.rerender(tree(false))
      expect(observerOf(scope, query)).toBeNull()

      act(() => {
        variant.set(queryClient, key, 'updated')
      })
      await waitFor(() => rendered.getByText('native:updated'))
    })

    it('keeps the adapter consumer updating when a native consumer unmounts', async () => {
      const { key, query } = setup()
      const scope = fork()

      function App({ showNative }: { showNative: boolean }) {
        return (
          <>
            {showNative && <Native name="native" queryKey={key} />}
            <Adapter name="adapter" query={query} />
          </>
        )
      }

      const tree = (showNative: boolean) => (
        <QueryClientProvider client={queryClient}>
          <Provider value={scope}>
            <App showNative={showNative} />
          </Provider>
        </QueryClientProvider>
      )

      const rendered = render(tree(true))
      await waitFor(() => rendered.getByText('native:initial'))
      await waitFor(() => rendered.getByText('adapter:initial'))

      rendered.rerender(tree(false))

      act(() => {
        variant.set(queryClient, key, 'updated')
      })
      await waitFor(() => rendered.getByText('adapter:updated'))
    })

    it('keeps the feature-owned observer when a native consumer unmounts', async () => {
      const { key, query } = setup()
      const scope = fork()
      const { featureOpened } = setupFeature(query)

      await allSettled(featureOpened, { scope })
      const rendered = render(
        <QueryClientProvider client={queryClient}>
          <Native name="native" queryKey={key} />
        </QueryClientProvider>,
      )
      await waitFor(() => rendered.getByText('native:initial'))

      rendered.unmount()

      expect(observerOf(scope, query)).not.toBeNull()
      variant.set(queryClient, key, 'updated')
      expect(variant.read(scope, query)).toBe('updated')
    })

    it('keeps a native consumer updating when the feature-owned lifecycle closes', async () => {
      const { key, query } = setup()
      const scope = fork()
      const { featureOpened, featureClosed } = setupFeature(query)

      await allSettled(featureOpened, { scope })
      const rendered = render(
        <QueryClientProvider client={queryClient}>
          <Native name="native" queryKey={key} />
        </QueryClientProvider>,
      )
      await waitFor(() => rendered.getByText('native:initial'))

      await allSettled(featureClosed, { scope })
      expect(observerOf(scope, query)).toBeNull()

      act(() => {
        variant.set(queryClient, key, 'updated')
      })
      await waitFor(() => rendered.getByText('native:updated'))
    })
  },
)
