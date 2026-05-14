import 'server-only'
import { QueryClient } from '@tanstack/query-core'
import { fork } from 'effector'
import { $queryClient } from '@effector-tanstack-query/core'
import type { Scope } from 'effector'

/**
 * Build a fresh QueryClient + effector scope **per request** for the
 * server render of one page. Both are throwaway: only their serialized
 * snapshots (`dehydrate(qc)` + `serialize(scope)`) are shipped to the
 * browser, where `<PageHydration>` merges them into the singleton client
 * scope owned by `<Providers>` in the layout.
 *
 * Encapsulates two invariants every page would otherwise repeat:
 *   - shared QueryClient defaults (no retry, `staleTime: 60s` so the
 *     hydrated cache is fresh on the client's first paint),
 *   - `fork({ values: [[$queryClient, qc]] })` wiring so every observer
 *     in the scope reads from this request's cache (no cross-request
 *     bleed under concurrent SSR).
 *
 * `queryClient.mount()` is intentionally NOT called on the server — no
 * window/focus events to subscribe to, and we don't want background
 * refetch tasks for a request that's about to end.
 */
export function makeRequestScope(): { queryClient: QueryClient; scope: Scope } {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, staleTime: 60_000 } },
  })
  const scope = fork({ values: [[$queryClient, queryClient]] })
  return { queryClient, scope }
}
