import assert from 'node:assert/strict'
import { createRequire } from 'node:module'
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import ts from 'typescript'

const require = createRequire(import.meta.url)
const root = process.cwd()
const tmp = mkdtempSync(join(tmpdir(), 'meeemo-storage-migration-'))
const bundlePath = join(tmp, 'storage-migration-service.cjs')

const source = readFileSync(join(root, 'src/main/storage-migration-service.ts'), 'utf-8')
const compiled = ts.transpileModule(source, {
  compilerOptions: {
    module: ts.ModuleKind.CommonJS,
    target: ts.ScriptTarget.ES2022,
    esModuleInterop: true
  }
})
writeFileSync(bundlePath, compiled.outputText)

try {
  const { migrateStorage } = require(bundlePath)
  assert.equal(typeof migrateStorage, 'function')

  const sourcePath = join(tmp, 'source')
  const targetPath = join(tmp, 'target')
  mkdirSync(join(sourcePath, 'memo'), { recursive: true })
  mkdirSync(join(sourcePath, 'assets', 'nested'), { recursive: true })
  mkdirSync(join(targetPath, 'memo'), { recursive: true })
  mkdirSync(join(targetPath, 'assets'), { recursive: true })

  writeFileSync(join(sourcePath, 'memo', 'Welcome.md'), 'source memo')
  writeFileSync(join(sourcePath, 'memo', 'Idea.md'), 'source idea')
  writeFileSync(join(sourcePath, 'assets', 'logo.png'), 'source logo')
  writeFileSync(join(sourcePath, 'assets', 'nested', 'photo.png'), 'source photo')
  writeFileSync(join(targetPath, 'memo', 'Welcome.md'), 'target memo')
  writeFileSync(join(targetPath, 'assets', 'logo.png'), 'target logo')

  const kept = migrateStorage(sourcePath, targetPath, { keepSource: true })
  assert.equal(kept.removedSource, false)
  assert.equal(readFileSync(join(targetPath, 'memo', 'Welcome.md'), 'utf-8'), 'target memo')
  assert.equal(readFileSync(join(targetPath, 'memo', 'Welcome 2.md'), 'utf-8'), 'source memo')
  assert.equal(readFileSync(join(targetPath, 'memo', 'Idea.md'), 'utf-8'), 'source idea')
  assert.equal(readFileSync(join(targetPath, 'assets', 'logo.png'), 'utf-8'), 'target logo')
  assert.equal(readFileSync(join(targetPath, 'assets', 'logo 2.png'), 'utf-8'), 'source logo')
  assert.equal(readFileSync(join(targetPath, 'assets', 'nested', 'photo.png'), 'utf-8'), 'source photo')
  assert.equal(existsSync(sourcePath), true)

  const removeSource = join(tmp, 'remove-source')
  mkdirSync(removeSource, { recursive: true })
  writeFileSync(join(removeSource, 'Only.md'), 'remove me')
  const removed = migrateStorage(removeSource, targetPath, { keepSource: false })
  assert.equal(removed.removedSource, true)
  assert.equal(existsSync(removeSource), false)
  assert.equal(readFileSync(join(targetPath, 'Only.md'), 'utf-8'), 'remove me')

  const parentSource = join(tmp, 'parent-source')
  const nestedTarget = join(parentSource, 'nested-target')
  mkdirSync(parentSource, { recursive: true })
  assert.throws(
    () => migrateStorage(parentSource, nestedTarget, { keepSource: true }),
    /Target storage path cannot be inside source storage path/
  )
} finally {
  rmSync(tmp, { recursive: true, force: true })
}
