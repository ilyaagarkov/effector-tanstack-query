// Loads every entry of the current package's `exports` map from dist/, as
// ESM (`import`) and CJS (`require`).
//
// Tests run against src/ through a vitest alias, so they can't see a broken
// bundle. The file-path-extensions plugin keeps internal imports external
// (`./tracked.js`), so a source file missing from tsup's `entry` ships as a
// dangling import that only fails for consumers. Loading the real files
// catches that.
//
// Usage (from a package directory, after `build`): node ../../scripts/check-dist.mjs

import { readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { resolve } from 'node:path'
import { pathToFileURL } from 'node:url'

const root = process.cwd()
const pkg = JSON.parse(readFileSync(resolve(root, 'package.json'), 'utf8'))
const require = createRequire(resolve(root, 'package.json'))

const failures = []
let loaded = 0

for (const [subpath, conditions] of Object.entries(pkg.exports ?? {})) {
  if (typeof conditions !== 'object') continue // e.g. "./package.json"
  const targets = [
    ['import', conditions.import?.default],
    ['require', conditions.require?.default],
  ]
  for (const [kind, target] of targets) {
    if (!target) continue
    const file = resolve(root, target)
    try {
      const mod =
        kind === 'import'
          ? await import(pathToFileURL(file).href)
          : require(file)
      if (Object.keys(mod).length === 0) {
        throw new Error('module has no exports')
      }
      loaded++
    } catch (error) {
      failures.push(`${pkg.name} ${subpath} (${kind}: ${target}): ${error.message}`)
    }
  }
}

if (failures.length > 0) {
  console.error(`✗ dist check failed:\n  ${failures.join('\n  ')}`)
  process.exit(1)
}
console.log(`✓ ${pkg.name}: ${loaded} dist entries load`)
