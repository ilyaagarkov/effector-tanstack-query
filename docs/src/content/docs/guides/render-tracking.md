---
title: Re-renders and tracked results
description: Result hooks re-render a component only for the fields it reads. How tracking works, how to opt out, and the patterns it changes.
---

Every result hook — `useQuery`, `useInfiniteQuery`, `useQueries`, their Suspense variants, and `useMutation` — tracks which result fields a component reads, and re-renders it only when one of those fields changes.

```tsx
function TodoTitle() {
  const { data } = useQuery(todoQuery)
  return <h1>{data?.title}</h1>
}
```

A background refetch flips `isFetching` and `fetchStatus` twice. This component reads neither, so it doesn't re-render — unless the refetch returns different `data`. That's the default behaviour of `useQuery` from `@tanstack/react-query` too.

Tracking only filters React re-renders. The effector stores (`query.$data`, `query.$isFetching`, …) still receive every update, so `sample`, `combine` and other model logic see all of them.

## How a field gets tracked

The result is a plain object with the values of the current render, wrapped in a `Proxy` — the same approach as `@tanstack/react-query`. Reading a field adds it to the component's tracked set:

- **During render** — the usual case: destructuring, `result.data`, a conditional `result.isError && result.error`.
- **Later** — a field first read in an event handler or an effect returns its value as of the render and is tracked from that moment on.

The set only grows: once a field has been read, changes to it re-render the component until it unmounts.

`useQueries` and `useSuspenseQueries` track per item and per field. Reading `results[0].data` re-renders on the first query's data only. A different tuple, or a family source adding or removing items, always re-renders.

The Suspense hooks always re-render when a query goes back to `pending` or fails, whatever the component reads — that's how they suspend again or throw to the error boundary.

## Choosing the fields

Every result hook accepts `notifyOnChangeProps` in an options object as its last argument:

- `'tracked'` (default) — the fields the component reads.
- `'all'` — every field, as in 1.x.
- A list of fields — only those, whatever the component reads.

```tsx
// Re-render on every field.
const result = useQuery(todoQuery, { notifyOnChangeProps: 'all' })

// Re-render on `data` and `error` only. `isFetching` is still readable —
// it holds the value as of the last render — but doesn't re-render.
const { data, error, isFetching } = useQuery(todoQuery, {
  notifyOnChangeProps: ['data', 'error'],
})
```

The list is typed to the hook's result fields, without callbacks such as `refresh`. A new array on every render is fine — lists with the same fields are the same setting. In `useQueries` / `useSuspenseQueries` the list applies to every item.

```ts
type NotifyOnChangeProps<TField> = 'tracked' | 'all' | ReadonlyArray<TField>

interface ResultHookOptions<TResult> {
  notifyOnChangeProps?: NotifyOnChangeProps<ResultField<TResult>>
}
```

The Suspense hooks re-render on `status` even when the list leaves it out, so they can still suspend or throw.

## Patterns to watch

### Relying on the re-render itself

Reads keep working wherever they happen: a field read in a handler or an effect returns its value as of the render and subscribes the component from then on. What changes is the re-render as a signal — a component no longer re-renders for fields nobody read.

```tsx
function Page() {
  const { data } = useQuery(todoQuery)

  // ❌ Ran after every refetch in 1.x (isFetching flipped twice).
  // Now runs only when `data` changes.
  React.useEffect(() => {
    analytics.track('todo-rendered')
  })

  return <Todo todo={data} />
}
```

Subscribe to the field you actually react to, or move the reaction to the model:

```tsx
const { isFetching } = useQuery(todoQuery)
React.useEffect(() => {
  if (!isFetching) analytics.track('todo-refetched')
}, [isFetching])

// or, outside React:
sample({ clock: todoQuery.finished.success, target: trackRefetchFx })
```

Render-count assertions in tests (`<Profiler>`, `renderHook`) see fewer renders for the same reason.

A result object holds the values of the render that produced it. One kept from an earlier render — in a ref, a timer — shows those values: React's usual stale-closure rule. Take the result from the latest render as you would any other value.

### Spreading the result

Object rest, `{...result}`, `Object.values` / `Object.entries` and `JSON.stringify(result)` read every field, so the component re-renders on all of them:

```tsx
const { data, ...rest } = useQuery(todoQuery) // tracks every field
<TodoView {...useQuery(todoQuery)} />          // tracks every field
```

That's correct, just without the optimisation. Pass the fields the child needs instead. (`Object.keys` and `for…in` only list the fields and track nothing.)

`structuredClone(result)` throws a `DataCloneError`, as with any `Proxy`. Clone `{ ...result }` instead — which, as above, tracks every field.

### Logging the result

`console.log(result)` prints the values and tracks nothing — logging a result doesn't change what re-renders the component.

### Family sources made of objects

A `createQueries` family treats an item whose `source` is a different value (by `Object.is`) as a new item, and always re-renders. If the source store produces new objects for the same items on every update, family consumers re-render on every update regardless of tracking. Use primitive ids, or keep object identities stable.

## Differences from `@tanstack/react-query`

The default matches: fields are tracked on first read, the set only grows, and changes are compared by reference. The differences:

| | `@tanstack/react-query` | effector-tanstack-query |
| --- | --- | --- |
| Where the option goes | Query options: `useQuery({ queryKey, notifyOnChangeProps })`, or `QueryClient` `defaultOptions` | Second argument of the hook: `useQuery(query, { notifyOnChangeProps })` |
| Values | Array of fields, `'all'`, or a function returning one | `'tracked'` (default), `'all'`, or an array of fields — no function form |
| Global default | Yes, via `defaultOptions` | No — per hook call |
| `useMutation` | Re-renders on every change | Tracked, like the query hooks |
| What is filtered | The observer skips notifying its listeners | Only React re-renders; effector stores get every update |
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
