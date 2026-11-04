import { createRequire } from 'node:module'
import { expect, it } from 'vitest'
import { tanstackAtLeast, tanstackVersion } from './tanstackVersion'

it('reads the installed @tanstack/query-core version', () => {
  const require = createRequire(import.meta.url)
  expect(tanstackVersion).toBe(
    require('@tanstack/query-core/package.json').version,
  )
  expect(tanstackVersion).toMatch(/^5\.\d+\.\d+/)
})

it('compares versions numerically', () => {
  expect(tanstackAtLeast('5.0.0')).toBe(true)
  expect(tanstackAtLeast(tanstackVersion)).toBe(true)
  expect(tanstackAtLeast('6.0.0')).toBe(false)
  const [, minor] = tanstackVersion.split('.').map(Number)
  // 5.9 < 5.10: a string comparison would get this wrong.
  expect(tanstackAtLeast(`5.${minor! + 1}.0`)).toBe(false)
})
