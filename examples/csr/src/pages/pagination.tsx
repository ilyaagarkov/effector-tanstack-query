import { createEvent, createStore } from 'effector'
import { useUnit } from 'effector-react'
import { createQuery } from '@effector-tanstack-query/core'
import { useQuery } from '@effector-tanstack-query/react'
import { fetchPokemonList } from '../model/api'

const PAGE_SIZE = 20

const nextPage = createEvent()
const prevPage = createEvent()
const $page = createStore(0)
  .on(nextPage, (p) => p + 1)
  .on(prevPage, (p) => Math.max(0, p - 1))

// A Store inside queryKey turns the query into a reactive thing. Whenever
// $page changes, the observer re-fetches with the new offset.
const listQuery = createQuery({
  name: 'pagination.list',
  queryKey: ['pokemon-list', $page],
  queryFn: ({ queryKey }) => {
    const page = queryKey[1] as number
    return fetchPokemonList(PAGE_SIZE, page * PAGE_SIZE)
  },
})

export function PaginationPage() {
  const { data, isFetching, error } = useQuery(listQuery)
  const [page, next, prev] = useUnit([$page, nextPage, prevPage])

  return (
    <>
      <h2>Reactive query key — pagination</h2>
      <p className="muted">
        A <code>Store</code> dropped into <code>queryKey</code> drives refetch
        on change. No <code>useEffect</code> in the component — the model owns
        the reactive wire.
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
          {isFetching && <span className="badge pending">fetching…</span>}
        </div>

        {error && <p style={{ color: '#d16a6a' }}>{error.message}</p>}

        {data && (
          <div className="list" style={{ marginTop: 12 }}>
            {data.results.map((p) => (
              <div key={p.name} className="list-item">
                {p.name}
              </div>
            ))}
          </div>
        )}
      </div>

      <pre>{`const $page = createStore(0).on(nextPage, (p) => p + 1)

const listQuery = createQuery({
  queryKey: ['pokemon-list', $page],   // ← reactive
  queryFn: ({ queryKey }) => fetchPokemonList(20, (queryKey[1] as number) * 20),
})`}</pre>
    </>
  )
}
