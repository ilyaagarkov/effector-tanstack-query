import { defineConfig } from 'tsup'
import { esbuildPluginFilePathExtensions } from 'esbuild-plugin-file-path-extensions'

export default defineConfig({
  entry: ['src/index.ts', 'src/compat.tsx'],
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
  // `@tanstack/react-query` is optional — only `./compat` imports it, and
  // `peerDependenciesMeta` marks it optional so non-migrating users don't
  // need it installed.
  external: [
    '@effector-tanstack-query/core',
    '@tanstack/react-query',
    'effector',
    'effector-react',
    'react',
  ],
  esbuildPlugins: [esbuildPluginFilePathExtensions({ esmExtension: 'js' })],
})
