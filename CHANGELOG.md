# Changelog

All notable changes to this project are documented here. The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and the project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

Both `@effector-tanstack-query/core` and `@effector-tanstack-query/react` share this changelog. Per-release version numbers below indicate which package shipped which change; entries for a single package mention the other staying at its previous version.

## [Unreleased]

### Breaking

- **Result hooks re-render only for the fields a component reads** ([#27](https://github.com/ilyaagarkov/effector-tanstack-query/issues/27)) — `@effector-tanstack-query/react`. `useQuery`, `useQueries`, `useInfiniteQuery`, `useMutation`, `useSuspenseQuery`, `useSuspenseQueries` and `useSuspenseInfiniteQuery` used to subscribe to every result store, so a component reading only `data` re-rendered twice on each background refetch (`isFetching` on, then off). They now track the fields read and skip the rest, matching the default of `@tanstack/react-query`.

  Tracking is per item and per field in `useQueries` / `useSuspenseQueries`. The Suspense hooks still always re-render when a query goes back to `pending` or fails, so suspending and error boundaries work whatever the component reads. Effector stores are unaffected: `query.$isFetching` and the rest still receive every update.

- **Suspense hooks keep rendering data when a refetch fails** — `@effector-tanstack-query/react`. `useSuspenseQuery`, `useSuspenseInfiniteQuery` and `useSuspenseQueries` threw every query error to the error boundary, even when the query still had data. Now an error is thrown only when there is no data — `@tanstack/react-query`'s default. After a failed refetch the hook returns the data with `status: 'error'`, `isError: true` and `error` set. `UseSuspenseQueryResult` / `UseSuspenseInfiniteQueryResult` are now unions on `status` (`isError` narrows `error` to `TError`) instead of always `'success'`.

- **`notifyOnChangeProps` removed from factory option types** — `@effector-tanstack-query/core`. `createQuery`, `createInfiniteQuery`, `createQueries` items, `queryOptions` and `infiniteQueryOptions` accepted it, but the observer always forced `'all'` so the model stores stay current, and the value was silently ignored. It's now a type error; set it on the React hook instead. Options objects built elsewhere (e.g. native `@tanstack/react-query` helpers) are still accepted, and the value is still ignored.

### Fixed

- **`onMutate` result types reach per-call callbacks** ([#21](https://github.com/ilyaagarkov/effector-tanstack-query/issues/21)) — both packages. `createMutation` accepted the type of `onMutate`'s result but returned `MutationResult<TData, TError, TVariables>` without it, so the third argument of `mutateWith`'s `onSuccess` / `onError` / `onSettled` was `unknown`. `MutationResult`, `UseMutationResult` and `useMutation` now carry `TOnMutateResult` (default `unknown`), and the callbacks receive `TOnMutateResult | undefined`, as upstream. Existing three-generic calls and annotations still compile. New exported type: `MutateWithParams`.

- **`createQueries` accepts ready-made options factories** ([#23](https://github.com/ilyaagarkov/effector-tanstack-query/issues/23)) — `@effector-tanstack-query/core`. The item options typed `enabled` as `boolean`, so `query: todoOptions` failed with any `queryOptions` helper (ours or `@tanstack/react-query`'s), whose output allows `boolean | ((query) => boolean)`. `enabled` now has TanStack's type, and `prefetch` evaluates a callback `enabled` like `createQuery` does — a disabled or throwing callback skips that item. Item observers also always notify on every change, so a narrower `notifyOnChangeProps` in the client's defaults or in options built elsewhere no longer leaves `$items` stale.

### Added

- **Mutation options factories** ([#22](https://github.com/ilyaagarkov/effector-tanstack-query/issues/22)) — `@effector-tanstack-query/core`. `createMutation({ source, mutation })` (with or without an explicit `QueryClient`) reuses an existing mutation options factory with reactive parameters: `source` is a store or a shallow shape of stores, `mutation` receives their plain values. Data, error (including a registered default), variables and the `onMutate` result are inferred from the returned options. Options follow the source the way `useMutation(options(params))` does on re-render: they apply to the next call through `MutationObserver.setOptions`, a pending call gets the new options, and a new `mutationKey` resets the observer. A throwing factory fails the next call with its error. Mixing inline options into the factory form is a type error. The inline form is unchanged. New exports: `mutationOptions` (a typed identity helper that depends only on `@tanstack/query-core`), `CreateMutationFactoryOptions`, `MutationFactoryInput`, `MutationFactoryCheck`, `InferMutationTypes`, `InferMutationResult`, `MutationOptionsWithKey`, `MutationOptionsWithoutKey`.

- **`notifyOnChangeProps` option** on every result hook: `'tracked'` (default), `'all'` to re-render on every field as in 1.x, or a list of fields (`['data', 'error']`) to re-render on those only, whatever the component reads. The list is typed to the hook's result fields. Exported types: `NotifyOnChangeProps`, `ResultHookOptions`, `ResultField`.

### Migrating

Most components need no change — they read their fields during render and simply re-render less. Check code that relies on a re-render for a field it doesn't read during render:

- **Effects without a dependency list** used as "on any query change" — they ran after each refetch (`isFetching` flipped twice) and now run only when a read field changes. Subscribe to the field (`useEffect(..., [isFetching])`), move the reaction to the model (`sample({ clock: q.finished.success, ... })`), or pass `{ notifyOnChangeProps: 'all' }`.
- **Render-count assertions** in tests (Profiler, `renderHook`) see fewer renders.

Reads in handlers and effects keep working: a field read there returns its value as of the render and is tracked from then on. Spreading the result (`{...result}`, object rest) and `JSON.stringify(result)` read every field, so those components keep re-rendering on all of them. The result is a `Proxy`, as in `@tanstack/react-query`: `console.log(result)` shows the values without tracking them, and `structuredClone(result)` throws — clone `{ ...result }` instead. See [Re-renders and tracked results](https://ilyaagarkov.github.io/effector-tanstack-query/guides/render-tracking/).

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
