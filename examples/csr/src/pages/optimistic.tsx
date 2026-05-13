import * as React from 'react'
import { attach, createStore, sample } from 'effector'
import {
  $queryClient,
  createInvalidate,
  createMutation,
  createQuery,
} from '@effector-tanstack-query/core'
import { useMutation, useQuery } from '@effector-tanstack-query/react'
import { addFavorite, fetchFavorites, type Favorite } from '../model/api'

const FAVORITES_KEY = ['favorites-optimistic'] as const

const favoritesQuery = createQuery({
  name: 'optimistic.favorites',
  queryKey: FAVORITES_KEY,
  queryFn: fetchFavorites,
})

const addFavoriteMutation = createMutation<Favorite, Error, string>({
  name: 'optimistic.addFavorite',
  mutationFn: addFavorite,
})

// 1) On mutate: cancel any inflight refetch (so the response can't overwrite
// our optimistic write), snapshot the current cache, then write the optimistic
// row. Returns the snapshot so $previous can hold onto it for rollback.
const cancelAndWriteOptimisticFx = attach({
  source: $queryClient,
  async effect(qc, name: string) {
    if (!qc) return null
    await qc.cancelQueries({ queryKey: FAVORITES_KEY })
    const previous = qc.getQueryData<Array<Favorite>>(FAVORITES_KEY) ?? []
    const optimisticRow: Favorite & { __optimistic?: true } = {
      id: -Date.now(),
      name,
      __optimistic: true,
    }
    qc.setQueryData<Array<Favorite>>(FAVORITES_KEY, [...previous, optimisticRow])
    return previous
  },
})

// 2) On failure: restore the snapshot taken in step 1.
const rollbackFx = attach({
  source: $queryClient,
  effect(qc, previous: Array<Favorite>) {
    if (!qc) return
    qc.setQueryData(FAVORITES_KEY, previous)
  },
})

// 3) On settle (success OR failure): invalidate so the server's canonical
// state replaces our optimistic write / restored snapshot.
const invalidateFavorites = createInvalidate({ queryKey: FAVORITES_KEY })

// Holds the most recent snapshot between mutate and finished.{success|failure}.
// Single-slot is fine here because MutationObserver only tracks one in-flight
// mutation at a time; if you fire `mutate` twice in a row, the second clobbers
// the first's snapshot — which matches TanStack Query's own behavior under
// react-query's `useMutation`.
const $previous = createStore<Array<Favorite>>([]).on(
  cancelAndWriteOptimisticFx.doneData,
  (_, snap) => snap ?? [],
)

// Wire: mutate → snapshot + optimistic write
sample({
  clock: addFavoriteMutation.mutate,
  target: cancelAndWriteOptimisticFx,
})

// failure → rollback (using the snapshot captured above)
sample({
  clock: addFavoriteMutation.finished.failure,
  source: $previous,
  target: rollbackFx,
})

// success or failure → invalidate to refetch canonical state
sample({
  clock: [
    addFavoriteMutation.finished.success,
    addFavoriteMutation.finished.failure,
  ],
  target: invalidateFavorites,
})

const CHOICES = ['eevee', 'snorlax', 'gengar', 'mewtwo', 'lucario']

export function OptimisticPage() {
  const favorites = useQuery(favoritesQuery)
  const addM = useMutation(addFavoriteMutation)
  const [name, setName] = React.useState(CHOICES[0]!)

  return (
    <>
      <h2>Optimistic update with rollback</h2>
      <p className="muted">
        The cache itself is the source of truth — <code>setQueryData</code>{' '}
        writes the optimistic row, <code>$previous</code> holds the snapshot
        between mutate and settle, and <code>finished.failure</code> drives
        the rollback. All wiring is in the effector graph via{' '}
        <code>attach({"{"} source: $queryClient {"}"})</code> — fork-safe, no{' '}
        <code>getState</code>. The 20%-flaky POST makes the rollback
        observable.
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
          <button onClick={() => addM.mutate(name)}>add (optimistic)</button>
          {addM.isPending && <span className="badge pending">posting…</span>}
          {addM.error && (
            <span className="badge error">last attempt failed (rolled back)</span>
          )}
        </div>

        <ul style={{ marginTop: 12 }}>
          {favorites.data?.map((f) => {
            const isOptimistic =
              (f as Favorite & { __optimistic?: boolean }).__optimistic === true
            return (
              <li key={f.id} style={{ opacity: isOptimistic ? 0.6 : 1 }}>
                {f.name}
                {isOptimistic && (
                  <span className="badge pending" style={{ marginLeft: 8 }}>
                    optimistic
                  </span>
                )}
              </li>
            )
          })}
        </ul>
      </div>

      <pre>{`const cancelAndWriteOptimisticFx = attach({
  source: $queryClient,
  async effect(qc, name) {
    await qc.cancelQueries({ queryKey: ['favorites'] })
    const previous = qc.getQueryData(['favorites']) ?? []
    qc.setQueryData(['favorites'], [...previous, { id: -Date.now(), name, __optimistic: true }])
    return previous
  },
})

const $previous = createStore([]).on(cancelAndWriteOptimisticFx.doneData, (_, s) => s ?? [])
const invalidateFavorites = createInvalidate({ queryKey: ['favorites'] })

sample({ clock: addFavoriteMutation.mutate, target: cancelAndWriteOptimisticFx })

sample({
  clock: addFavoriteMutation.finished.failure,
  source: $previous,
  target: rollbackFx,        // qc.setQueryData(['favorites'], previous)
})

sample({
  clock: [addFavoriteMutation.finished.success, addFavoriteMutation.finished.failure],
  target: invalidateFavorites,
})`}</pre>
    </>
  )
}
