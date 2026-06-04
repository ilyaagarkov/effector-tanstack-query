import { dehydrate } from '@tanstack/query-core'
import { serialize } from 'effector'
import { EffectorNext } from '@effector/next'
import { HydrationBoundary } from '@effector-tanstack-query/react'
import { prefetchQueries } from '@effector-tanstack-query/core'
import { teamQueries } from '@/model/team'
import { makeRequestScope } from '@/lib/server'
import { TeamBody } from './page.client'

/**
 * `/team` — `createQueries` family + Suspense walkthrough.
 *
 *   1. `makeRequestScope()` — per-request scope + QueryClient.
 *   2. `prefetchQueries([teamQueries], { scope })` — the family
 *      satisfies `PrefetchableQuery` structurally. Iterates the
 *      current `$team` list, fires `qc.fetchQuery(...)` for every
 *      name in parallel, then mounts observers so `$items` carries
 *      the populated snapshot.
 *   3. Sibling `<HydrationBoundary />` and `<EffectorNext>` ship both
 *      layers to the browser — same pattern as `app/page.tsx`.
 *
 * On the client, `useSuspenseQueries(teamQueries)` reads the
 * pre-populated `$items` and renders the team without a Suspense
 * fallback flash. Adding a pokemon mid-session triggers a cache miss
 * for that one name — the hook re-throws while it fetches, Suspense
 * shows the fallback, the tree re-renders on success.
 */
export default async function TeamPage() {
  const { queryClient, scope } = makeRequestScope()

  await prefetchQueries([teamQueries], { scope })

  return (
    <EffectorNext values={serialize(scope)}>
      <HydrationBoundary state={dehydrate(queryClient)} />
      <TeamBody />
    </EffectorNext>
  )
}
