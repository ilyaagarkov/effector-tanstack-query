import { dehydrate } from '@tanstack/query-core'
import { allSettled, serialize } from 'effector'
import { EffectorNext } from '@effector/next'
import { HydrationBoundary } from '@effector-tanstack-query/react'
import { prefetchQueries } from '@effector-tanstack-query/core'
import { makeRequestScope } from '@/lib/server'
import { detailNameSet, pokemonDetailQuery } from '@/model/pokemon-detail'
import { DetailBody } from './page.client'

/**
 * Dynamic route — `/pokemon/[name]`. Demonstrates per-request prefetch
 * of a parameterized query:
 *
 *   1. Build a per-request scope + QueryClient.
 *   2. `allSettled(detailNameSet, { params: name, scope })` sets the
 *      `$detailName` store inside the scope — this becomes the second
 *      element of `pokemonDetailQuery.queryKey`. Must happen *before*
 *      `prefetchQueries`, so the queryFn runs against the URL name.
 *   3. `prefetchQueries(...)` fills both layers (cache + effector
 *      stores) for the resolved key.
 *   4. `<HydrationBoundary>` + `<EffectorNext>` merge both snapshots
 *      into the singleton browser state. The singleton QueryClient
 *      cache means repeat visits to the same name (or a name the home
 *      page already loaded) hit cache instantly.
 */
export default async function Page({
  params,
}: {
  params: Promise<{ name: string }>
}) {
  const { name } = await params
  const { queryClient, scope } = makeRequestScope()

  await allSettled(detailNameSet, { params: name, scope })
  await prefetchQueries([pokemonDetailQuery], { scope })

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <EffectorNext values={serialize(scope)}>
        <DetailBody name={name} />
      </EffectorNext>
    </HydrationBoundary>
  )
}
