# @effector-tanstack-query

Effector bindings for [TanStack Query](https://tanstack.com/query) — reactive
data fetching with effector stores.

A thin adapter that exposes TanStack Query state and operations as effector
units. It doesn't reimplement the cache, dedup, or revalidation — it forwards
them. Every observer field (`data`, `status`, `isPending`, …) becomes a
`Store<T>`, every imperative action (`refetch`, `fetchNextPage`, `mutate`, …)
becomes an `EventCallable`. A `Store` placed inside `queryKey` triggers
automatic refetch on change. SSR works via the two persistence layers —
`dehydrate` / `hydrate` for the queryClient cache and `serialize(scope)` /
`fork({ values })` for the effector graph.

## Documentation

📚 [**ilyaagarkov.github.io/effector-tanstack-query**](https://ilyaagarkov.github.io/effector-tanstack-query/)

Guides, API reference, SSR + Suspense walkthroughs, naming/SID rules.

## Installation

```bash
npm install @effector-tanstack-query/core @effector-tanstack-query/react \
  @tanstack/query-core effector effector-react
```

The `/react` package is optional — install only if you want the hooks. The
core package is React-agnostic.

## Examples

Runnable apps in [`examples/`](./examples):

- [`examples/csr`](./examples/csr) — Vite + React. Reactive pagination,
  dependent queries, `placeholderData`, reactive polling, infinite query,
  Suspense + ErrorBoundary, mutations + invalidation, optimistic update with
  rollback, per-call callbacks. MSW handles the mutation endpoints — no
  backend setup.
- [`examples/ssr`](./examples/ssr) — Next.js 16 App Router. Per-request
  `QueryClient` + effector scope, `query.prefetch` for awaited SSR
  prefetching, hydration with no flash on first paint.

## License

MIT
