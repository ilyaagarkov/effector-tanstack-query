'use client'

import * as React from 'react'
import { EffectorNext, getClientScope } from '@effector/next'
import { allSettled } from 'effector'
import { QueryClient } from '@tanstack/query-core'
import { $queryClient, setQueryClient } from '@effector-tanstack-query/core'

/**
 * Top-level module side effect: imported by `app/layout.tsx`, so it runs
 * once per browser session, BEFORE any React render or @effector/next
 * hydration.
 *
 *   - On the **client**, `getClientScope()` returns the singleton scope
 *     owned by `<EffectorNext>`. We construct the browser QueryClient,
 *     mount it (window-focus refetch + GC), set it as the no-scope default
 *     (`setQueryClient`), and write it into the singleton scope via
 *     `allSettled($queryClient, { params: qc, scope })`. This is the
 *     honest, scope-aware analogue of `setState($queryClient, qc)`.
 *
 *   - On the **server**, `getClientScope()` returns null — the block is a
 *     no-op. Each server request builds its own throwaway scope + qc in
 *     `app/page.tsx`.
 *
 * Effect: by the time any client component renders, the singleton scope's
 * `$queryClient` is non-null — `useUnit($queryClient)` and observers
 * resolving via `attach` both see the same browser QueryClient.
 */
const clientScope = getClientScope()
if (clientScope) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, staleTime: 60_000 } },
  })
  queryClient.mount()
  setQueryClient(queryClient)
  void allSettled($queryClient, { params: queryClient, scope: clientScope })
}

export function Providers({ children }: { children: React.ReactNode }) {
  return <EffectorNext>{children}</EffectorNext>
}
