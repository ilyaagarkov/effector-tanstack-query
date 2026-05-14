import { allSettled } from 'effector'
import { makeRequestScope, prefetch } from '@/lib/server'
import { PageHydration } from '@/lib/hydration-provider'
import { detailNameSet, pokemonDetailQuery } from '@/model/pokemon-detail'
import { DetailBody } from './page.client'

/**
 * Dynamic route — `/pokemon/[name]`. Demonstrates per-request prefetch of
 * a parameterized query:
 *
 *   1. Build a per-request scope + QueryClient.
 *   2. `allSettled(detailNameSet, { params: name, scope })` sets the
 *      `$detailName` store inside the scope — this becomes the second
 *      element of `pokemonDetailQuery.queryKey`.
 *   3. `prefetch(...)` runs the queryFn for the now-resolved key and
 *      mounts the query so the effector stores get the data.
 *   4. `<PageHydration>` ships both snapshots to the browser; the singleton
 *      QueryClient cache is merged in, so repeat visits to the same name
 *      (or a name the home page already loaded) hit cache instantly.
 */
export default async function Page({
  params,
}: {
  params: Promise<{ name: string }>
}) {
  const { name } = await params
  const { queryClient, scope } = makeRequestScope()

  await allSettled(detailNameSet, { params: name, scope })

  const { dehydratedQueryClient, serializedScope } = await prefetch(
    scope,
    queryClient,
    [pokemonDetailQuery],
  )

  return (
    <PageHydration
      dehydratedQueryClient={dehydratedQueryClient}
      serializedScope={serializedScope}
    >
      <DetailBody name={name} />
    </PageHydration>
  )
}
