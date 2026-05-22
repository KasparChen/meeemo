import assert from 'node:assert/strict'
import { createRequire } from 'node:module'
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import ts from 'typescript'

const require = createRequire(import.meta.url)
const root = process.cwd()
const tmp = mkdtempSync(join(tmpdir(), 'meeemo-storage-config-'))
const userData = join(tmp, 'user-data')
const customStorage = join(tmp, 'custom-storage')
const defaultStorage = join(process.env.HOME || tmp, 'meeemo')
const bundlePath = join(tmp, 'config-bundle.cjs')
const electronStubDir = join(tmp, 'node_modules', 'electron')

mkdirSync(electronStubDir, { recursive: true })
writeFileSync(
  join(electronStubDir, 'index.js'),
  `exports.app = { getPath(name) { if (name !== 'userData') throw new Error('unexpected path ' + name); return ${JSON.stringify(userData)} } };\n`
)

const source = readFileSync(join(root, 'src/main/config.ts'), 'utf-8')
const compiled = ts.transpileModule(source, {
  compilerOptions: {
    module: ts.ModuleKind.CommonJS,
    target: ts.ScriptTarget.ES2022,
    esModuleInterop: true
  }
})
writeFileSync(bundlePath, compiled.outputText)

try {
  const config = require(bundlePath)

  assert.equal(typeof config.loadConfig, 'function')
  assert.equal(typeof config.updateConfig, 'function')
  assert.equal(typeof config.resetStoragePath, 'function')

  assert.equal(config.loadConfig().storagePath, defaultStorage)

  config.updateConfig({ storagePath: customStorage })
  assert.equal(config.loadConfig().storagePath, customStorage)

  const storedConfig = JSON.parse(readFileSync(join(userData, 'config.json'), 'utf-8'))
  assert.equal(storedConfig.storagePath, customStorage)
  assert.equal(existsSync(join(customStorage, 'config.json')), false)

  const reset = config.resetStoragePath()
  assert.equal(reset.storagePath, defaultStorage)
  assert.equal(config.loadConfig().storagePath, defaultStorage)
} finally {
  rmSync(tmp, { recursive: true, force: true })
}
