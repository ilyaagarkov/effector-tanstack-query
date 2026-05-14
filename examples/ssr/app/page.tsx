import { dehydrate } from '@tanstack/query-core'
import { serialize } from 'effector'
import { prefetchQueries } from '@effector-tanstack-query/core'
import { listQuery, pokemonQuery } from '@/model/queries'
import { makeRequestScope } from '@/lib/server'
import { PageHydration } from '@/lib/hydration-provider'
import { PageBody } from './page.client'

/**
 * Server component, App Router page:
 *   1. Build a per-request `QueryClient` + effector scope.
 *   2. `prefetchQueries(...)` runs the queries' `prefetch` (awaits the
 *      queryFn → cache filled) then `mounted` (observer dispatches
 *      cached data into the effector stores). Skipping either phase
 *      results in a loading flash or a hydration mismatch on the
 *      client — the helper makes both impossible to forget.
 *   3. Snapshot both layers (`dehydrate` + `serialize`) and hand them
 *      to `<PageHydration>`, which merges them into the singleton
 *      client scope provided by `<Providers>` in the layout.
 *
 * Result: first browser paint already has data, no client refetch
 * (`staleTime` keeps the hydrated cache fresh).
 *
 * No explicit `unmounted` cleanup here: the per-request `queryClient`
 * and `scope` are local to this function, and the returned JSX only
 * carries the plain serialized snapshots — nothing keeps the live
 * observers / subscriptions alive after the response is sent.
 */
export default async function Home() {
  const { queryClient, scope } = makeRequestScope()

  await prefetchQueries([listQuery, pokemonQuery], { scope })

  return (
    <PageHydration
      dehydratedQueryClient={dehydrate(queryClient)}
      serializedScope={serialize(scope)}
    >
      <PageBody />
    </PageHydration>
  )
}
