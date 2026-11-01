---
title: Re-renders and tracked results
description: Result hooks re-render a component only for the fields it reads. How tracking works, how to opt out, and the patterns it changes.
---

Every result hook — `useQuery`, `useQueries`, `useInfiniteQuery`, `useMutation` and their Suspense variants — tracks which result fields a component reads, and re-renders it only when one of those fields changes.

```tsx
function TodoTitle() {
  const { data } = useQuery(todoQuery)
  return <h1>{data?.title}</h1>
}
```

A background refetch flips `isFetching` and `fetchStatus` twice. This component reads neither, so it doesn't re-render — unless the refetch returns different `data`. That's the default behaviour of `useQuery` from `@tanstack/react-query` too.

Tracking only filters React re-renders. The effector stores (`query.$data`, `query.$isFetching`, …) still receive every update, so `sample`, `combine` and other model logic see all of them.

## How a field gets tracked

The result object exposes its fields as getters. Reading one adds it to the component's tracked set:

- **During render** — the usual case: destructuring, `result.data`, a conditional `result.isError && result.error`.
- **Later** — a field first read in an event handler or an effect is tracked from that moment on.

The set only grows: once a field has been read, changes to it re-render the component until it unmounts.

`useQueries` and `useSuspenseQueries` track per item and per field. Reading `results[0].data` re-renders on the first query's data only. A different tuple, or a family source adding or removing items, always re-renders.

The Suspense hooks always re-render when a query goes back to `pending` or fails, whatever the component reads — that's how they suspend again or throw to the error boundary.

## Opting out

Pass `notifyOnChangeProps: 'all'` to re-render on every field, as in 1.x:

```tsx
const result = useQuery(todoQuery, { notifyOnChangeProps: 'all' })
```

Every result hook accepts the same option as its last argument:

```ts
type NotifyOnChangeProps = 'tracked' | 'all' // default: 'tracked'

interface ResultHookOptions {
  notifyOnChangeProps?: NotifyOnChangeProps
}
```

## Patterns to watch

### Fields read only outside render

A field that isn't read during render doesn't re-render the component when it changes. Code that relied on that re-render stops working:

```tsx
function SaveStatus() {
  const result = useQuery(todoQuery)
  const ref = React.useRef(result)
  ref.current = result

  // ❌ `isError` is never read during render, so the component doesn't
  // re-render when it changes, and this effect never re-runs.
  React.useEffect(() => {
    if (ref.current.isError) toast.error('Failed to load')
  })
  return null
}
```

Read the field during render — typically as an effect dependency:

```tsx
const { isError } = useQuery(todoQuery)
React.useEffect(() => {
  if (isError) toast.error('Failed to load')
}, [isError])
```

For reactions that don't belong to a component, prefer the model: `sample({ clock: todoQuery.finished.failure, target: showToastFx })`.

### Spreading the result

Object rest, `{...result}`, `Object.keys(result)` and `JSON.stringify(result)` read every field, so the component re-renders on all of them:

```tsx
const { data, ...rest } = useQuery(todoQuery) // tracks every field
<TodoView {...useQuery(todoQuery)} />          // tracks every field
```

That's correct, just without the optimisation. Pass the fields the child needs instead.

### Debugging changes what's tracked

`console.log(result)` and inspecting the hook in React DevTools read every getter. After that the component re-renders on all fields. If a component re-renders more while you debug it, this is why. Log individual fields (`console.log(result.data)`) instead.

### Family sources made of objects

A `createQueries` family treats an item whose `source` is a different value (by `Object.is`) as a new item, and always re-renders. If the source store produces new objects for the same items on every update, family consumers re-render on every update regardless of tracking. Use primitive ids, or keep object identities stable.

### Values read outside render

Inside event handlers and effects, prefer values read during render. A field read there for the first time returns a current value. Once a tracked field changes, the component re-renders and handlers from that render see the new result.

## Differences from `@tanstack/react-query`

The default matches: fields are tracked on first read, the set only grows, and changes are compared by reference. The differences:

| | `@tanstack/react-query` | effector-tanstack-query |
| --- | --- | --- |
| Where the option goes | Query options: `useQuery({ queryKey, notifyOnChangeProps })`, or `QueryClient` `defaultOptions` | Second argument of the hook: `useQuery(query, { notifyOnChangeProps })` |
| Values | Array of fields, `'all'`, or a function | `'tracked'` (default) or `'all'` |
| Global default | Yes, via `defaultOptions` | No — per hook call |
| `useMutation` | Re-renders on every change | Tracked, like the query hooks |
| What is filtered | The observer skips notifying its listeners | Only React re-renders; effector stores get every update |
| Reading a field in a handler | The render's value | The current value, until a tracked field changes and the component re-renders |
| Result fields | ~25 (`dataUpdatedAt`, `isStale`, `refetch`, …) | The fields listed on each hook's page |

Two consequences for migrations:

- `notifyOnChangeProps` in `createQuery` / `createInfiniteQuery` / `createQueries` options or `queryOptions(...)` is a type error. Options built elsewhere (a native helper shared with `@tanstack/react-query`) are accepted, and the value is ignored — the model stores always see every change.
- A `notifyOnChangeProps` in the shared `QueryClient`'s `defaultOptions` affects `@tanstack/react-query` hooks only, not these ones.

## Reading single stores directly

To subscribe to one field without the hook — e.g. a component that only shows a spinner — use the store with `useUnit`. Nothing besides `$isFetching` reaches the component:

```tsx
import { useUnit } from 'effector-react'

function Spinner() {
  const isFetching = useUnit(todoQuery.$isFetching)
  return isFetching ? <Loader /> : null
}
```

`useUnit` doesn't mount the query: some other component must call `useQuery(todoQuery)`, or the model must call `todoQuery.mounted()`.
