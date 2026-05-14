import { defineConfig } from 'tsup'
import { esbuildPluginFilePathExtensions } from 'esbuild-plugin-file-path-extensions'

export default defineConfig({
  // Multi-entry so the file-path-extensions plugin emits one .js per source
  // file (it rewrites internal imports to `.js`, expecting the targets to
  // exist on disk). Single-entry would leave dangling `./createQuery.js`
  // imports in dist/index.js with no sibling file to resolve them.
  entry: [
    'src/index.ts',
    'src/createQuery.ts',
    'src/createInfiniteQuery.ts',
    'src/createMutation.ts',
    'src/createBaseQuery.ts',
    'src/createInvalidate.ts',
    'src/queryClient.ts',
    'src/prefetchQueries.ts',
    'src/resolve.ts',
    'src/types.ts',
  ],
  format: ['cjs', 'esm'],
  target: ['es2020', 'node18'],
  outDir: 'dist',
  dts: true,
  sourcemap: true,
  clean: true,
  splitting: false,
  treeshake: true,
  esbuildPlugins: [esbuildPluginFilePathExtensions({ esmExtension: 'js' })],
})
