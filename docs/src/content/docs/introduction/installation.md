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

## TypeScript

TypeScript is optional but recommended. The library is written in TS and ships full `.d.ts`. `select`-narrowing, generic inference, and `expectTypeOf` tests are part of the suite.

Minimum supported TypeScript: **5.0**.
