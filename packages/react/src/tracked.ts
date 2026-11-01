import * as React from 'react'
import { createWatch } from 'effector'
import { useProvidedScope } from 'effector-react'
import type { Scope, Store } from 'effector'

/**
 * Which result fields re-render the component:
 *
 *   - `'tracked'` (default) — only the fields the component read. A field
 *     joins the set the first time it's read, during render or later (e.g.
 *     in an event handler), and stays in it.
 *   - `'all'` — any field.
 */
export type NotifyOnChangeProps = 'tracked' | 'all'

export interface ResultHookOptions {
  notifyOnChangeProps?: NotifyOnChangeProps
}

/** One result's field values, keyed by field name. */
export type Row = Record<string, unknown>

interface Snapshot {
  rows: ReadonlyArray<Row>
}

interface TrackedRowsConfig {
  /** Snapshot identity — a new one is produced when any of these changes. */
  deps: ReadonlyArray<unknown>
  subscribe: (notify: () => void) => () => void
  read: () => ReadonlyArray<Row>
  mode: NotifyOnChangeProps | undefined
  /** Fields the hook itself reads (e.g. `status` for the Suspense gate). */
  always?: ReadonlyArray<string>
  /** Rows that aren't the same entity always re-render (family items). */
  sameRow?: (a: Row, b: Row) => boolean
}

export interface TrackedRows {
  snapshot: Snapshot
  track: (row: number, field: string) => void
}

const useIsomorphicLayoutEffect =
  typeof window === 'undefined' ? React.useEffect : React.useLayoutEffect

/**
 * Keeps the committed array while its elements are the same. Compared
 * against the last *committed* render, so a render that never commits (a
 * suspended transition) can't replace it.
 */
function useStableDeps(deps: ReadonlyArray<unknown>): ReadonlyArray<unknown> {
  const committed = React.useRef(deps)
  const prev = committed.current
  const stable =
    prev.length === deps.length && deps.every((dep, i) => Object.is(dep, prev[i]))
      ? prev
      : deps
  useIsomorphicLayoutEffect(() => {
    committed.current = stable
  })
  return stable
}

function rowsChanged(
  prev: ReadonlyArray<Row>,
  next: ReadonlyArray<Row>,
  tracked: ReadonlyArray<Set<string> | undefined> | null,
  always: ReadonlyArray<string>,
  sameRow: TrackedRowsConfig['sameRow'],
): boolean {
  if (prev.length !== next.length) return true
  for (let i = 0; i < next.length; i++) {
    const a = prev[i]!
    const b = next[i]!
    if (a === b) continue
    if (sameRow && !sameRow(a, b)) return true
    if (tracked === null) {
      for (const field in b) if (!Object.is(a[field], b[field])) return true
      continue
    }
    for (const field of always) if (!Object.is(a[field], b[field])) return true
    const fields = tracked[i]
    if (fields) {
      for (const field of fields) if (!Object.is(a[field], b[field])) return true
    }
  }
  return false
}

/**
 * The tracking core behind every result hook.
 *
 * `useSyncExternalStore` re-renders when `getSnapshot` returns a new object,
 * so the snapshot is replaced only when a field that matters changed. Other
 * changes still refresh `rows` in place: a render caused by something else
 * (a parent, a tracked field) and a handler reading a field late both see
 * current values, without a commit of their own.
 */
export function useTrackedRows(config: TrackedRowsConfig): TrackedRows {
  const deps = useStableDeps(config.deps)
  const mode = config.mode ?? 'tracked'
  // `read` / `subscribe` close over exactly what `deps` lists, so the config
  // is pinned to them. A render that never commits gets its own closures and
  // can't leak them into the committed subscription.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const pinned = React.useMemo(() => config, [deps, mode])

  const trackedRef = React.useRef<Array<Set<string> | undefined>>([])
  // One cached snapshot per `deps`: an uncommitted render's snapshot must
  // not stand in for the committed one.
  const cacheRef = React.useRef<WeakMap<object, Snapshot> | null>(null)
  cacheRef.current ??= new WeakMap()

  const subscribe = React.useCallback(
    (notify: () => void) => pinned.subscribe(notify),
    [pinned],
  )

  const getSnapshot = React.useCallback((): Snapshot => {
    const { read, always = [], sameRow } = pinned
    const cache = cacheRef.current!
    const rows = read()
    const prev = cache.get(deps)
    if (
      prev &&
      !rowsChanged(
        prev.rows,
        rows,
        mode === 'all' ? null : trackedRef.current,
        always,
        sameRow,
      )
    ) {
      prev.rows = rows
      return prev
    }
    const next = { rows }
    cache.set(deps, next)
    return next
    // `pinned` changes exactly when `deps` / `mode` do.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pinned])

  const snapshot = React.useSyncExternalStore(
    subscribe,
    getSnapshot,
    getSnapshot,
  )

  const track = React.useCallback((row: number, field: string) => {
    ;(trackedRef.current[row] ??= new Set()).add(field)
  }, [])

  return { snapshot, track }
}

export function readStore<T>(store: Store<T>, scope: Scope | null): T {
  return scope ? scope.getState(store) : store.getState()
}

export function watchStores(
  stores: ReadonlyArray<Store<unknown>>,
  scope: Scope | null,
  notify: () => void,
): () => void {
  if (stores.length === 0) return () => {}
  return createWatch({
    unit: stores as Array<Store<unknown>>,
    fn: notify,
    scope: scope ?? undefined,
    batch: true,
  })
}

/** Field name → effector store, e.g. `{ data: query.$data }`. */
export type StoreRow = Record<string, Store<unknown>>

/** `{ data: query.$data, ... }` for the given field names. */
export function storeRow(
  source: object,
  fields: ReadonlyArray<string>,
): StoreRow {
  const row: StoreRow = {}
  for (const field of fields) {
    row[field] = (source as Record<string, Store<unknown>>)[`$${field}`]!
  }
  return row
}

export function readRow(stores: StoreRow, scope: Scope | null): Row {
  const row: Row = {}
  for (const field in stores) row[field] = readStore(stores[field]!, scope)
  return row
}

/** Tracked rows read straight from effector stores in the provided scope. */
export function useStoreRows(
  rows: ReadonlyArray<StoreRow>,
  mode: NotifyOnChangeProps | undefined,
): TrackedRows {
  const scope = useProvidedScope()
  const stores = rows.flatMap((row) => Object.values(row))
  return useTrackedRows({
    deps: [scope, ...stores],
    subscribe: (notify) => watchStores(stores, scope, notify),
    read: () => rows.map((row) => readRow(row, scope)),
    mode,
  })
}

/**
 * Builds a result object whose `fields` are enumerable getters that record
 * the read. Spreading it reads — and so tracks — every field. `extras`
 * (callbacks, constants) are plain properties.
 */
export function trackedResult<T>(
  fields: ReadonlyArray<string>,
  read: (field: string) => unknown,
  track: (field: string) => void,
  extras: object,
): T {
  const result = {} as Record<string, unknown>
  for (const field of fields) {
    Object.defineProperty(result, field, {
      enumerable: true,
      configurable: true,
      get() {
        track(field)
        return read(field)
      },
    })
  }
  return Object.assign(result, extras) as T
}
