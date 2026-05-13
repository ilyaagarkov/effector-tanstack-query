import * as React from 'react'
import { sample } from 'effector'
import {
  createInvalidate,
  createMutation,
  createQuery,
} from '@effector-tanstack-query/core'
import { useMutation, useQuery } from '@effector-tanstack-query/react'
import { addFavorite, fetchFavorites, removeFavorite } from '../model/api'

const favoritesQuery = createQuery({
  name: 'mutation.favorites',
  queryKey: ['favorites'],
  queryFn: fetchFavorites,
})

const addFavoriteMutation = createMutation({
  name: 'mutation.addFavorite',
  mutationFn: addFavorite,
})

const removeFavoriteMutation = createMutation({
  name: 'mutation.removeFavorite',
  mutationFn: removeFavorite,
})

// Module-level invalidation: `createInvalidate` builds a scope-aware event
// that calls qc.invalidateQueries on the current scope's $queryClient. This
// is the effector-idiomatic place for cross-cutting reactions — no component
// callbacks, fork-compatible, no attach boilerplate.
const invalidateFavorites = createInvalidate({ queryKey: ['favorites'] })

sample({
  clock: [
    addFavoriteMutation.finished.success,
    removeFavoriteMutation.finished.success,
  ],
  target: invalidateFavorites,
})

const CHOICES = ['eevee', 'snorlax', 'gengar', 'mewtwo', 'lucario', 'gardevoir']

export function MutationPage() {
  const favorites = useQuery(favoritesQuery)
  const addM = useMutation(addFavoriteMutation)
  const removeM = useMutation(removeFavoriteMutation)
  const [name, setName] = React.useState(CHOICES[0]!)

  return (
    <>
      <h2>Mutation + invalidate</h2>
      <p className="muted">
        After <code>addFavoriteMutation.finished.success</code> fires, a{' '}
        <code>sample</code> at module level invalidates the favorites query —
        the list refetches automatically.
      </p>

      <div className="card">
        <div className="row">
          <select value={name} onChange={(e) => setName(e.target.value)}>
            {CHOICES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
          <button
            onClick={() => addM.mutate(name)}
            disabled={addM.isPending}
          >
            {addM.isPending ? 'adding…' : 'add favorite'}
          </button>
          {addM.error && (
            <span className="badge error">{addM.error.message}</span>
          )}
        </div>

        <h4 style={{ marginTop: 16 }}>
          Favorites {favorites.isFetching && '(refetching…)'}
        </h4>
        {favorites.isPending ? (
          <p>Loading…</p>
        ) : (
          <ul>
            {favorites.data?.map((f) => (
              <li key={f.id} className="row">
                <span>{f.name}</span>
                <button
                  onClick={() => removeM.mutate(f.id)}
                  disabled={removeM.isPending}
                >
                  remove
                </button>
              </li>
            ))}
          </ul>
        )}
        <p className="muted">
          Server is flaky and rejects ~20% of POSTs — click "add" several
          times to see <code>$error</code> populate.
        </p>
      </div>

      <pre>{`const invalidateFavorites = createInvalidate({ queryKey: ['favorites'] })

sample({
  clock: addFavoriteMutation.finished.success,
  target: invalidateFavorites,
})`}</pre>
    </>
  )
}
