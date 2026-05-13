import { createEvent, createStore } from 'effector'
import type { QueryClient } from '@tanstack/query-core'

/**
 * Holds the default `QueryClient` used when a factory (`createQuery`,
 * `createInfiniteQuery`, `createMutation`) is called without an explicit one.
 *
 * Per-scope isolation: under `fork({ values: [[$queryClient, qc]] })`, every
 * factory in that scope uses its own client. Observers are created lazily on
 * mount, reading this store via `attach`, so each scope gets its own observer.
 */
export const $queryClient = createStore<QueryClient | null>(null, {
  name: '@tanstack/query-effector.$queryClient',
  serialize: 'ignore',
})

export const setQueryClient = createEvent<QueryClient>()

$queryClient.on(setQueryClient, (_, qc) => qc)
