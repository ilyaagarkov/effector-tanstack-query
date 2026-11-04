---
title: Installation
description: Install effector-tanstack-query packages and their peer dependencies.
---

The library ships as two scoped packages:

- **`@effector-tanstack-query/core`** — the effector adapter (works without React)
- **`@effector-tanstack-query/react`** — `useQuery` / `useMutation` / Suspense hooks

Install whichever you need (React package depends on core automatically).

## Core only (no React)

```bash
npm install @effector-tanstack-query/core @tanstack/query-core effector
# or
pnpm add @effector-tanstack-query/core @tanstack/query-core effector
# or
yarn add @effector-tanstack-query/core @tanstack/query-core effector
```

## With React hooks

```bash
npm install \
  @effector-tanstack-query/core \
  @effector-tanstack-query/react \
  @tanstack/query-core \
  effector \
  effector-react \
  react react-dom
```

## Peer dependencies

| Package           | Required by  | Min version                  |
| ----------------- | ------------ | ---------------------------- |
| `effector`        | core, react  | `>= 23.0.0`                  |
| `@tanstack/query-core` | core    | `>= 5.0.0`                   |
| `effector-react`  | react        | `>= 23.0.0`                  |
| `react`           | react        | `^18.0.0` or `^19.0.0`       |

## TanStack Query versions

Both packages work with every `@tanstack/query-core` 5.x release. CI runs
the runtime tests on versions from 5.0.0 to the latest, and the type tests on
5.80 and later. Some behavior comes from TanStack itself, so it needs the
version that added it:

| Behavior | Since |
| -------- | ----- |
| A changed `mutationKey` resets a mutation's observer | 5.14 |
| A refetch of a factory query uses its latest options (`queryFn`, …) | 5.28 |
| `$isFetchNextPageError` / `$isFetchPreviousPageError` (always `false` before) | 5.36 |
| Callback `enabled` (`(query) => boolean`) on mounted queries; `prefetch` evaluates it on any version | 5.48 |
| `mutationOptions` from `@tanstack/react-query` | 5.82 |
| Mutation callbacks receive a context (`{ client, meta, mutationKey }`) | 5.89 |

Types follow the installed version. Before 5.80, the page param of an
infinite query's `$observer` is `unknown`; the rest of the API is typed as
on newer versions, within what that release's typings express.

## TypeScript

TypeScript is optional but recommended. The library is written in TS and ships full `.d.ts`. `select`-narrowing, generic inference, and `expectTypeOf` tests are part of the suite.

Minimum supported TypeScript: **5.0**.
