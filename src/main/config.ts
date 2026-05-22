import { readFileSync, writeFileSync, existsSync, mkdirSync, readdirSync, copyFileSync } from 'fs'
import { join, resolve } from 'path'
import { homedir } from 'os'
import { app } from 'electron'

export const DEFAULT_STORAGE_PATH = join(homedir(), 'meeemo')

export interface WindowState {
  x: number
  y: number
  width: number
  height: number
  opacity: number
  blur: number
  panelColor: string
  fontColor: string
  alwaysOnTop: 'always' | 'normal' | 'bottom'
}

export interface AppConfig {
  storagePath: string
  storagePathHistory: string[]
  pinnedMemos: string[]
  globalShortcut: string
  shortcutTarget: 'command' | 'notes' | 'task'
  shortcutTargetOption: 'last-edit' | 'new' | 'first'
  reminderLeadTime: number // minutes before due to notify (0 = only at due time)
  notificationType: 'tray' | 'system' | 'both'
  imageHost: {
    enabled: boolean
    type: 'smms' | 'imgur' | 'custom'
    apiKey: string
    uploadUrl: string // only used for 'custom' type
  }
  theme: 'light' | 'dark' | 'system'
  lastWindowState: WindowState
}

const DEFAULT_CONFIG: AppConfig = {
  storagePath: DEFAULT_STORAGE_PATH,
  storagePathHistory: [],
  pinnedMemos: [],
  globalShortcut: 'Alt+Space',
  shortcutTarget: 'command',
  shortcutTargetOption: 'last-edit',
  reminderLeadTime: 10,
  notificationType: 'tray',
  imageHost: {
    enabled: false,
    type: 'smms',
    apiKey: '',
    uploadUrl: ''
  },
  theme: 'system',
  lastWindowState: {
    x: -1,
    y: -1,
    width: 400,
    height: 450,
    opacity: 0.85,
    blur: 20,
    panelColor: '#ffffff',
    fontColor: '#1a1a1a',
    alwaysOnTop: 'always'
  }
}

function configFilePath(): string {
  return join(app.getPath('userData'), 'config.json')
}

function normalizeStoragePath(path: string): string {
  return resolve(path)
}

function normalizeStoragePathHistory(paths: string[], currentPath: string): string[] {
  const current = normalizeStoragePath(currentPath)
  const seen = new Set<string>()
  const result: string[] = []

  const append = (path: string): void => {
    if (!path) return
    const normalized = normalizeStoragePath(path)
    if (seen.has(normalized)) return
    seen.add(normalized)
    result.push(normalized)
  }

  for (const path of paths) {
    if (result.length >= 5 && !seen.has(current)) break
    if (result.length >= 6) break
    append(path)
  }
  append(current)

  return result
}

function storagePathHistoryWithLegacyDefault(saved: Partial<AppConfig>, currentPath: string): string[] {
  const candidates = [...(saved.storagePathHistory || [])]
  if (
    saved.storagePath &&
    (!saved.storagePathHistory || saved.storagePathHistory.length === 0) &&
    normalizeStoragePath(saved.storagePath) !== normalizeStoragePath(DEFAULT_STORAGE_PATH)
  ) {
    candidates.push(DEFAULT_STORAGE_PATH)
  }
  return normalizeStoragePathHistory(candidates, currentPath)
}

export function ensureStorageDirs(storagePath: string): void {
  mkdirSync(join(storagePath, 'memo'), { recursive: true })
  mkdirSync(join(storagePath, 'todo'), { recursive: true })
  mkdirSync(join(storagePath, 'assets'), { recursive: true })

  const memoDir = join(storagePath, 'memo')
  if (readdirSync(memoDir).filter((f) => f.endsWith('.md')).length === 0) {
    writeFileSync(
      join(memoDir, 'Welcome.md'),
      '# Welcome to Meeemo!\n\nThis is your first memo. Press **⌥ Space** to open the command palette.\n\n- Create new memos\n- Search across all your notes\n- Pin your favorites\n\nHappy writing!'
    )
  }

  const todoDir = join(storagePath, 'todo')
  if (readdirSync(todoDir).filter((f) => f.endsWith('.md')).length === 0) {
    writeFileSync(
      join(todoDir, 'Inbox.md'),
      '- [ ] Try creating a new task\n- [ ] Explore the command palette (⌥ Space)\n'
    )
  }
}

export function loadConfig(): AppConfig {
  const cfgFile = configFilePath()

  // One-time migration: move legacy ~/meeemo/config.json to userData
  if (!existsSync(cfgFile)) {
    const legacyCfg = join(homedir(), 'meeemo', 'config.json')
    if (existsSync(legacyCfg)) {
      mkdirSync(app.getPath('userData'), { recursive: true })
      copyFileSync(legacyCfg, cfgFile)
    }
  }

  if (!existsSync(cfgFile)) {
    const defaultStoragePath = DEFAULT_CONFIG.storagePath
    ensureStorageDirs(defaultStoragePath)
    mkdirSync(app.getPath('userData'), { recursive: true })
    writeFileSync(cfgFile, JSON.stringify(DEFAULT_CONFIG, null, 2))
    return { ...DEFAULT_CONFIG }
  }

  const raw = readFileSync(cfgFile, 'utf-8')
  const saved = JSON.parse(raw) as Partial<AppConfig>
  const config = { ...DEFAULT_CONFIG, ...saved }
  config.storagePathHistory = storagePathHistoryWithLegacyDefault(saved, config.storagePath)
  config.lastWindowState = { ...DEFAULT_CONFIG.lastWindowState, ...(saved.lastWindowState || {}) }
  config.imageHost = { ...DEFAULT_CONFIG.imageHost, ...(saved.imageHost || {}) }
  ensureStorageDirs(config.storagePath)
  return config
}

export function saveConfig(config: AppConfig): void {
  mkdirSync(app.getPath('userData'), { recursive: true })
  writeFileSync(configFilePath(), JSON.stringify(config, null, 2))
  ensureStorageDirs(config.storagePath)
}

export function updateConfig(partial: Partial<AppConfig>): AppConfig {
  const config = loadConfig()
  const updated = { ...config, ...partial }
  if (partial.storagePath && normalizeStoragePath(partial.storagePath) !== normalizeStoragePath(config.storagePath)) {
    updated.storagePathHistory = normalizeStoragePathHistory(
      [config.storagePath, ...(partial.storagePathHistory || config.storagePathHistory)],
      partial.storagePath
    )
  } else if (partial.storagePathHistory) {
    updated.storagePathHistory = normalizeStoragePathHistory(partial.storagePathHistory, updated.storagePath)
  }
  // Deep-merge lastWindowState to avoid losing fields when only updating one property
  if (partial.lastWindowState) {
    updated.lastWindowState = { ...config.lastWindowState, ...partial.lastWindowState }
  }
  if (partial.imageHost) {
    updated.imageHost = { ...config.imageHost, ...partial.imageHost }
  }
  saveConfig(updated)
  return updated
}

export function resetStoragePath(): AppConfig {
  return updateConfig({ storagePath: DEFAULT_STORAGE_PATH })
}
