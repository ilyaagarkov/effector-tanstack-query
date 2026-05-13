'use client'

import * as React from 'react'
import { Provider } from 'effector-react'
import { QueryClient, hydrate } from '@tanstack/query-core'
import { fork } from 'effector'
import { setQueryClient } from '@effector-tanstack-query/core'
import type { Scope } from 'effector'
import type { DehydratedState } from '@tanstack/query-core'

interface Props {
  children: React.ReactNode
  dehydratedQueryClient: DehydratedState
  serializedScope: Record<string, unknown>
}

// SID of $queryClient — assigned in the library so that fork({ values })
// can inject it through the object form alongside serialized stores.
const QUERY_CLIENT_SID = '@tanstack/query-effector.$queryClient'

/**
 * Boots the client-side scope from the SSR payload. Runs **once** per
 * page mount in the browser:
 *   1. Construct a fresh QueryClient + call `.mount()`.
 *   2. Hydrate the cache from the server's dehydrate() output.
 *   3. `fork({ values })` with both the serialized stores AND the new
 *      QueryClient (keyed by `$queryClient`'s sid). This way the scope's
 *      `$queryClient` is non-null from the very first synchronous render —
 *      Suspense in the hydrated tree just works.
 *   4. `setQueryClient(qc)` also sets the global default, so anything
 *      constructed outside this scope can still resolve a client.
 *   5. Render with `<Provider value={scope}>`.
 */
export function HydrationProvider({
  children,
  dehydratedQueryClient,
  serializedScope,
}: Props) {
  const [scope] = React.useState<Scope>(() => {
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false, staleTime: 60_000 } },
    })
    queryClient.mount()
    hydrate(queryClient, dehydratedQueryClient)
    setQueryClient(queryClient)

    return fork({
      values: {
        ...serializedScope,
        [QUERY_CLIENT_SID]: queryClient,
      },
    })
  })

  return <Provider value={scope}>{children}</Provider>
}
