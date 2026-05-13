import { createInfiniteQuery } from '@effector-tanstack-query/core'
import { useInfiniteQuery } from '@effector-tanstack-query/react'
import { fetchPokemonList } from '../model/api'

const PAGE_SIZE = 20

interface PageParam {
  offset: number
}

const listQuery = createInfiniteQuery({
  name: 'infinite.list',
  queryKey: ['pokemon-infinite'],
  queryFn: ({ pageParam }) =>
    fetchPokemonList(PAGE_SIZE, (pageParam as PageParam).offset),
  initialPageParam: { offset: 0 } as PageParam,
  getNextPageParam: (lastPage, _allPages, lastParam) =>
    lastPage.next ? { offset: (lastParam as PageParam).offset + PAGE_SIZE } : undefined,
})

export function InfinitePage() {
  const { data, hasNextPage, isFetchingNextPage, fetchNextPage } =
    useInfiniteQuery(listQuery)

  const all = data?.pages.flatMap((p) => p.results) ?? []

  return (
    <>
      <h2>Infinite query</h2>
      <p className="muted">
        <code>createInfiniteQuery</code> appends pages on{' '}
        <code>fetchNextPage()</code>. <code>$hasNextPage</code> tracks whether
        there's more to load (computed via <code>getNextPageParam</code>).
      </p>

      <div className="card">
        <div className="list">
          {all.map((p) => (
            <div key={p.name} className="list-item">
              {p.name}
            </div>
          ))}
        </div>
        <div className="row" style={{ marginTop: 16 }}>
          <button
            onClick={() => fetchNextPage()}
            disabled={!hasNextPage || isFetchingNextPage}
          >
            {isFetchingNextPage
              ? 'loading…'
              : hasNextPage
                ? 'load more'
                : 'no more pages'}
          </button>
          <span className="muted">
            loaded {all.length} of {data?.pages[0]?.count ?? '…'}
          </span>
        </div>
      </div>

      <pre>{`const listQuery = createInfiniteQuery({
  queryKey: ['pokemon-infinite'],
  queryFn: ({ pageParam }) => fetchPokemonList(20, pageParam.offset),
  initialPageParam: { offset: 0 },
  getNextPageParam: (lastPage, _all, lastParam) =>
    lastPage.next ? { offset: lastParam.offset + 20 } : undefined,
})

const { data, hasNextPage, fetchNextPage } = useInfiniteQuery(listQuery)`}</pre>
    </>
  )
}
