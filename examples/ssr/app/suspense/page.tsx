import { dehydrate } from '@tanstack/query-core'
import { serialize } from 'effector'
import { EffectorNext } from '@effector/next'
import { HydrationBoundary } from '@effector-tanstack-query/react'
import { prefetchQueries } from '@effector-tanstack-query/core'
import { suspensePokemonQuery } from '@/model/suspense'
import { makeRequestScope } from '@/lib/server'
import { SuspenseBody } from './page.client'

/**
 * `/suspense` — Suspense + SSR-prefetch walkthrough:
 *
 *   1. `makeRequestScope()` — per-request scope + QueryClient.
 *   2. `prefetchQueries(...)` fills both the QC cache and the scope's
 *      `$data` / `$status` stores for the default `$suspenseName`
 *      ('bulbasaur').
 *   3. Sibling `<HydrationBoundary state={dehydrate(qc)} />` runs the
 *      `hydrate(qc, state)` side effect during render so the singleton
 *      browser QC also owns the prefetched entry on the client.
 *   4. `<EffectorNext values={serialize(scope)}>` provides the
 *      hydrated scope.
 *
 * On the server render, `useSuspenseQuery` finds `$observer` and
 * `$queryClient` both `null` in the rendering scope (both stores are
 * `serialize: 'ignore'` — class instances aren't JSON-shippable across
 * the RSC boundary). It falls back to reading `$status` / `$data` from
 * the rehydrated scope directly: status is `'success'`, data is the
 * prefetched pokemon, no need to materialise an observer. Server HTML
 * carries the card with data; no Suspense fallback shown.
 *
 * On client hydration the same path runs against the populated browser
 * stores. After mount, the observer is materialised against the
 * singleton browser QC and takes over — picking an uncached name flips
 * status to `'pending'`, the hook throws `observer.fetchOptimistic(...)`,
 * Suspense shows its fallback, and the tree re-renders on success.
 * `__invalid__` throws a 404 caught by the `<ErrorBoundary>`.
 */
export default async function SuspensePage() {
  const { queryClient, scope } = makeRequestScope()

  await prefetchQueries([suspensePokemonQuery], { scope })

  return (
    <EffectorNext values={serialize(scope)}>
      <HydrationBoundary state={dehydrate(queryClient)} />
      <SuspenseBody />
    </EffectorNext>
  )
}
