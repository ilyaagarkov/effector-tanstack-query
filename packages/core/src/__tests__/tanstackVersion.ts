// The installed @tanstack/query-core version. CI runs the suites against
// several 5.x versions (see .github/workflows/compat.yml); tests of behavior
// that TanStack added later are skipped below the version that has it.
import { createRequire } from 'node:module'

const require = createRequire(import.meta.url)

export const tanstackVersion: string = require(
  '@tanstack/query-core/package.json',
).version

function parse(version: string): [number, number, number] {
  const [major = 0, minor = 0, patch = 0] = version
    .split('-')[0]!
    .split('.')
    .map(Number)
  return [major, minor, patch]
}

/** `true` when the installed version is at least `version`. */
export function tanstackAtLeast(version: string): boolean {
  const installed = parse(tanstackVersion)
  const wanted = parse(version)
  for (let i = 0; i < 3; i++) {
    if (installed[i]! !== wanted[i]!) return installed[i]! > wanted[i]!
  }
  return true
}
