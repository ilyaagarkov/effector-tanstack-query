'use client'

import * as React from 'react'
import { useUnit } from 'effector-react'
import { useSuspenseQuery } from '@effector-tanstack-query/react'
import {
  $suspenseName,
  suspenseNameSet,
  suspensePokemonQuery,
} from '@/model/suspense'

/**
 * Resets its own error state when `resetKey` changes, so the next
 * `useSuspenseQuery` attempt (for a new name) isn't immediately
 * masked by the previous error. Without this, picking 'pikachu' after
 * '__invalid__' would keep showing the error message.
 */
class ErrorBoundary extends React.Component<
  { children: React.ReactNode; resetKey: unknown },
  { error: Error | null }
> {
  override state = { error: null as Error | null }
  static getDerivedStateFromError(error: Error) {
    return { error }
  }
  override componentDidUpdate(prev: { resetKey: unknown }) {
    if (prev.resetKey !== this.props.resetKey && this.state.error) {
      this.setState({ error: null })
    }
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
  // No isPending / error branches needed — Suspense and ErrorBoundary
  // cover both. `data` is non-nullable; `isFetching` flips during
  // background refetch (same shape as react-query's useSuspenseQuery).
  const { data: pokemon, isFetching } = useSuspenseQuery(suspensePokemonQuery)

  return (
    <div className="row">
      {pokemon.sprites.front_default && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={pokemon.sprites.front_default}
          alt={pokemon.name}
          width={96}
        />
      )}
      <div>
        <strong>{pokemon.name}</strong>
        {isFetching && <span className="badge pending"> refetching…</span>}
        <div className="muted">
          height {pokemon.height} · weight {pokemon.weight}
        </div>
        <div className="muted">
          types: {pokemon.types.map((t) => t.type.name).join(', ')}
        </div>
      </div>
    </div>
  )
}

export function SuspenseBody() {
  const [name, setName] = useUnit([$suspenseName, suspenseNameSet])

  return (
    <main className="main">
      <h1>SSR + useSuspenseQuery</h1>
      <p className="muted">
        The default name <code>bulbasaur</code> is{' '}
        <strong>prefetched on the server</strong>; the server-rendered
        HTML contains the card with data, and on hydration{' '}
        <code>useSuspenseQuery</code> reads from the populated stores
        without ever showing the Suspense fallback. Picking another
        name from a fresh session is a cache miss — the hook throws an
        inflight promise, <code>&lt;Suspense&gt;</code> shows its
        fallback, the tree re-renders when the queryFn resolves.{' '}
        <code>__invalid__</code> throws a 404 caught by{' '}
        <code>&lt;ErrorBoundary&gt;</code>.
      </p>

      <section className="card">
        <div className="row" style={{ marginBottom: 12 }}>
          <label>name:</label>
          <select value={name} onChange={(e) => setName(e.target.value)}>
            {[
              'bulbasaur',
              'charmander',
              'squirtle',
              'pikachu',
              '__invalid__',
            ].map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        </div>

        <ErrorBoundary resetKey={name}>
          <React.Suspense
            fallback={<div className="badge pending">loading…</div>}
          >
            <PokemonCard />
          </React.Suspense>
        </ErrorBoundary>
      </section>

      <h3>How it's wired</h3>
      <pre>{`// src/model/suspense.ts
export const $suspenseName = createStore('bulbasaur', { name: 'suspense.name', sid: 'suspense.name' })
export const suspensePokemonQuery = createQuery({
  name: 'suspense.pokemon',
  queryKey: ['suspense-pokemon', $suspenseName],
  queryFn: ({ queryKey }) => fetchPokemonByName(queryKey[1]),
  staleTime: 60_000,
})

// app/suspense/page.tsx (server)
const { queryClient, scope } = makeRequestScope()
await prefetchQueries([suspensePokemonQuery], { scope })

<EffectorNext values={serialize(scope)}>
  <HydrationBoundary state={dehydrate(queryClient)} />   // side effect
  <SuspenseBody />                                       // consumer
</EffectorNext>

// app/suspense/page.client.tsx (client)
function PokemonCard() {
  const { data, isFetching } = useSuspenseQuery(suspensePokemonQuery)
  // data is non-nullable
}

<ErrorBoundary>
  <Suspense fallback={<Loading />}>
    <PokemonCard />
  </Suspense>
</ErrorBoundary>`}</pre>
    </main>
  )
}
