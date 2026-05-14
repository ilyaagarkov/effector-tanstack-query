'use client'

import * as React from 'react'
import { EffectorNext } from '@effector/next'
import { HydrationBoundary } from '@effector-tanstack-query/react'
import type { DehydratedState } from '@tanstack/query-core'

interface Props {
  children: React.ReactNode
  dehydratedQueryClient: DehydratedState
  serializedScope: Record<string, unknown>
}

/**
 * Per-page bridge between server snapshots and the singleton client state:
 *
 *   - `<HydrationBoundary state={...}>` from `@effector-tanstack-query/react`
 *     merges the dehydrated QueryClient cache into the scope's QueryClient
 *     (read via `useUnit($queryClient)` internally — mirrors tanstack's API).
 *   - `<EffectorNext values={...}>` merges serialized effector store
 *     snapshots into the singleton scope.
 *
 * Both run inside the render phase, so children render on first paint with
 * a populated cache AND populated stores — no loading flash, no hydration
 * mismatch.
 */
export function PageHydration({
  children,
  dehydratedQueryClient,
  serializedScope,
}: Props) {
  return (
    <HydrationBoundary state={dehydratedQueryClient}>
      <EffectorNext values={serializedScope}>{children}</EffectorNext>
    </HydrationBoundary>
  )
}
