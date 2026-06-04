'use client'

import * as React from 'react'
import { useUnit } from 'effector-react'
import { useSuspenseQueries } from '@effector-tanstack-query/react'
import { $team, teamQueries, teamUpdated } from '@/model/team'

const ROSTER = [
  'pikachu',
  'bulbasaur',
  'charmander',
  'squirtle',
  'mewtwo',
  'snorlax',
] as const

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

function TeamCards() {
  // Past the Suspense gate, every item.data is non-nullable Pokemon.
  const items = useSuspenseQueries(teamQueries)
  return (
    <div className="list" style={{ display: 'grid', gap: 8 }}>
      {items.map((item) => (
        <div
          key={item.data.id}
          className="list-item"
          style={{ padding: 8 }}
        >
          <div className="row">
            {item.data.sprites.front_default && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={item.data.sprites.front_default}
                alt={item.data.name}
                width={56}
              />
            )}
            <div>
              <strong>{item.data.name}</strong>
              {item.isFetching && (
                <span className="badge pending"> refetching…</span>
              )}
              <div className="muted">
                types: {item.data.types.map((t) => t.type.name).join(', ')}
              </div>
            </div>
            <button onClick={item.refresh} style={{ marginLeft: 'auto' }}>
              refresh
            </button>
          </div>
        </div>
      ))}
    </div>
  )
}

export function TeamBody() {
  const [team, setTeam] = useUnit([$team, teamUpdated])

  function toggle(name: string) {
    setTeam(
      team.includes(name) ? team.filter((n) => n !== name) : [...team, name],
    )
  }

  return (
    <main className="main">
      <h1>SSR + createQueries + Suspense</h1>
      <p className="muted">
        The default team is <strong>prefetched on the server</strong> via
        the family's <code>prefetch</code> event — server HTML renders the
        cards with data, no Suspense fallback. Toggle pokemon from the
        roster to add or remove members. Adding a name that's not yet
        in the cache re-suspends only until that one queryFn resolves
        (rest of the team stays rendered).
      </p>

      <section className="card">
        <h3>Roster</h3>
        <div className="row" style={{ flexWrap: 'wrap', gap: 6 }}>
          {ROSTER.map((name) => (
            <label key={name}>
              <input
                type="checkbox"
                checked={team.includes(name)}
                onChange={() => toggle(name)}
              />
              {name}
            </label>
          ))}
        </div>
      </section>

      <section className="card" style={{ marginTop: 12 }}>
        <h3>Team ({team.length})</h3>
        <ErrorBoundary resetKey={team.join(',')}>
          <React.Suspense
            fallback={<div className="badge pending">loading team…</div>}
          >
            <TeamCards />
          </React.Suspense>
        </ErrorBoundary>
      </section>

      <h3>How it's wired</h3>
      <pre>{`// src/model/team.ts
export const $team = createStore<string[]>(['pikachu', 'bulbasaur', 'charmander'], {
  name: 'team.list', sid: 'team.list',
})
export const teamQueries = createQueries({
  name: 'team.queries',
  source: $team,
  query: (name) => ({
    queryKey: ['team-pokemon', name],
    queryFn: () => fetchPokemonByName(name),
  }),
  staleTime: 60_000,
})

// app/team/page.tsx (server)
await prefetchQueries([teamQueries], { scope })

// app/team/page.client.tsx (client)
function TeamCards() {
  const items = useSuspenseQueries(teamQueries)
  return items.map((it) => <Card key={it.data.id} data={it.data} />)
}`}</pre>
    </main>
  )
}
