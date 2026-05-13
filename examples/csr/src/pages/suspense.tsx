import * as React from 'react'
import { createEvent, createStore } from 'effector'
import { useUnit } from 'effector-react'
import { createQuery } from '@effector-tanstack-query/core'
import { useSuspenseQuery } from '@effector-tanstack-query/react'
import { fetchPokemonByName } from '../model/api'

const nameChanged = createEvent<string>()
const $name = createStore('bulbasaur').on(nameChanged, (_, n) => n)

const pokemonQuery = createQuery({
  name: 'suspense.pokemon',
  queryKey: ['pokemon', $name],
  queryFn: ({ queryKey }) => fetchPokemonByName(queryKey[1] as string),
  staleTime: 60_000,
})

class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { error: Error | null }
> {
  override state = { error: null as Error | null }
  static getDerivedStateFromError(error: Error) {
    return { error }
  }
  override render() {
    if (this.state.error) {
      return (
        <div className="badge error" style={{ display: 'block', padding: 12 }}>
          ErrorBoundary caught: {this.state.error.message}
        </div>
      )
    }
    return this.props.children
  }
}

function PokemonCard() {
  // No isPending / error branches needed — Suspense and ErrorBoundary cover
  // both. `data` is non-nullable; `isFetching` flips during background
  // refetch (same shape as react-query's useSuspenseQuery).
  const { data: pokemon, isFetching } = useSuspenseQuery(pokemonQuery)

  return (
    <div className="row">
      {pokemon.sprites.front_default && (
        <img src={pokemon.sprites.front_default} alt={pokemon.name} width={96} />
      )}
      <div>
        <strong>{pokemon.name}</strong>
        {isFetching && <span className="badge pending"> refetching…</span>}
        <div className="muted">
          height {pokemon.height} · weight {pokemon.weight}
        </div>
      </div>
    </div>
  )
}

export function SuspensePage() {
  const [name, setName] = useUnit([$name, nameChanged])

  return (
    <>
      <h2>useSuspenseQuery</h2>
      <p className="muted">
        The hook returns data directly — pending throws a promise (caught by{' '}
        <code>&lt;Suspense&gt;</code>), errors throw the error (caught by{' '}
        <code>&lt;ErrorBoundary&gt;</code>).
      </p>

      <div className="card">
        <div className="row" style={{ marginBottom: 12 }}>
          <label>name:</label>
          <select value={name} onChange={(e) => setName(e.target.value)}>
            {['bulbasaur', 'charmander', 'squirtle', 'pikachu', '__invalid__'].map(
              (n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ),
            )}
          </select>
          <span className="muted">
            __invalid__ triggers a 404 → ErrorBoundary
          </span>
        </div>

        <ErrorBoundary>
          <React.Suspense
            fallback={<div className="badge pending">loading…</div>}
          >
            <PokemonCard />
          </React.Suspense>
        </ErrorBoundary>
      </div>

      <pre>{`function PokemonCard() {
  const pokemon = useSuspenseQuery(pokemonQuery)  // ← throws promise / error
  return <Card pokemon={pokemon} />
}

<ErrorBoundary>
  <Suspense fallback={<Loading />}>
    <PokemonCard />
  </Suspense>
</ErrorBoundary>`}</pre>
    </>
  )
}
