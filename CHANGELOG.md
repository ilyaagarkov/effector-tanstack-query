# Changelog

All notable changes to this project are documented here. The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and the project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

Both `@effector-tanstack-query/core` and `@effector-tanstack-query/react` share this changelog. Per-release version numbers below indicate which package shipped which change; entries for a single package mention the other staying at its previous version.

## [1.0.0] — 2026-08-07

Stable 1.0. The public API is unchanged from `1.0.0-rc.1`; this release publishes it under the `latest` dist-tag.

### Fixed

- **Suspense during SSR without a prefetch** ([#15](https://github.com/ilyaagarkov/effector-tanstack-query/issues/15)). `useSuspenseQuery` threw `no QueryClient is set` on the server pass of a client component whenever the route had no `prefetchQueries`: `$queryClient` is `serialize: 'ignore'`, so a scope rebuilt from `serialize(scope)` carries no client, and there was nothing to suspend on.

  That state is legitimate — it means the query runs in the browser. The hook still has to throw (a hook cannot return "pending", and a never-resolving promise would hold the SSR stream open), so it now throws an error carrying Next's `BAILOUT_TO_CLIENT_SIDE_RENDERING` digest — the protocol `next/dynamic` with `ssr: false` uses. Next skips logging it, React puts the `<Suspense>` fallback in the HTML and re-renders the boundary on the client. Nothing is fetched on the server, and outside Next the digest is inert.

  In the browser the same state is still a real misconfiguration, so the message stays loud and unchanged. Applies to `useSuspenseQuery`, `useSuspenseInfiniteQuery` and `useSuspenseQueries`.

### Install

```bash
npm install @effector-tanstack-query/core @effector-tanstack-query/react
```

## [1.0.0-rc.1] — 2026-06-04

First release candidate for the upcoming stable 1.0. No API changes vs `0.5.0` — this RC freezes the public surface and asks for real-world validation before the stable cut.

### Released alongside

A wave of internal hardening landed between 0.5.0 and this RC, with no behaviour change for consumers:

- **CI hygiene** — `attw` and `publint` now run on every PR and before each release; broken `exports` fields and ESM/CJS type masquerading can no longer ship.
- **SSR concurrency stress test** — 1000 parallel `renderToString` calls with overlapping async timing assert per-request scope isolation. Catches the worst class of SSR bug (cross-request data leak) automatically on every push.
- **Compat matrix** — scheduled workflow runs the full test suite + both example builds against React 18 / 19 with Next.js 15 / 16. PRs touching CI / examples / packages get the same matrix.
- **AbortSignal pass-through** — verified with a dedicated test that the standard TanStack `queryFn({ signal })` is wired through `createQuery` / `createInfiniteQuery`. Documented under each factory's "Cancellation" section.
- **Node** — CI bumped to Node 22 / 24 (Node 20 LTS ended in April).
- **CHANGELOG.md** — this file added, covering every release from 0.1.0.

### Install

```bash
npm install @effector-tanstack-query/core@rc @effector-tanstack-query/react@rc
```

The `rc` dist-tag means existing `npm install pkg` users on the `latest` channel keep getting `0.5.0` and are not affected. RC users opt in explicitly.

### Plan to 1.0

- ≥ 14 days under the `rc` tag
- ≥ 3 public dependents / feedback items
- No reported issue requires a breaking change

Reach the bar → publish `1.0.0` to `latest`. Find one that requires a breaking change → fix → `1.0.0-rc.2` and restart the clock.

## [0.5.0] — 2026-06-04

### Added

- **Query lifecycle events.** `createQuery` and `createInfiniteQuery` now expose `finished.success` and `finished.failure` effector events. React to a completed query directly from a `sample` — chain a follow-up load, show a toast on error, scroll to top:

  ```ts
  sample({ clock: userQuery.finished.success, target: loadSettings })
  ```

- **Global indicators**: new React hooks `useIsFetching()` and `useIsMutating()` that return the count of in-flight queries / mutations. Accept an optional `QueryFilters` / `MutationFilters` to narrow by key.

- **Cache action events**: `createCancel`, `createRemove`, `createReset` — declarative module-level events for `qc.cancelQueries` / `removeQueries` / `resetQueries`. Sample-friendly:

  ```ts
  const cancelUserQueries = createCancel({ queryKey: ['user', $userId] })
  sample({ clock: logoutClicked, target: cancelUserQueries })
  ```

### Changed

- `@tanstack/query-core` moved from `dependencies` to `peerDependencies` on `@effector-tanstack-query/core`. Make sure it is installed alongside the package — most setups already have it via `@tanstack/react-query` or directly.

## [0.4.0] — 2026-06-04

### Added

- **`createQueries({ source, query })`** — new factory that builds **one parallel query per item** of a reactive `source` store. Add or remove items and observers spawn / dispose automatically; reorder and nothing re-fetches. The "fetch details for each row of a list" pattern, made first-class.

- **`useQueries(...)`** — read multiple queries in a single hook. Accepts either a static tuple of factories (preserved per-element types) or a `createQueries` family.

- **`useSuspenseQueries(...)`** — Suspense variant of the same. Suspends until every query resolves, then renders with non-nullable `data`.

- Docs: new pages for `createQueries`, `useQueries`, `useSuspenseQueries`; new guide on query families.
- Examples: new `/family` route in the CSR demo and `/team` route in the SSR demo.

## [0.3.1] — 2026-05-16

### Fixed

- `useSuspenseQuery` and `useSuspenseInfiniteQuery` now work on server-RSC renders. The hooks read `$status` / `$data` / `$error` directly from effector stores when no observer can be materialised — SSR-prefetched data appears in server HTML with no `<Suspense>` fallback flash. Previously these hooks threw `"no QueryClient is set"` in that scenario.

### Added

- New `/suspense` route in the SSR example demonstrating Suspense + ErrorBoundary on top of SSR prefetch.

### Notes

- Only `@effector-tanstack-query/react` was bumped; `@effector-tanstack-query/core` stayed at 0.3.0.

## [0.3.0] — 2026-05-15

### Added

- **Stronger `queryKey` inference in `queryFn`.** `createQuery` / `createInfiniteQuery` capture the literal tuple shape of `queryKey` and unwrap effector `Store<U>` elements to `U` for the `queryFn` context — drops the `as string` casts users had to write inside `queryFn` when the key contained stores.

- **`@effector-tanstack-query/react/compat`** — new subpath export shipping `<QueryClientCompatProvider>` for running side-by-side with `@tanstack/react-query`. Bridges the effector scope's `$queryClient` to react-query's `QueryClientProvider` (with an SSR-safe per-render fallback) so the two libraries share a `QueryClient` cache. Supports incremental migration. `@tanstack/react-query` is wired as an **optional** peer dep.

- Docs: new "Migrating from `@tanstack/react-query`" guide. Both examples gained a `/migration` playground and `@tanstack/react-query-devtools` integration.
- SSR docs now recommend the **sibling `<HydrationBoundary>` pattern** (rendered as a flat side effect next to consumers rather than as a wrapper).

### Changed

- Minimum `@tanstack/query-core` version raised to `^5.100.10` so the workspace and consumers stay on one resolved copy when `@tanstack/react-query` (which pins query-core exactly) is installed alongside.

## [0.2.0] — 2026-05-14

### Added

- **`prefetchQueries(queries, { scope })`** — SSR helper on `@effector-tanstack-query/core` that runs `prefetch` followed by `mounted` for every query, making the "forgot to mount" footgun impossible to reach.

- **`<HydrationBoundary state={dehydratedState}>`** in `@effector-tanstack-query/react` — mirrors TanStack's API, merges the dehydrated query cache into the scope's `QueryClient` via `useMemo` (no `QueryClientProvider` needed).

- The React bundle now ships with a `"use client"` directive baked in, so importing the package directly from Next.js App Router server components works without consumer wrappers.

## [0.1.1] — 2026-05-13

### Fixed

- Manual re-publish of 0.1.0 contents under a new version: the previous tarball accidentally leaked `workspace:*` specifiers into `@effector-tanstack-query/react`'s dependencies. 0.1.0 was deprecated on npm.

### Added

- `.npmrc` opts into `link-workspace-packages` so local examples keep using workspace packages while their `package.json` pins to the published version.

## [0.1.0] — 2026-05-13

Initial public release.

### Added

- `@effector-tanstack-query/core`: `createQuery`, `createInfiniteQuery`, `createMutation`, `createInvalidate`, `setQueryClient` / `$queryClient`.
- `@effector-tanstack-query/react`: `useQuery`, `useInfiniteQuery`, `useMutation`, `useSuspenseQuery`, `useSuspenseInfiniteQuery`.
- Per-package READMEs for npm pages, project docs site, working CSR and SSR examples.

[1.0.0-rc.1]: https://github.com/ilyaagarkov/effector-tanstack-query/releases/tag/v1.0.0-rc.1
[0.5.0]: https://github.com/ilyaagarkov/effector-tanstack-query/releases/tag/v0.5.0
[0.4.0]: https://github.com/ilyaagarkov/effector-tanstack-query/releases/tag/v0.4.0
[0.3.1]: https://github.com/ilyaagarkov/effector-tanstack-query/releases/tag/v0.3.1
[0.3.0]: https://github.com/ilyaagarkov/effector-tanstack-query/releases/tag/v0.3.0
[0.2.0]: https://github.com/ilyaagarkov/effector-tanstack-query/releases/tag/v0.2.0
[0.1.1]: https://github.com/ilyaagarkov/effector-tanstack-query/releases/tag/v0.1.1
[0.1.0]: https://github.com/ilyaagarkov/effector-tanstack-query/releases/tag/v0.1.0
