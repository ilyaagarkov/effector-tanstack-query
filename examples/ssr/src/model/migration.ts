import { createQuery } from '@effector-tanstack-query/core'
import { fetchPokemonList, type PokemonListResponse } from './api'

/**
 * Migration demo: side-by-side `@tanstack/react-query` + this library.
 *
 * The interop contract is dead simple — both APIs share:
 *   - the same `QueryClient` instance (via `$queryClient` on client,
 *     `makeRequestScope().queryClient` on server),
 *   - the same `queryKey` (byte-identical array shape & values),
 *   - matching default options (`staleTime`, `retry`, `gcTime`).
 *
 * With those three aligned, `useQuery` from either package resolves to
 * the **same cache entry**: prefetch via one API → read via the other,
 * `setQueryData`/`invalidate` from one → re-render on the other.
 *
 * Diverge any one of these and migrations get the classic "the new code
 * works but somehow we now fetch twice" headache.
 */

export const MIGRATION_LIST_KEY = ['migration-list'] as const
export const MIGRATION_LIST_LIMIT = 10

export function fetchMigrationList(): Promise<PokemonListResponse> {
  return fetchPokemonList(MIGRATION_LIST_LIMIT, 0)
}

export const migrationListQuery = createQuery({
  name: 'migration.list',
  queryKey: MIGRATION_LIST_KEY,
  queryFn: fetchMigrationList,
  staleTime: 60_000,
})
