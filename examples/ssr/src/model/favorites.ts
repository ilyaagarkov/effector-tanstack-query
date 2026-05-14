import { createEvent, createStore } from 'effector'

/**
 * Demo store for "favorited pokemon". Lives in the singleton client scope
 * managed by `@effector/next`, so its value survives App Router client-side
 * navigations — toggle a favorite on `/pokemon/pikachu`, navigate to `/`,
 * the count stays.
 *
 * Server-side: each request gets a fresh scope, so server-rendered HTML
 * always shows the default `[]`. The browser's singleton takes over on
 * mount, and any toggles made before navigation are preserved.
 */
export const favoriteToggled = createEvent<string>()

export const $favorites = createStore<Array<string>>([], {
  name: 'favorites',
}).on(favoriteToggled, (current, name) =>
  current.includes(name)
    ? current.filter((n) => n !== name)
    : [...current, name],
)
