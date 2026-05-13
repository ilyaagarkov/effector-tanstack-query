import { createQuery } from '@effector-tanstack-query/core'
import { useQuery } from '@effector-tanstack-query/react'
import { fetchPokemonByName } from '../model/api'

const pokemonQuery = createQuery({
  name: 'basic.pokemon',
  queryKey: ['pokemon', 'ditto'],
  queryFn: () => fetchPokemonByName('ditto'),
})

export function BasicPage() {
  const { data, isPending, isFetching, error, refresh } = useQuery(pokemonQuery)

  return (
    <>
      <h2>Basic query</h2>
      <p className="muted">
        <code>createQuery</code> + <code>useQuery</code>. The factory uses the
        default <code>$queryClient</code> registered in <code>main.tsx</code>.
      </p>

      <div className="card">
        <div className="row">
          <strong>ditto</strong>
          {isFetching && <span className="badge pending">fetching…</span>}
          <button onClick={refresh} disabled={isFetching}>
            refresh
          </button>
        </div>

        {isPending && <p>Loading…</p>}
        {error && <p style={{ color: '#d16a6a' }}>Error: {error.message}</p>}
        {data && (
          <div className="row" style={{ marginTop: 12 }}>
            {data.sprites.front_default && (
              <img src={data.sprites.front_default} alt={data.name} width={96} />
            )}
            <div>
              <div>height: {data.height}</div>
              <div>weight: {data.weight}</div>
              <div>
                types: {data.types.map((t) => t.type.name).join(', ')}
              </div>
            </div>
          </div>
        )}
      </div>

      <pre>{`const pokemonQuery = createQuery({
  name: 'basic.pokemon',
  queryKey: ['pokemon', 'ditto'],
  queryFn: () => fetchPokemonByName('ditto'),
})

const { data, isPending, refresh } = useQuery(pokemonQuery)`}</pre>
    </>
  )
}
