import { defineConfig } from 'tsup'
import { esbuildPluginFilePathExtensions } from 'esbuild-plugin-file-path-extensions'

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['cjs', 'esm'],
  target: ['es2020', 'node18'],
  outDir: 'dist',
  // Use a paths-free tsconfig for DTS so tsc resolves @effector-tanstack-query/core
  // via package.json (dist/index.d.ts), not via the dev-only path mapping.
  tsconfig: './tsconfig.build.json',
  dts: true,
  sourcemap: true,
  clean: true,
  splitting: false,
  treeshake: true,
  external: ['@effector-tanstack-query/core', 'effector', 'effector-react', 'react'],
  esbuildPlugins: [esbuildPluginFilePathExtensions({ esmExtension: 'js' })],
})
