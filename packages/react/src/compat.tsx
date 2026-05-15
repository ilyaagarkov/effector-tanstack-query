'use client'

import * as React from 'react'
import { useUnit } from 'effector-react'
import {
  isServer,
  QueryClient,
  QueryClientProvider,
} from '@tanstack/react-query'
import { $queryClient } from '@effector-tanstack-query/core'

type DefaultOptions = NonNullable<
  ConstructorParameters<typeof QueryClient>[0]
>['defaultOptions']

export interface QueryClientCompatProviderProps {
  children: React.ReactNode
  /**
   * `defaultOptions` for the per-render server fallback `QueryClient`
   * (see below). Has no effect on the client — the browser singleton
   * built in your own top-level `<EffectorNext>` setup is what `useQuery`
   * from `@tanstack/react-query` resolves to there. Keep these aligned
   * with your `createQuery({ staleTime, retry, ... })` definitions so
   * server-rendered HTML matches what the client will produce after
   * hydration.
   */
  defaultOptions?: DefaultOptions
}

/**
 * SSR-safe `QueryClientProvider` bridge for users mixing
 * `@tanstack/react-query` and `@effector-tanstack-query` — the typical
 * "we're migrating page by page" case.
 *
 * Why a dedicated component:
 *
 *   - **Client**: `useUnit($queryClient)` returns the singleton browser
 *     `QueryClient` already mounted by your top-level provider (whichever
 *     module calls `setQueryClient(qc)` + `allSettled($queryClient, ...)`
 *     for `getClientScope()`). Handing that same instance to
 *     `<QueryClientProvider>` means **both APIs share a cache**: prefetch
 *     with one, read with the other; `setQueryData` /
 *     `invalidateQueries` from one re-renders the other.
 *
 *   - **Server (RSC)**: `$queryClient` is `serialize: 'ignore'` (its
 *     value is a class instance — not JSON-safe — and per-request
 *     QueryClients must NEVER be a module-level singleton on the
 *     server). So inside the RSC rendering scope produced by
 *     `<EffectorNext values={serialize(scope)}>`, `useUnit($queryClient)`
 *     resolves to `null`. We fall back to a throwaway per-render
 *     `QueryClient` solely so vanilla `useQuery` has a provider during
 *     the server pass. Pair this component with `<HydrationBoundary>`
 *     from `@tanstack/react-query` — the boundary will hydrate this
 *     fallback client with the prefetched cache, so server-rendered
 *     HTML shows data instead of a loading flash. On client hydration
 *     the provider re-renders with the singleton browser client and
 *     react-query re-subscribes its observers.
 *
 * `useState` makes the fallback per-component-instance (one per render
 * tree), not a module-level singleton — concurrent SSR requests don't
 * share it.
 */
export function QueryClientCompatProvider({
  children,
  defaultOptions,
}: QueryClientCompatProviderProps): React.ReactElement {
  const fromEffector = useUnit($queryClient)
  const [serverFallback] = React.useState<QueryClient | null>(() =>
    isServer ? new QueryClient({ defaultOptions }) : null,
  )

  const qc = fromEffector ?? serverFallback
  if (!qc) {
    // Defensive: on the client `fromEffector` is set synchronously by
    // your top-level provider before any render, so this branch is
    // unreachable in practice. If it fires, rendering children without
    // a provider would crash any descendant `useQuery` from
    // `@tanstack/react-query`.
    return <>{children}</>
  }

  return <QueryClientProvider client={qc}>{children}</QueryClientProvider>
}
