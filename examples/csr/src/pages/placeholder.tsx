import { createEvent, createStore } from 'effector'
import { useUnit } from 'effector-react'
import { keepPreviousData } from '@tanstack/query-core'
import { createQuery } from '@effector-tanstack-query/core'
import { useQuery } from '@effector-tanstack-query/react'
import { fetchPokemonList } from '../model/api'

const PAGE_SIZE = 20

const nextPage = createEvent()
const prevPage = createEvent()
const $page = createStore(0)
  .on(nextPage, (p) => p + 1)
  .on(prevPage, (p) => Math.max(0, p - 1))

const listQuery = createQuery({
  name: 'placeholder.list',
  queryKey: ['pokemon-list', $page],
  queryFn: ({ queryKey }) => {
    const page = queryKey[1]
    return fetchPokemonList(PAGE_SIZE, page * PAGE_SIZE)
  },
  // While fetching the next page, keep showing the previous page's data —
  // $isPlaceholderData lets the UI mark it as stale.
  placeholderData: keepPreviousData,
})

export function PlaceholderPage() {
  const { data, isPlaceholderData, isFetching } = useQuery(listQuery)
  const [page, next, prev] = useUnit([$page, nextPage, prevPage])

  return (
    <>
      <h2>placeholderData — keepPreviousData</h2>
      <p className="muted">
        With <code>keepPreviousData</code>, the previous results stay on screen
        while the new ones load. <code>$isPlaceholderData</code> tells you when
        you're looking at the old data.
      </p>

      <div className="card">
        <div className="row">
          <button onClick={prev} disabled={page === 0 || isFetching}>
            ← prev
          </button>
          <span>page {page + 1}</span>
          <button onClick={next} disabled={isFetching}>
            next →
          </button>
          {isPlaceholderData && (
            <span className="badge pending">showing previous page</span>
          )}
        </div>

        {data && (
          <div
            className="list"
            style={{
              marginTop: 12,
              opacity: isPlaceholderData ? 0.5 : 1,
              transition: 'opacity 120ms',
            }}
          >
            {data.results.map((p) => (
              <div key={p.name} className="list-item">
                {p.name}
              </div>
            ))}
          </div>
        )}
      </div>

      <pre>{`createQuery({
  queryKey: ['pokemon-list', $page],
  queryFn: ...,
  placeholderData: keepPreviousData,   // ← from @tanstack/query-core
})

// $isPlaceholderData becomes true while new data is fetching.`}</pre>
    </>
  )
}
