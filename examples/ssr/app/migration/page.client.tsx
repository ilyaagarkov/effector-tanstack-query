'use client'

import * as React from 'react'
import {
  useQuery as useVanillaQuery,
  useQueryClient,
} from '@tanstack/react-query'
import { useQuery as useEffectorQuery } from '@effector-tanstack-query/react'
import {
  MIGRATION_LIST_KEY,
  fetchMigrationList,
  migrationListQuery,
} from '@/model/migration'
import type { PokemonListResponse } from '@/model/api'

/**
 * Two halves of the same cache:
 *
 *   - `VanillaSide` uses `useQuery` from `@tanstack/react-query` —
 *     the "before migration" code.
 *   - `EffectorSide` uses `useQuery` from `@effector-tanstack-query/react`
 *     — the "after migration" code.
 *
 * They never talk to each other directly. They share state because they
 * share a `QueryClient` and a `queryKey`. The toolbar at the top lets
 * you fire `invalidate` / `setQueryData` from either side and observe
 * that BOTH halves react.
 */
export function MigrationBody() {
  return (
    <main className="main">
      <h1>Migration playground — react-query ↔ effector-tanstack-query</h1>
      <p className="muted">
        Same data, two hooks. Click any "from vanilla" / "from effector"
        button — both panels react. Pitfalls and the wiring are in
        <code> app/migration/page.tsx</code> and
        <code> src/lib/migration-provider.tsx</code>.
      </p>

      <Toolbar />

      <div className="row" style={{ alignItems: 'stretch', gap: 16 }}>
        <VanillaSide />
        <EffectorSide />
      </div>

      <h3>Migration checklist</h3>
      <ul className="muted">
        <li>
          Use the same <code>queryKey</code> in <code>createQuery</code> and
          <code> useQuery</code> (array shape AND values).
        </li>
        <li>
          Keep <code>staleTime</code> / <code>gcTime</code> / <code>retry</code>
          in sync — diverging defaults mean one side will refetch while the
          other thinks data is fresh.
        </li>
        <li>
          Both APIs must point at the same <code>QueryClient</code> instance.
          On the client that's the singleton from{' '}
          <code>lib/providers.tsx</code>; on the server it's the per-request
          QC from <code>makeRequestScope()</code>.
        </li>
        <li>
          Don't double-prefetch. One prefetch (via either API) fills the
          shared cache entry for both.
        </li>
      </ul>
    </main>
  )
}

function Toolbar() {
  const qc = useQueryClient()
  const [pending, startTransition] = React.useTransition()

  function invalidate() {
    void qc.invalidateQueries({ queryKey: MIGRATION_LIST_KEY })
  }

  function renameFirstViaSetQueryData() {
    // setQueryData via react-query → effector's $data store updates too,
    // because both subscribe to the same cache entry via the same QC.
    qc.setQueryData<PokemonListResponse>(MIGRATION_LIST_KEY, (prev) => {
      if (!prev) return prev
      const [first, ...rest] = prev.results
      if (!first) return prev
      return {
        ...prev,
        results: [
          { ...first, name: `★ ${first.name.replace(/^★ /, '')}` },
          ...rest,
        ],
      }
    })
  }

  function refreshFromEffector() {
    // Refresh through the effector factory's event. Same key → same
    // cache entry → the react-query observer sees the new data.
    startTransition(() => {
      migrationListQuery.refresh()
    })
  }

  return (
    <section
      className="card"
      style={{ marginBottom: 12, position: 'sticky', top: 0, zIndex: 1 }}
    >
      <h2 style={{ marginTop: 0 }}>Cross-API actions</h2>
      <div className="row" style={{ gap: 8, flexWrap: 'wrap' }}>
        <button onClick={invalidate}>invalidate (from vanilla)</button>
        <button onClick={renameFirstViaSetQueryData}>
          setQueryData rename (from vanilla)
        </button>
        <button onClick={refreshFromEffector} disabled={pending}>
          refresh (from effector)
        </button>
      </div>
      <p className="muted" style={{ marginBottom: 0 }}>
        Each action mutates the shared cache via one API. Both panels below
        re-render — that's the proof their observers attach to the same
        <code> QueryClient</code>.
      </p>
    </section>
  )
}

function VanillaSide() {
  // Plain `@tanstack/react-query` usage — the "before" code.
  // `queryKey` / `queryFn` / `staleTime` must match the effector factory.
  const { data, isFetching, isPending, error, refetch } =
    useVanillaQuery<PokemonListResponse>({
      queryKey: MIGRATION_LIST_KEY,
      queryFn: fetchMigrationList,
      staleTime: 60_000,
    })

  return (
    <section className="card" style={{ flex: 1 }}>
      <div className="row" style={{ justifyContent: 'space-between' }}>
        <h2 style={{ margin: 0 }}>@tanstack/react-query</h2>
        {isFetching && <span className="badge pending">fetching…</span>}
      </div>
      <p className="muted">
        <code>useQuery({'{ queryKey, queryFn }'})</code> from{' '}
        <code>@tanstack/react-query</code>. Pre-migration code path.
      </p>
      <button onClick={() => void refetch()} disabled={isFetching}>
        refetch (this side)
      </button>
      {isPending && !data && <p>Loading…</p>}
      {error && <p>{error.message}</p>}
      {data && <PokemonList data={data} />}
    </section>
  )
}

function EffectorSide() {
  // The same query, but defined as an effector factory and consumed via
  // our `useQuery`. Reads from the same cache entry as VanillaSide.
  const { data, isFetching, isPending, error, refresh } =
    useEffectorQuery(migrationListQuery)

  return (
    <section className="card" style={{ flex: 1 }}>
      <div className="row" style={{ justifyContent: 'space-between' }}>
        <h2 style={{ margin: 0 }}>@effector-tanstack-query/react</h2>
        {isFetching && <span className="badge pending">fetching…</span>}
      </div>
      <p className="muted">
        <code>useQuery(migrationListQuery)</code> from{' '}
        <code>@effector-tanstack-query/react</code>. Post-migration code path.
      </p>
      <button onClick={() => refresh()} disabled={isFetching}>
        refresh (this side)
      </button>
      {isPending && !data && <p>Loading…</p>}
      {error && <p>{error.message}</p>}
      {data && <PokemonList data={data} />}
    </section>
  )
}

function PokemonList({ data }: { data: PokemonListResponse }) {
  return (
    <ol style={{ marginTop: 12, paddingLeft: 20 }}>
      {data.results.map((p) => (
        <li key={p.name}>{p.name}</li>
      ))}
    </ol>
  )
}
