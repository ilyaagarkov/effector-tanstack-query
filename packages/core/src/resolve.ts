import { combine, createStore, is } from 'effector'
import type { Store } from 'effector'
import type { QueryKey } from '@tanstack/query-core'
import type { EffectorQueryKey, StoreOrValue } from './types'

export function resolveKey(key: EffectorQueryKey): Store<QueryKey> {
  const storePositions: Array<number> = []
  const stores: Array<Store<unknown>> = []

  key.forEach((item, i) => {
    if (is.store(item)) {
      storePositions.push(i)
      stores.push(item as Store<unknown>)
    }
  })

  if (stores.length === 0) {
    return createStore(key as QueryKey)
  }

  return combine(stores).map((values) =>
    key.map((item, i) => {
      const storeIdx = storePositions.indexOf(i)
      return storeIdx >= 0 ? values[storeIdx] : item
    }),
  ) as Store<QueryKey>
}

export function resolveEnabled(
  enabled: StoreOrValue<boolean> | undefined,
): Store<boolean> {
  if (is.store(enabled)) return enabled
  return createStore(enabled ?? true)
}
