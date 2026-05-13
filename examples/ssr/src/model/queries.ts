import { createEvent, createStore } from 'effector'
import { createQuery } from '@effector-tanstack-query/core'
import { fetchPokemonByName, fetchPokemonList } from './api'

// Reactive page store — drives the paginated list query both on the server
// (initial render) and on the client (after hydration, when the user clicks
// "next").
export const pageChanged = createEvent<number>()
export const $page = createStore(0).on(pageChanged, (_, p) => p)

export const PAGE_SIZE = 20

export const listQuery = createQuery({
  name: 'ssr.list',
  queryKey: ['pokemon-list', $page],
  queryFn: ({ queryKey }) => {
    const page = queryKey[1] as number
    return fetchPokemonList(PAGE_SIZE, page * PAGE_SIZE)
  },
  staleTime: 60_000,
})

// Reactive name → triggers a fresh fetch when the user types.
export const nameChanged = createEvent<string>()
export const $name = createStore('pikachu').on(nameChanged, (_, n) => n)

export const pokemonQuery = createQuery({
  name: 'ssr.pokemon',
  queryKey: ['pokemon', $name],
  queryFn: ({ queryKey }) => fetchPokemonByName(queryKey[1] as string),
  staleTime: 60_000,
})
