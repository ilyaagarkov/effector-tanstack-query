import { cpSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import ts from 'typescript'

const fixtures = new URL('./helper-exports/', import.meta.url)
const output = path.resolve('.type-tests-dist')
const root = path.join(output, 'helper-exports')
rmSync(root, { recursive: true, force: true })
const packageRoot = path.join(root, 'node_modules/@effector-tanstack-query/core')
mkdirSync(path.join(packageRoot, 'dist'), { recursive: true })
cpSync('package.json', path.join(packageRoot, 'package.json'))
for (const file of readdirSync(output)) {
  if (/\.d\.(ts|cts)$/.test(file)) cpSync(path.join(output, file), path.join(packageRoot, 'dist', file))
}
writeFileSync(path.join(root, 'package.json'), '{"type":"module"}')

function check(file, options) {
  const program = ts.createProgram([file], {
    strict: true,
    skipLibCheck: false,
    target: ts.ScriptTarget.ES2022,
    module: ts.ModuleKind.NodeNext,
    moduleResolution: ts.ModuleResolutionKind.NodeNext,
    ...options,
  })
  const emitted = program.emit()
  const diagnostics = [...ts.getPreEmitDiagnostics(program), ...emitted.diagnostics]
  if (diagnostics.length) {
    throw new Error(ts.formatDiagnosticsWithColorAndContext(diagnostics, {
      getCanonicalFileName: file => file,
      getCurrentDirectory: () => process.cwd(),
      getNewLine: () => '\n',
    }))
  }
}

for (const [extension, runtimeExtension] of [['ts', 'js'], ['cts', 'cjs']]) {
  const directory = path.join(root, extension)
  mkdirSync(directory, { recursive: true })
  const library = path.join(directory, `library.${extension}`)
  cpSync(new URL('library.ts', fixtures), library)
  check(library, { declaration: true, emitDeclarationOnly: true, outDir: path.join(directory, 'out') })
  const declaration = readFileSync(path.join(directory, `out/library.d.${extension}`), 'utf8')
  for (const [, specifier] of declaration.matchAll(/import\("([^"]+)"\)/g)) {
    if (!['@effector-tanstack-query/core', '@tanstack/query-core'].includes(specifier)) {
      throw new Error(`Non-public declaration import: ${specifier}`)
    }
  }
  const consumer = path.join(directory, `consumer.${extension}`)
  writeFileSync(consumer, readFileSync(new URL('consumer.ts', fixtures), 'utf8')
    .replace('./library.js', `./out/library.${runtimeExtension}`))
  check(consumer, { noEmit: true })
  console.log(`Exported helper declarations: ${extension === 'ts' ? 'ESM' : 'CommonJS'} passed`)
}
