import { listQuery, pokemonQuery } from '@/model/queries'
import { makeRequestScope, prefetch } from '@/lib/server'
import { HydrationProvider } from '@/lib/hydration-provider'
import { PageBody } from './page.client'

/**
 * Server component:
 *   1. Build a per-request `QueryClient` + effector scope.
 *   2. Prefetch the queries via `query.prefetch` — awaits the queryFn,
 *      populates the cache, then mounts so effector stores get the cached
 *      data dispatched in.
 *   3. Serialize both layers and pass to `<HydrationProvider>`.
 *
 * The result: first browser paint already has data, no client refetch
 * (staleTime keeps the hydrated cache fresh).
 *
 * No explicit `unmounted` cleanup here: the per-request `queryClient` and
 * `scope` are local to this function, and the returned JSX only carries
 * the plain serialized snapshots — nothing keeps the live observers /
 * subscriptions alive after the response is sent.
 */
export default async function Home() {
  const { queryClient, scope } = makeRequestScope()

  const { dehydratedQueryClient, serializedScope } = await prefetch(
    scope,
    queryClient,
    [listQuery, pokemonQuery],
  )

  return (
    <HydrationProvider
      dehydratedQueryClient={dehydratedQueryClient}
      serializedScope={serializedScope}
    >
      <PageBody />
    </HydrationProvider>
  )
}
