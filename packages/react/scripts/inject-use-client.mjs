// Prepends the React Server Components `"use client"` directive to the
// built ESM + CJS bundles so consumers can import these hooks (and
// <HydrationBoundary>) directly from server components in Next.js App
// Router. esbuild (tsup's bundler) strips top-level directives during
// bundling, and its `banner` option does not always survive — running a
// dedicated post-build step keeps the directive guaranteed.

import { readFileSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'

const here = dirname(fileURLToPath(import.meta.url))
const dist = resolve(here, '..', 'dist')

for (const file of ['index.js', 'index.cjs', 'compat.js', 'compat.cjs']) {
  const path = resolve(dist, file)
  const contents = readFileSync(path, 'utf8')
  if (contents.startsWith('"use client"') || contents.startsWith("'use client'")) {
    continue
  }
  writeFileSync(path, `"use client";\n${contents}`)
  console.log(`✓ injected "use client" into dist/${file}`)
}
