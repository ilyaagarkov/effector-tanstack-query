import { createEvent, createStore } from 'effector'
import { useUnit } from 'effector-react'
import { createQuery } from '@effector-tanstack-query/core'
import { useQuery } from '@effector-tanstack-query/react'
import { fetchPokemonByName } from '../model/api'

const POLL_MS = 3000

// `refetchInterval` accepts `Store<number | false>` directly — toggling the
// store starts / stops polling without unmounting the query.
const togglePolling = createEvent()
const $interval = createStore<number | false>(POLL_MS).on(togglePolling, (v) =>
  v === false ? POLL_MS : false,
)

const pokemonQuery = createQuery({
  name: 'polling.pokemon',
  queryKey: ['pokemon', 'pikachu'],
  queryFn: () => fetchPokemonByName('pikachu'),
  refetchInterval: $interval,
})

export function PollingPage() {
  const { data, isFetching, fetchStatus } = useQuery(pokemonQuery)
  const [interval, toggle] = useUnit([$interval, togglePolling])

  return (
    <>
      <h2>Polling — reactive refetchInterval</h2>
      <p className="muted">
        Pass a <code>Store&lt;number | false&gt;</code> to{' '}
        <code>refetchInterval</code> and toggling the store starts/stops
        polling — the library calls <code>observer.setOptions</code> under
        the hood. No component-level glue.
      </p>

      <div className="card">
        <div className="row">
          <button onClick={toggle}>
            {interval === false ? 'start polling' : 'stop polling'}
          </button>
          <span className="badge">
            interval: {interval === false ? 'off' : `${interval} ms`}
          </span>
          <span
            className={
              fetchStatus === 'fetching' ? 'badge pending' : 'badge'
            }
          >
            fetchStatus: {fetchStatus}
          </span>
          {isFetching && <span className="muted">↻</span>}
        </div>

        {data && (
          <p>
            <strong>{data.name}</strong> — height {data.height}, weight{' '}
            {data.weight}
          </p>
        )}
        <p className="muted">
          Watch the network tab — a fetch fires every {POLL_MS / 1000}s while
          polling is on.
        </p>
      </div>

      <pre>{`const $interval = createStore<number | false>(3000)
  .on(togglePolling, (v) => v === false ? 3000 : false)

const pokemonQuery = createQuery({
  queryKey: ['pokemon', 'pikachu'],
  queryFn: () => fetchPokemonByName('pikachu'),
  refetchInterval: $interval,   // ← reactive
})`}</pre>
    </>
  )
}
