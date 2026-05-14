import { dehydrate } from '@tanstack/query-core'
import { serialize } from 'effector'
import { EffectorNext } from '@effector/next'
import {
  HydrationBoundary,
} from '@effector-tanstack-query/react'
import { prefetchQueries } from '@effector-tanstack-query/core'
import { listQuery, pokemonQuery } from '@/model/queries'
import { makeRequestScope } from '@/lib/server'
import { PageBody } from './page.client'

/**
 * Server component, App Router page:
 *   1. `makeRequestScope()` — fresh per-request QueryClient + effector
 *      scope, wired so every observer in this scope reads from this
 *      request's cache.
 *   2. `prefetchQueries(...)` — runs `prefetch` (awaits the queryFn →
 *      cache filled) then `mounted` (observer dispatches cached data
 *      into the effector stores). Skipping either phase results in a
 *      loading flash or hydration mismatch on the client.
 *   3. `<HydrationBoundary state={dehydrate(qc)}>` merges the server's
 *      query cache into the singleton browser QueryClient.
 *   4. `<EffectorNext values={serialize(scope)}>` merges the serialized
 *      effector stores into the singleton client scope owned by
 *      `<Providers>` in the layout.
 *
 * Result: first browser paint already has data, no client refetch
 * (`staleTime` keeps the hydrated cache fresh).
 *
 * Both `<HydrationBoundary>` and `<EffectorNext>` are client components
 * imported into this server component — Next handles the boundary, the
 * dehydrated/serialized props travel through the RSC payload.
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
    <HydrationBoundary state={dehydrate(queryClient)}>
      <EffectorNext values={serialize(scope)}>
        <PageBody />
      </EffectorNext>
    </HydrationBoundary>
  )
}
