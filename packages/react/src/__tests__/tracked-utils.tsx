// Shared helpers for the tracked-result tests (issue #27).
//
// Updates are counted as React commits via <Profiler>, so StrictMode's double
// render doesn't skew the numbers. Fetches are driven by controlled promises
// so request start and completion land in separate commits.
import { vi } from 'vitest'
import { act, render } from '@testing-library/react'
import type { RenderResult } from '@testing-library/react'
import * as React from 'react'
import { Provider } from 'effector-react'
import type { Scope } from 'effector'

export type Todo = { id: number }

export interface Deferred<T> {
  promise: Promise<T>
  resolve: (value: T) => void
  reject: (error: unknown) => void
}

export function deferred<T>(): Deferred<T> {
  let resolve!: (value: T) => void
  let reject!: (error: unknown) => void
  const promise = new Promise<T>((res, rej) => {
    resolve = res
    reject = rej
  })
  return { promise, resolve, reject }
}

/** Queue of pending responses; each queryFn call takes the next one. */
export function controlledFn<T>() {
  const calls: Array<Deferred<T>> = []
  const fn = vi.fn(() => {
    const d = deferred<T>()
    calls.push(d)
    return d.promise
  })
  return { fn, last: () => calls[calls.length - 1]! }
}

/** Lets effector effects, observer notifications and React commits settle. */
export async function flush() {
  await act(async () => {
    for (let i = 0; i < 5; i++) await new Promise((r) => setTimeout(r, 0))
  })
}

export interface Counter {
  commits: number
}

export function Counted({
  counter,
  children,
}: {
  counter: Counter
  children: React.ReactNode
}) {
  return (
    <React.Profiler id="counted" onRender={() => counter.commits++}>
      {children}
    </React.Profiler>
  )
}

export function renderCounted(
  ui: React.ReactElement,
  { scope, strict = false }: { scope?: Scope; strict?: boolean } = {},
): RenderResult & { counter: Counter } {
  const counter: Counter = { commits: 0 }
  let tree = <Counted counter={counter}>{ui}</Counted>
  if (scope) tree = <Provider value={scope}>{tree}</Provider>
  if (strict) tree = <React.StrictMode>{tree}</React.StrictMode>
  const rendered = render(tree)
  return { ...rendered, counter }
}

/** Commits caused by `fn`, after the tree has settled. */
export async function commitsDuring(counter: Counter, fn: () => Promise<void>) {
  const before = counter.commits
  await fn()
  return counter.commits - before
}
