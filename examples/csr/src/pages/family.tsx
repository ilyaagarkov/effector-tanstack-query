import { createEvent, createStore } from 'effector'
import { useUnit } from 'effector-react'
import { createQueries } from '@effector-tanstack-query/core'
import { useQueries } from '@effector-tanstack-query/react'
import { fetchPokemonByName } from '../model/api'

// A reactive list of pokemon names. Toggle items in/out of `$team` and the
// family adds/disposes observers accordingly.
const togglePokemon = createEvent<string>()
const $team = createStore<string[]>(['pikachu', 'bulbasaur']).on(
  togglePokemon,
  (current, name) =>
    current.includes(name)
      ? current.filter((n) => n !== name)
      : [...current, name],
)

const ROSTER = [
  'pikachu',
  'bulbasaur',
  'charmander',
  'squirtle',
  'mewtwo',
  'snorlax',
] as const

// `createQueries` builds one observer per item in `$team`. Adding a pokemon
// spawns its observer; removing one disposes it. Re-ordering keeps existing
// observers — only `$items` re-projects.
const teamQueries = createQueries({
  name: 'family.team',
  source: $team,
  query: (name) => ({
    queryKey: ['pokemon', name],
    queryFn: () => fetchPokemonByName(name),
  }),
  staleTime: 60_000,
})

export function FamilyPage() {
  const [team, toggle] = useUnit([$team, togglePokemon])
  // `useQueries(family)` returns one `UseQueryResult` per source item,
  // in order. The hook handles `mounted` / `unmounted` for the family.
  const items = useQueries(teamQueries)

  return (
    <>
      <h2>Query families</h2>
      <p className="muted">
        One factory <code>teamQueries</code>, one parallel query per item in
        the <code>$team</code> store. Toggle pokemon in/out — observers
        spawn / dispose automatically. <code>useQueries(teamQueries)</code>
        returns one slot per source element, in order.
      </p>

      <div className="card">
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

        <div
          className="list"
          style={{ marginTop: 12, display: 'grid', gap: 8 }}
        >
          {items.map((item, i) => (
            <div key={team[i]} className="list-item" style={{ padding: 8 }}>
              {item.isPending ? (
                <span className="badge pending">loading {team[i]}…</span>
              ) : item.error ? (
                <span style={{ color: '#d16a6a' }}>
                  {team[i]}: {item.error.message}
                </span>
              ) : item.data ? (
                <div className="row">
                  {item.data.sprites.front_default && (
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
                    refresh just this one
                  </button>
                </div>
              ) : null}
            </div>
          ))}
        </div>
      </div>

      <pre>{`const $team = createStore<string[]>(['pikachu', 'bulbasaur'])

const teamQueries = createQueries({
  name: 'family.team',
  source: $team,
  query: (name) => ({
    queryKey: ['pokemon', name],
    queryFn: () => fetchPokemonByName(name),
  }),
})

function Page() {
  const items = useQueries(teamQueries)   // one slot per source item
  return items.map((it, i) =>
    it.isPending ? <Skeleton key={i} /> : <Card data={it.data!} />
  )
}`}</pre>
    </>
  )
}
