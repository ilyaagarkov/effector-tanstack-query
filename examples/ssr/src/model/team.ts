import { createEvent, createStore } from 'effector'
import { createQueries } from '@effector-tanstack-query/core'
import { fetchPokemonByName } from './api'

/**
 * Reactive list of pokemon names driving the `/team` route. The server
 * prefetches the default list (`pikachu`, `bulbasaur`, `charmander`),
 * the client lets the user add / remove members from a fixed roster.
 *
 * `name` + `sid` set explicitly so `serialize(scope)` ships the current
 * team across the RSC boundary.
 */
export const teamUpdated = createEvent<string[]>()
export const $team = createStore<string[]>(['pikachu', 'bulbasaur', 'charmander'], {
  name: 'team.list',
  sid: 'team.list',
}).on(teamUpdated, (_, next) => next)

/**
 * One observer per item in `$team`. Same `queryFn` shape — varies only
 * by pokemon name. Adding a name spawns its observer; removing one
 * disposes it; re-ordering keeps existing observers.
 */
export const teamQueries = createQueries({
  name: 'team.queries',
  source: $team,
  query: (name) => ({
    queryKey: ['team-pokemon', name],
    queryFn: () => fetchPokemonByName(name),
  }),
  staleTime: 60_000,
})
