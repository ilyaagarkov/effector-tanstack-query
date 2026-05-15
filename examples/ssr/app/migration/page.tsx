import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { serialize } from "effector";
import { EffectorNext } from "@effector/next";
import { prefetchQueries } from "@effector-tanstack-query/core";
import { QueryClientCompatProvider } from "@effector-tanstack-query/react/compat";
import { migrationListQuery } from "@/model/migration";
import { makeRequestScope } from "@/lib/server";
import { MigrationBody } from "./page.client";

/**
 * Migration playground — same data rendered twice, once via
 * `@tanstack/react-query`'s `useQuery` and once via this library's
 * `useQuery`. Both hooks resolve to the same cache entry, so the demo
 * works as a "would the migration leave anything behind?" checklist:
 *
 *   - **Prefetch happens once.** `prefetchQueries` fills the per-request
 *     QueryClient at `MIGRATION_LIST_KEY` and dispatches the effector
 *     observer so `$data` is populated for the effector half. The
 *     react-query half doesn't need a separate `qc.prefetchQuery` —
 *     same key → same cache entry.
 *
 *   - **Vanilla `<HydrationBoundary>` covers both sides.** It calls
 *     `hydrate(qc, state)` against the QC visible through the
 *     `<QueryClientProvider>` from `<QueryClientCompatProvider>`. On
 *     the server pass that's a per-render fallback (so vanilla
 *     `useQuery` finds data and the SSR HTML has no loading flash); on
 *     the client it's the singleton browser QC — the same instance our
 *     own `$queryClient` points to, so effector observers see the same
 *     data without a separate `@effector-tanstack-query/react`
 *     `<HydrationBoundary>`.
 *
 *   - **Sibling pattern.** Both `<HydrationBoundary>` and
 *     `<EffectorNext>` are direct children of
 *     `<QueryClientCompatProvider>`. The boundary runs `hydrate` as a
 *     side effect during render; `<EffectorNext>` wraps `<MigrationBody />`
 *     because it provides context. Render order (top-to-bottom) puts
 *     the hydration call before any consumer ever asks for data.
 *
 *   - **Provider order matters.** `<QueryClientCompatProvider>` must
 *     wrap react-query's `<HydrationBoundary>` (the boundary looks up
 *     the QC via context). Everything must wrap `<MigrationBody />`
 *     so the hooks below find both contexts.
 */
export default async function MigrationPage() {
  const { queryClient, scope } = makeRequestScope();

  await prefetchQueries([migrationListQuery], { scope });

  return (
    <QueryClientCompatProvider
      defaultOptions={{ queries: { retry: false, staleTime: 60_000 } }}
    >
      <HydrationBoundary state={dehydrate(queryClient)} />
      <EffectorNext values={serialize(scope)}>
        <MigrationBody />
      </EffectorNext>
    </QueryClientCompatProvider>
  );
}
