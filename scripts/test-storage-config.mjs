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
  assert.deepEqual(config.loadConfig().storagePathHistory, [])

  config.updateConfig({ storagePath: customStorage })
  assert.equal(config.loadConfig().storagePath, customStorage)
  assert.deepEqual(config.loadConfig().storagePathHistory, [defaultStorage])

  const storedConfig = JSON.parse(readFileSync(join(userData, 'config.json'), 'utf-8'))
  assert.equal(storedConfig.storagePath, customStorage)
  assert.equal(existsSync(join(customStorage, 'config.json')), false)

  const reset = config.resetStoragePath()
  assert.equal(reset.storagePath, defaultStorage)
  assert.equal(config.loadConfig().storagePath, defaultStorage)
  assert.deepEqual(config.loadConfig().storagePathHistory, [customStorage])

  const legacyCustomStorage = join(tmp, 'legacy-custom-storage')
  writeFileSync(
    join(userData, 'config.json'),
    JSON.stringify({ ...config.loadConfig(), storagePath: legacyCustomStorage, storagePathHistory: undefined }, null, 2)
  )
  assert.equal(config.loadConfig().storagePath, legacyCustomStorage)
  assert.deepEqual(config.loadConfig().storagePathHistory, [defaultStorage])

  writeFileSync(
    join(userData, 'config.json'),
    JSON.stringify({ ...config.loadConfig(), storagePath: legacyCustomStorage, storagePathHistory: [] }, null, 2)
  )
  assert.deepEqual(config.loadConfig().storagePathHistory, [defaultStorage])

  const one = join(tmp, 'one')
  const two = join(tmp, 'two')
  const three = join(tmp, 'three')
  const four = join(tmp, 'four')
  const five = join(tmp, 'five')
  const six = join(tmp, 'six')
  for (const path of [one, two, three, four, five, six]) {
    config.updateConfig({ storagePath: path })
  }
  assert.deepEqual(config.loadConfig().storagePathHistory, [five, four, three, two, one])
} finally {
  rmSync(tmp, { recursive: true, force: true })
}
