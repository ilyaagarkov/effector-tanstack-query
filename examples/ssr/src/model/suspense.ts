import { createEvent, createStore } from 'effector'
import { createQuery } from '@effector-tanstack-query/core'
import { fetchPokemonByName } from './api'

/**
 * Reactive name for the `/suspense` route. The default value 'bulbasaur'
 * is what the server prefetches, so the very first paint after
 * navigation never flashes the `<Suspense>` fallback — `useSuspenseQuery`
 * sees the populated `$data` store and returns synchronously.
 *
 * Picking a different name from the client-side dropdown updates the
 * store, the observer re-evaluates against the cache, and if the new
 * key is uncached the hook re-suspends (the demo's whole point).
 *
 * `name` + `sid` set explicitly so `serialize(scope)` ships the current
 * value to the browser across the RSC boundary (without
 * `effector/babel-plugin`, SIDs must be set by hand).
 */
export const suspenseNameSet = createEvent<string>()
export const $suspenseName = createStore('bulbasaur', {
  name: 'suspense.name',
  sid: 'suspense.name',
}).on(suspenseNameSet, (_, n) => n)

export const suspensePokemonQuery = createQuery({
  name: 'suspense.pokemon',
  queryKey: ['suspense-pokemon', $suspenseName],
  queryFn: ({ queryKey }) => fetchPokemonByName(queryKey[1]),
  staleTime: 60_000,
})
