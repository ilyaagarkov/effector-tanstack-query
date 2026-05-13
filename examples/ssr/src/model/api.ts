// Same PokéAPI wrappers as the CSR example — kept local so each example
// can be read in isolation.

const BASE = 'https://pokeapi.co/api/v2'

export interface PokemonListItem {
  name: string
  url: string
}
export interface PokemonListResponse {
  count: number
  next: string | null
  previous: string | null
  results: Array<PokemonListItem>
}
export interface Pokemon {
  id: number
  name: string
  height: number
  weight: number
  sprites: { front_default: string | null }
  types: Array<{ type: { name: string } }>
}

export async function fetchPokemonList(
  limit: number,
  offset: number,
): Promise<PokemonListResponse> {
  const r = await fetch(`${BASE}/pokemon?limit=${limit}&offset=${offset}`, {
    next: { revalidate: 60 },
  })
  if (!r.ok) throw new Error(`HTTP ${r.status}`)
  return r.json()
}

export async function fetchPokemonByName(name: string): Promise<Pokemon> {
  const r = await fetch(`${BASE}/pokemon/${name.toLowerCase()}`, {
    next: { revalidate: 60 },
  })
  if (!r.ok) throw new Error(`HTTP ${r.status}`)
  return r.json()
}
