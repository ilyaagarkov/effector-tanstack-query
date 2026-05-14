'use client'

import * as React from 'react'
import Link from 'next/link'
import { useUnit } from 'effector-react'
import { useQuery } from '@effector-tanstack-query/react'
import { detailNameSet, pokemonDetailQuery } from '@/model/pokemon-detail'
import { $favorites, favoriteToggled } from '@/model/favorites'

/**
 * Detail-page body. Client component — runs after RSC payload arrives.
 *
 * The `useEffect` keeps the URL param in sync with `$detailName` whenever
 * the user navigates to a different `/pokemon/[name]`. Without it, the
 * client scope (a singleton across navigations) would keep the previous
 * name and `useQuery` would render stale data until the next prefetch
 * snapshot merges in.
 */
export function DetailBody({ name }: { name: string }) {
  const setDetailName = useUnit(detailNameSet)

  React.useEffect(() => {
    setDetailName(name)
  }, [name, setDetailName])

  const { data, isPending, isFetching, error } = useQuery(pokemonDetailQuery)
  const [favorites, toggleFavorite] = useUnit([$favorites, favoriteToggled])
  const isFavorite = favorites.includes(name)

  return (
    <main className="main">
      <p className="muted">
        <Link href="/">← back to home</Link>
      </p>
      <h1 style={{ textTransform: 'capitalize' }}>{name}</h1>

      <section className="card">
        <div className="row">
          <button onClick={() => toggleFavorite(name)}>
            {isFavorite ? '★ remove from favorites' : '☆ add to favorites'}
          </button>
          {isFetching && <span className="badge pending">fetching…</span>}
        </div>

        {isPending && !data && <p>Loading…</p>}
        {error && <p>{error.message}</p>}
        {data && (
          <div className="row" style={{ marginTop: 12 }}>
            {data.sprites.front_default && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={data.sprites.front_default}
                alt={data.name}
                width={120}
              />
            )}
            <div>
              <div className="muted">id #{data.id}</div>
              <div className="muted">
                height {data.height} · weight {data.weight}
              </div>
              <div className="muted">
                types: {data.types.map((t) => t.type.name).join(', ')}
              </div>
            </div>
          </div>
        )}
      </section>

      <p className="muted">
        Reload the page — the data is already in the SSR HTML (no flash).
        Open DevTools "Network" and reload: only the document + assets,
        no <code>pokemon/{name}</code> XHR. Then click "add to favorites"
        and navigate back to home — the counter persists.
      </p>
    </main>
  )
}
