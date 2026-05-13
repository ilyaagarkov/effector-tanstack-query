// Thin wrappers over PokéAPI (https://pokeapi.co) — read-only, no auth.
// All examples share these so each page focuses on the effector model, not
// fetch boilerplate.

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
  abilities: Array<{ ability: { name: string; url: string } }>
  types: Array<{ type: { name: string } }>
}
export interface Ability {
  id: number
  name: string
  effect_entries: Array<{ effect: string; language: { name: string } }>
}

export async function fetchPokemonList(
  limit: number,
  offset: number,
): Promise<PokemonListResponse> {
  const r = await fetch(`${BASE}/pokemon?limit=${limit}&offset=${offset}`)
  if (!r.ok) throw new Error(`HTTP ${r.status}`)
  return r.json()
}

export async function fetchPokemonByUrl(url: string): Promise<Pokemon> {
  const r = await fetch(url)
  if (!r.ok) throw new Error(`HTTP ${r.status}`)
  return r.json()
}

export async function fetchPokemonByName(name: string): Promise<Pokemon> {
  const r = await fetch(`${BASE}/pokemon/${name.toLowerCase()}`)
  if (!r.ok) throw new Error(`HTTP ${r.status}`)
  return r.json()
}

export async function fetchAbilityByUrl(url: string): Promise<Ability> {
  const r = await fetch(url)
  if (!r.ok) throw new Error(`HTTP ${r.status}`)
  return r.json()
}

// Local mock API (handled by MSW) — used by mutation examples.
export interface Favorite {
  id: number
  name: string
}

export async function fetchFavorites(): Promise<Array<Favorite>> {
  const r = await fetch('/api/favorites')
  if (!r.ok) throw new Error(`HTTP ${r.status}`)
  return r.json()
}

export async function addFavorite(name: string): Promise<Favorite> {
  const r = await fetch('/api/favorites', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name }),
  })
  if (!r.ok) {
    const err = (await r.json().catch(() => ({}))) as { error?: string }
    throw new Error(err.error ?? `HTTP ${r.status}`)
  }
  return r.json()
}

export async function removeFavorite(id: number): Promise<void> {
  const r = await fetch(`/api/favorites/${id}`, { method: 'DELETE' })
  if (!r.ok) throw new Error(`HTTP ${r.status}`)
}
