import { createEvent, createStore } from 'effector'
import { useUnit } from 'effector-react'
import { createQuery } from '@effector-tanstack-query/core'
import { useQuery } from '@effector-tanstack-query/react'
import { fetchAbilityByUrl, fetchPokemonByName } from '../model/api'

const nameChanged = createEvent<string>()
const $name = createStore('pikachu').on(nameChanged, (_, n) => n)

const pokemonQuery = createQuery({
  name: 'dependent.pokemon',
  queryKey: ['pokemon', $name],
  queryFn: ({ queryKey }) => fetchPokemonByName(queryKey[1] as string),
})

// The first ability's URL is derived from pokemon data. We expose it as a
// derived Store via .map — it becomes part of the abilityQuery's reactive key.
const $firstAbilityUrl = pokemonQuery.$data.map(
  (data) => data?.abilities[0]?.ability.url ?? null,
)

const abilityQuery = createQuery({
  name: 'dependent.ability',
  queryKey: ['ability', $firstAbilityUrl],
  queryFn: ({ queryKey }) => fetchAbilityByUrl(queryKey[1] as string),
  // Only run when the URL is known.
  enabled: pokemonQuery.$isSuccess,
})

export function DependentPage() {
  const [name, setName] = useUnit([$name, nameChanged])
  const pokemon = useQuery(pokemonQuery)
  const ability = useQuery(abilityQuery)

  const englishEntry = ability.data?.effect_entries.find(
    (e) => e.language.name === 'en',
  )

  return (
    <>
      <h2>Dependent queries</h2>
      <p className="muted">
        The second query's <code>enabled</code> is the first query's{' '}
        <code>$isSuccess</code> store, and its <code>queryKey</code> contains a
        derived store. No effect glue in the component.
      </p>

      <div className="card">
        <div className="row">
          <label>name:</label>
          <select value={name} onChange={(e) => setName(e.target.value)}>
            {['pikachu', 'bulbasaur', 'charmander', 'squirtle', 'ditto'].map(
              (n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ),
            )}
          </select>
        </div>

        <h4>Pokemon</h4>
        {pokemon.isPending && <p>Loading pokemon…</p>}
        {pokemon.error && (
          <p style={{ color: '#d16a6a' }}>{pokemon.error.message}</p>
        )}
        {pokemon.data && (
          <div className="row">
            {pokemon.data.sprites.front_default && (
              <img
                src={pokemon.data.sprites.front_default}
                alt={pokemon.data.name}
                width={64}
              />
            )}
            <strong>{pokemon.data.name}</strong>
          </div>
        )}

        <h4>First ability {ability.isFetching && '(loading…)'}</h4>
        {ability.data ? (
          <>
            <strong>{ability.data.name}</strong>
            {englishEntry && <p>{englishEntry.effect}</p>}
          </>
        ) : (
          <p className="muted">…waiting for pokemon to load</p>
        )}
      </div>

      <pre>{`const pokemonQuery = createQuery({ ... })
const $firstAbilityUrl = pokemonQuery.$data.map(d => d?.abilities[0]?.ability.url ?? null)

const abilityQuery = createQuery({
  queryKey: ['ability', $firstAbilityUrl],
  queryFn: ({ queryKey }) => fetchAbilityByUrl(queryKey[1] as string),
  enabled: pokemonQuery.$isSuccess,        // ← run only after pokemon loads
})`}</pre>
    </>
  )
}
