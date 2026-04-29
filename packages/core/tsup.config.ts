import { defineConfig } from 'tsup'
import { esbuildPluginFilePathExtensions } from 'esbuild-plugin-file-path-extensions'

export default defineConfig({
  entry: ['src/index.ts'],
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
