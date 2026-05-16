'use client'

import Link from 'next/link'
import { useUnit } from 'effector-react'
import { $favorites } from '@/model/favorites'

/**
 * Layout-level nav. Reads from the singleton client scope, so the
 * favorites counter is preserved across App Router navigations — toggle a
 * favorite on a detail page, navigate away, come back: still there.
 * Server-rendered counter is always `0` (per-request scope starts fresh).
 */
export function Nav() {
  const favorites = useUnit($favorites)
  return (
    <nav className="nav">
      <div className="row">
        <Link href="/">Home</Link>
        <Link href="/suspense">Suspense</Link>
        <Link href="/migration">Migration</Link>
        <Link href="/pokemon/pikachu">pikachu</Link>
        <Link href="/pokemon/bulbasaur">bulbasaur</Link>
        <Link href="/pokemon/charmander">charmander</Link>
        <Link href="/pokemon/mewtwo">mewtwo</Link>
      </div>
      <span className="badge success" title="effector state persists across navigations">
        ★ {favorites.length} favorite{favorites.length === 1 ? '' : 's'}
      </span>
    </nav>
  )
}
