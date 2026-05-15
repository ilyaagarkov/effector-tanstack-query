import { createEvent, createStore } from 'effector'
import { createQuery } from '@effector-tanstack-query/core'
import { fetchPokemonByName } from './api'

/**
 * Reactive name driving the `/pokemon/[name]` detail page. Set on the
 * server via `allSettled(detailNameSet, { params: name, scope })` before
 * prefetching, and re-synced on the client when the URL changes (in
 * `app/pokemon/[name]/page.client.tsx`).
 *
 * Defined here — separate from `$name` used on the home page — so the two
 * pages can hold independent state. The QueryClient cache, on the other
 * hand, IS shared: navigating to a name the home page already prefetched
 * resolves instantly from cache.
 */
export const detailNameSet = createEvent<string>()
// Explicit `sid` so `serialize(scope)` ships the URL-resolved name to the
// browser. Without it, the client scope would start at the default
// 'pikachu' until the URL-syncing useEffect fires — visible flash.
// (Without `effector/babel-plugin`, sids must be set by hand.)
export const $detailName = createStore('pikachu', {
  name: 'detail.name',
  sid: 'detail.name',
}).on(detailNameSet, (_, n) => n)

export const pokemonDetailQuery = createQuery({
  name: 'detail.pokemon',
  queryKey: ['pokemon', $detailName],
  queryFn: ({ queryKey }) => fetchPokemonByName(queryKey[1]),
  staleTime: 60_000,
})
