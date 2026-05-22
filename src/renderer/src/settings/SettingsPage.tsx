import { useEffect, useState } from 'react'
import { useApi } from '../hooks/use-ipc'
import { resolveTheme, THEME_DEFAULTS, type ThemeSetting } from '../lib/theme'

type WindowLevel = 'always' | 'normal' | 'bottom'
type NotificationType = 'tray' | 'system' | 'both'
type ShortcutTarget = 'command' | 'notes' | 'task'
type ShortcutTargetOption = 'last-edit' | 'new' | 'first'
type ImageHostType = 'smms' | 'imgur' | 'custom'
type Section = 'general' | 'appearance' | 'image-host' | 'updates'

const NAV_ITEMS: { id: Section; label: string }[] = [
  { id: 'general', label: 'General' },
  { id: 'appearance', label: 'Appearance' },
  { id: 'image-host', label: 'Image Host' },
  { id: 'updates', label: 'Check for Update' }
]

const THEME_TABS: { id: ThemeSetting; label: string }[] = [
  { id: 'light', label: 'Light' },
  { id: 'dark', label: 'Dark' },
  { id: 'system', label: 'System' }
]

export function SettingsPage() {
  const api = useApi()

  const [section, setSection] = useState<Section>('general')

  // General
  const [shortcut, setShortcut] = useState('Alt+Space')
  const [isRecording, setIsRecording] = useState(false)
  const [shortcutError, setShortcutError] = useState('')
  const [shortcutTarget, setShortcutTarget] = useState<ShortcutTarget>('command')
  const [shortcutTargetOption, setShortcutTargetOption] = useState<ShortcutTargetOption>('last-edit')
  const [reminderLeadTime, setReminderLeadTime] = useState(10)
  const [notificationType, setNotificationType] = useState<NotificationType>('tray')
  const [storagePath, setStoragePath] = useState('')
  const [storagePathHistory, setStoragePathHistory] = useState<string[]>([])
  const [showMigration, setShowMigration] = useState(false)
  const [migrationSource, setMigrationSource] = useState('')
  const [keepMigrationSource, setKeepMigrationSource] = useState(true)
  const [confirmDeleteSource, setConfirmDeleteSource] = useState(false)
  const [migrationStatus, setMigrationStatus] = useState('')

  // Appearance
  const [theme, setTheme] = useState<ThemeSetting>('system')
  const [opacity, setOpacity] = useState(0.85)
  const [panelColor, setPanelColor] = useState('#ffffff')
  const [fontColor, setFontColor] = useState('#1a1a1a')
  const [level, setLevel] = useState<WindowLevel>('always')

  // Image Host
  const [imageHostEnabled, setImageHostEnabled] = useState(false)
  const [imageHostType, setImageHostType] = useState<ImageHostType>('smms')
  const [imageHostApiKey, setImageHostApiKey] = useState('')
  const [imageHostUploadUrl, setImageHostUploadUrl] = useState('')

  // Updates
  const [version, setVersion] = useState('')
  const [updateStatus, setUpdateStatus] = useState<'idle' | 'checking' | 'latest' | 'available'>('idle')
  const [latestVersion, setLatestVersion] = useState('')

  // Window tag for settings-specific CSS
  useEffect(() => {
    document.documentElement.setAttribute('data-window', 'settings')
  }, [])

  // Cross-window nav (menu item click while window open)
  useEffect(() => {
    const cleanup = api.onSettingsNavigate((s: string) => {
      if (s === 'general' || s === 'appearance' || s === 'image-host' || s === 'updates') {
        setSection(s)
      }
    })
    return () => { cleanup?.() }
  }, [api])

  useEffect(() => {
    api.configGet().then((cfg) => {
      setShortcut(cfg.globalShortcut || 'Alt+Space')
      setShortcutTarget(cfg.shortcutTarget || 'command')
      setShortcutTargetOption(cfg.shortcutTargetOption || 'last-edit')
      setReminderLeadTime(cfg.reminderLeadTime ?? 10)
      setNotificationType(cfg.notificationType || 'tray')
      setStoragePath(cfg.storagePath || '')
      setStoragePathHistory(cfg.storagePathHistory || [])
      const ih = cfg.imageHost || ({} as any)
      setImageHostEnabled(ih.enabled || false)
      setImageHostType(ih.type || 'smms')
      setImageHostApiKey(ih.apiKey || '')
      setImageHostUploadUrl(ih.uploadUrl || '')
      const ws = cfg.lastWindowState
      setOpacity(ws.opacity)
      setPanelColor(ws.panelColor)
      setFontColor(ws.fontColor)
      setLevel(ws.alwaysOnTop)
      setTheme(cfg.theme)
      document.documentElement.setAttribute('data-theme', resolveTheme(cfg.theme))
    })
    api.appVersion().then(setVersion)
  }, [api])

  // Sync data-theme when system color scheme changes (only matters if theme === 'system')
  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    const handler = () => {
      if (theme === 'system') {
        document.documentElement.setAttribute('data-theme', resolveTheme('system'))
      }
    }
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [theme])

  // ---- handlers (collapsed for brevity, same logic as before) ----

  const handleShortcutRecord = (e: React.KeyboardEvent) => {
    e.preventDefault(); e.stopPropagation()
    const parts: string[] = []
    if (e.metaKey) parts.push('Command')
    if (e.ctrlKey) parts.push('Control')
    if (e.altKey) parts.push('Alt')
    if (e.shiftKey) parts.push('Shift')
    const key = e.key
    if (!['Meta', 'Control', 'Alt', 'Shift'].includes(key)) {
      parts.push(key === ' ' ? 'Space' : key.length === 1 ? key.toUpperCase() : key)
      const combo = parts.join('+')
      setIsRecording(false); setShortcutError('')
      api.windowSetShortcut(combo).then((res: any) => {
        if (res?.error) setShortcutError(res.error)
        else setShortcut(combo)
      })
    }
  }

  const updateWindowState = (partial: Record<string, unknown>) =>
    api.configSet({ lastWindowState: partial } as any)

  const handleThemeChange = (next: ThemeSetting) => {
    setTheme(next)
    const eff = resolveTheme(next)
    document.documentElement.setAttribute('data-theme', eff)
    if (next === 'system') {
      // Defer panel/font colors to the effective theme defaults; don't overwrite saved customizations
      api.configSet({ theme: next } as any)
    } else {
      const d = THEME_DEFAULTS[next]
      setPanelColor(d.panelColor); setFontColor(d.fontColor)
      api.configSet({
        theme: next,
        lastWindowState: { panelColor: d.panelColor, fontColor: d.fontColor } as any
      })
    }
  }

  const updateImageHost = (partial: Record<string, unknown>) =>
    api.configSet({ imageHost: partial } as any)

  const applyStorageConfig = (cfg: AppConfig) => {
    setStoragePath(cfg.storagePath || '')
    setStoragePathHistory(cfg.storagePathHistory || [])
  }

  const refreshStorageConfig = async () => {
    const cfg = await api.configGet()
    applyStorageConfig(cfg)
  }

  const runMigration = async () => {
    if (!migrationSource) return
    setMigrationStatus('Migrating...')
    try {
      const result = await api.migrateStorage(migrationSource, keepMigrationSource)
      setMigrationStatus(`Copied ${result.copied} item${result.copied === 1 ? '' : 's'}${result.renamed ? `, renamed ${result.renamed}` : ''}.`)
      setConfirmDeleteSource(false)
      await refreshStorageConfig()
    } catch (error) {
      setMigrationStatus(error instanceof Error ? error.message : 'Migration failed')
    }
  }

  const checkForUpdates = async () => {
    setUpdateStatus('checking')
    try {
      const res = await fetch('https://api.github.com/repos/KasparChen/meeemo/releases/latest')
      if (!res.ok) { setUpdateStatus('latest'); return }
      const data = await res.json()
      const remote = (data.tag_name || '').replace(/^v/, '')
      if (remote && remote !== version) { setLatestVersion(remote); setUpdateStatus('available') }
      else setUpdateStatus('latest')
    } catch { setUpdateStatus('latest') }
  }

  useEffect(() => {
    const cleanup = api.onConfigChanged(() => {
      refreshStorageConfig()
    })
    return () => { cleanup?.() }
  }, [api])

  return (
    <div className="settings-shell">
      <nav className="settings-sidebar">
        <div className="settings-sidebar-title">Settings</div>
        {NAV_ITEMS.map((item) => (
          <button
            key={item.id}
            className={`settings-nav-item ${section === item.id ? 'settings-nav-item-active' : ''}`}
            onClick={() => setSection(item.id)}
          >
            {item.label}
          </button>
        ))}
      </nav>

      <div className="settings-content">
        {section === 'general' && (
          <>
            <div className="settings-section-title">Hotkey</div>
            <div className="settings-row">
              <span className="settings-row-label">Global Hotkey</span>
              <div className="settings-row-control">
                {isRecording ? (
                  <div
                    className="settings-input"
                    tabIndex={0}
                    ref={(el) => el?.focus()}
                    onKeyDown={handleShortcutRecord}
                    onBlur={() => setIsRecording(false)}
                    style={{ borderColor: 'var(--accent)', color: 'var(--accent)' }}
                  >
                    Press shortcut...
                  </div>
                ) : (
                  <button className="settings-button" onClick={() => { setIsRecording(true); setShortcutError('') }}>
                    {shortcut}
                  </button>
                )}
              </div>
            </div>
            {shortcutError && <div className="settings-error">{shortcutError}</div>}
            <div className="settings-row">
              <span className="settings-row-label">Hotkey Target</span>
              <div className="settings-row-control">
                <select
                  className="settings-select"
                  value={shortcutTarget}
                  onChange={(e) => {
                    const v = e.target.value as ShortcutTarget
                    setShortcutTarget(v); api.configSet({ shortcutTarget: v } as any)
                  }}
                >
                  <option value="command">Command Palette</option>
                  <option value="notes">Notes</option>
                  <option value="task">Tasks</option>
                </select>
              </div>
            </div>
            {shortcutTarget !== 'command' && (
              <div className="settings-row">
                <span className="settings-row-label">Open Behavior</span>
                <div className="settings-row-control">
                  <select
                    className="settings-select"
                    value={shortcutTargetOption}
                    onChange={(e) => {
                      const v = e.target.value as ShortcutTargetOption
                      setShortcutTargetOption(v); api.configSet({ shortcutTargetOption: v } as any)
                    }}
                  >
                    <option value="last-edit">Last Edited</option>
                    <option value="new">New</option>
                    <option value="first">First</option>
                  </select>
                </div>
              </div>
            )}

            <div className="settings-section-title">Reminder</div>
            <div className="settings-row">
              <span className="settings-row-label">Lead Time</span>
              <div className="settings-row-control">
                <select
                  className="settings-select"
                  value={reminderLeadTime}
                  onChange={(e) => {
                    const v = Number(e.target.value)
                    setReminderLeadTime(v); api.configSet({ reminderLeadTime: v } as any)
                  }}
                >
                  <option value={0}>At due time only</option>
                  <option value={5}>5 minutes before</option>
                  <option value={10}>10 minutes before</option>
                  <option value={15}>15 minutes before</option>
                  <option value={30}>30 minutes before</option>
                  <option value={60}>1 hour before</option>
                  <option value={120}>2 hours before</option>
                  <option value={1440}>1 day before</option>
                </select>
              </div>
            </div>
            <div className="settings-row">
              <span className="settings-row-label">Notification</span>
              <div className="settings-row-control">
                <select
                  className="settings-select"
                  value={notificationType}
                  onChange={(e) => {
                    const v = e.target.value as NotificationType
                    setNotificationType(v); api.configSet({ notificationType: v } as any)
                  }}
                >
                  <option value="tray">Tray popup</option>
                  <option value="system">System notification</option>
                  <option value="both">Both</option>
                </select>
              </div>
            </div>

            <div className="settings-section-title">Storage</div>
            <div className="settings-action-row">
              <div className="settings-action-copy">
                <div className="settings-action-title">Current location</div>
                <div className="settings-action-desc">Meeemo stores memos, todos, and image assets in this folder.</div>
                <div className="settings-location-line">
                  <div className="settings-storage-path" title={storagePath}>{storagePath}</div>
                  <div className="settings-action-buttons">
                    <button className="settings-button" onClick={() => api.openStorage()}>Open</button>
                    <button
                      className="settings-button"
                      onClick={async () => {
                        const updated = await api.changeStorage()
                        if (updated) applyStorageConfig(updated)
                      }}
                    >
                      Change...
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div className="settings-action-row">
              <div className="settings-action-copy">
                <div className="settings-action-title">Reset default location</div>
                <div className="settings-action-desc">Switch storage back to ~/meeemo. Existing files stay where they are unless you migrate them.</div>
              </div>
              <button
                className="settings-button"
                onClick={async () => {
                  const updated = await api.resetStorage()
                  applyStorageConfig(updated)
                }}
              >
                Reset Default
              </button>
            </div>

            <div className="settings-action-row">
              <div className="settings-action-copy">
                <div className="settings-action-title">Migrate previous storage</div>
                <div className="settings-action-desc">
                  Copy files from an older location into the current folder. Duplicate names are kept by adding a number.
                </div>
              </div>
              <button
                className="settings-button"
                onClick={() => {
                  const firstSelectable = storagePathHistory.find((p) => p !== storagePath) || ''
                  setMigrationSource(firstSelectable)
                  setMigrationStatus('')
                  setKeepMigrationSource(true)
                  setConfirmDeleteSource(false)
                  setShowMigration(true)
                }}
              >
                Migrate From...
              </button>
            </div>
          </>
        )}

        {section === 'appearance' && (
          <>
            <div className="settings-section-title">Theme</div>
            <div className="settings-row">
              <span className="settings-row-label">Mode</span>
              <div className="settings-row-control">
                <div className="settings-segmented">
                  {THEME_TABS.map((t) => (
                    <button
                      key={t.id}
                      className={`settings-segmented-item ${theme === t.id ? 'settings-segmented-item-active' : ''}`}
                      onClick={() => handleThemeChange(t.id)}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="settings-section-title">Editor Window</div>
            <div className="settings-row">
              <span className="settings-row-label">Opacity</span>
              <div className="settings-row-control" style={{ gap: 8, alignItems: 'center' }}>
                <input
                  type="range" min={1} max={100}
                  value={Math.round(opacity * 100)}
                  onChange={(e) => {
                    const v = Number(e.target.value) / 100
                    setOpacity(v); updateWindowState({ opacity: v })
                  }}
                  style={{ width: 180 }}
                />
                <span style={{ fontSize: 12, color: 'var(--text-secondary)', width: 36, textAlign: 'right' }}>
                  {Math.round(opacity * 100)}%
                </span>
              </div>
            </div>
            <div className="settings-row">
              <span className="settings-row-label">Panel Color</span>
              <div className="settings-row-control" style={{ opacity: theme === 'system' ? 0.5 : 1, gap: 10, alignItems: 'center' }}>
                <input
                  className="settings-color-swatch"
                  type="color"
                  value={panelColor}
                  disabled={theme === 'system'}
                  onChange={(e) => {
                    const v = e.target.value
                    setPanelColor(v); updateWindowState({ panelColor: v })
                  }}
                  onInput={(e) => {
                    const v = (e.target as HTMLInputElement).value
                    setPanelColor(v); updateWindowState({ panelColor: v })
                  }}
                />
                <input
                  type="text"
                  className="settings-input"
                  value={panelColor}
                  disabled={theme === 'system'}
                  onChange={(e) => {
                    const v = e.target.value
                    if (/^#[0-9a-fA-F]{6}$/.test(v)) {
                      setPanelColor(v); updateWindowState({ panelColor: v })
                    } else {
                      setPanelColor(v)
                    }
                  }}
                  style={{ width: 90, fontFamily: 'ui-monospaced, monospace' }}
                  placeholder="#ffffff"
                />
              </div>
            </div>
            <div className="settings-row">
              <span className="settings-row-label">Font Color</span>
              <div className="settings-row-control" style={{ opacity: theme === 'system' ? 0.5 : 1, gap: 10, alignItems: 'center' }}>
                <input
                  className="settings-color-swatch"
                  type="color"
                  value={fontColor}
                  disabled={theme === 'system'}
                  onChange={(e) => {
                    const v = e.target.value
                    setFontColor(v); updateWindowState({ fontColor: v })
                  }}
                  onInput={(e) => {
                    const v = (e.target as HTMLInputElement).value
                    setFontColor(v); updateWindowState({ fontColor: v })
                  }}
                />
                <input
                  type="text"
                  className="settings-input"
                  value={fontColor}
                  disabled={theme === 'system'}
                  onChange={(e) => {
                    const v = e.target.value
                    if (/^#[0-9a-fA-F]{6}$/.test(v)) {
                      setFontColor(v); updateWindowState({ fontColor: v })
                    } else {
                      setFontColor(v)
                    }
                  }}
                  style={{ width: 90, fontFamily: 'ui-monospaced, monospace' }}
                  placeholder="#1a1a1a"
                />
              </div>
            </div>
            {theme === 'system' && (
              <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 4 }}>
                Panel and font colors follow the system theme. Pick Light or Dark to customize.
              </div>
            )}
            <div className="settings-row">
              <span className="settings-row-label">Window Level</span>
              <div className="settings-row-control">
                <select
                  className="settings-select"
                  value={level}
                  onChange={(e) => {
                    const v = e.target.value as WindowLevel
                    setLevel(v); updateWindowState({ alwaysOnTop: v })
                  }}
                >
                  <option value="always">Always on Top</option>
                  <option value="normal">Normal</option>
                  <option value="bottom">Always on Bottom</option>
                </select>
              </div>
            </div>
          </>
        )}

        {section === 'image-host' && (
          <>
            <div className="settings-section-title">Image Host</div>
            <div className="settings-row">
              <span className="settings-row-label">Enabled</span>
              <div className="settings-row-control">
                <button
                  className={imageHostEnabled ? 'settings-button settings-button-primary' : 'settings-button'}
                  onClick={() => {
                    const next = !imageHostEnabled
                    setImageHostEnabled(next); updateImageHost({ enabled: next })
                  }}
                >
                  {imageHostEnabled ? 'ON' : 'OFF'}
                </button>
              </div>
            </div>
            {imageHostEnabled && (
              <>
                <div className="settings-row">
                  <span className="settings-row-label">Provider</span>
                  <div className="settings-row-control">
                    <select
                      className="settings-select"
                      value={imageHostType}
                      onChange={(e) => {
                        const v = e.target.value as ImageHostType
                        setImageHostType(v); updateImageHost({ type: v })
                      }}
                    >
                      <option value="smms">SM.MS</option>
                      <option value="imgur">Imgur</option>
                      <option value="custom">Custom</option>
                    </select>
                  </div>
                </div>
                <div className="settings-row">
                  <span className="settings-row-label">API Key</span>
                  <div className="settings-row-control">
                    <input
                      className="settings-input"
                      type="text"
                      value={imageHostApiKey}
                      onChange={(e) => { setImageHostApiKey(e.target.value); updateImageHost({ apiKey: e.target.value }) }}
                      placeholder="API Key"
                      style={{ width: 240 }}
                    />
                  </div>
                </div>
                {imageHostType === 'custom' && (
                  <div className="settings-row">
                    <span className="settings-row-label">Upload URL</span>
                    <div className="settings-row-control">
                      <input
                        className="settings-input"
                        type="text"
                        value={imageHostUploadUrl}
                        onChange={(e) => { setImageHostUploadUrl(e.target.value); updateImageHost({ uploadUrl: e.target.value }) }}
                        placeholder="https://..."
                        style={{ width: 240 }}
                      />
                    </div>
                  </div>
                )}
              </>
            )}
          </>
        )}

        {section === 'updates' && (
          <>
            <div className="settings-section-title">Version</div>
            <div className="settings-row">
              <span className="settings-row-label">Current Version</span>
              <div className="settings-row-control" style={{ color: 'var(--text-secondary)', fontSize: 13 }}>
                v{version}
              </div>
            </div>
            <div className="settings-row">
              <span className="settings-row-label">Status</span>
              <div className="settings-row-control">
                {updateStatus === 'idle' && (
                  <button className="settings-button" onClick={checkForUpdates}>Check for updates</button>
                )}
                {updateStatus === 'checking' && (
                  <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Checking...</span>
                )}
                {updateStatus === 'latest' && (
                  <span style={{ fontSize: 13, color: '#34c759' }}>Up to date</span>
                )}
                {updateStatus === 'available' && (
                  <button
                    className="settings-button settings-button-primary"
                    onClick={() => api.openUrl('https://github.com/KasparChen/meeemo/releases/latest')}
                  >
                    v{latestVersion} available
                  </button>
                )}
              </div>
            </div>
          </>
        )}
      </div>

      {showMigration && (
        <div className="settings-modal-backdrop">
          <div className="settings-modal">
            <div className="settings-modal-title">Migrate Storage</div>
            <div className="settings-modal-copy">Copy files from a previous storage location into the current one.</div>
            <div className="settings-storage-path" title={storagePath}>Current: {storagePath}</div>
            <div className="settings-modal-label">History</div>
            <div className="settings-path-list">
              {storagePathHistory.filter((p) => p !== storagePath).length === 0 ? (
                <div className="settings-empty-note">No previous storage locations yet. Change location once, then this list will show the folder you moved away from.</div>
              ) : (
                storagePathHistory.map((path) => {
                  const isCurrent = path === storagePath
                  return (
                    <button
                      key={path}
                      className={`settings-path-item ${migrationSource === path ? 'settings-path-item-active' : ''}`}
                      onClick={() => { if (!isCurrent) setMigrationSource(path) }}
                      disabled={isCurrent}
                      title={isCurrent ? `${path} (current)` : path}
                    >
                      <span>{path}</span>
                      {isCurrent && <span className="settings-path-item-tag">current</span>}
                    </button>
                  )
                })
              )}
            </div>
            <label className="settings-checkbox-row">
              <input
                type="checkbox"
                checked={keepMigrationSource}
                onChange={(e) => {
                  setKeepMigrationSource(e.target.checked)
                  setConfirmDeleteSource(false)
                }}
              />
              <span>Keep source contents</span>
            </label>
            {migrationStatus && <div className="settings-modal-copy">{migrationStatus}</div>}
            <div className="settings-modal-actions">
              <button className="settings-button" onClick={() => setShowMigration(false)}>Close</button>
              <button
                className="settings-button settings-button-primary"
                disabled={!migrationSource}
                onClick={() => {
                  if (keepMigrationSource) runMigration()
                  else setConfirmDeleteSource(true)
                }}
              >
                Migrate
              </button>
            </div>
          </div>
        </div>
      )}

      {confirmDeleteSource && (
        <div className="settings-modal-backdrop">
          <div className="settings-modal settings-modal-danger">
            <div className="settings-modal-title">Confirm Source Deletion</div>
            <div className="settings-modal-copy">
              This operation is irreversible. Meeemo will copy the source contents first, then delete all files in the original storage folder if the copy succeeds. Confirm only after checking that this is the folder you want to remove.
            </div>
            <div className="settings-storage-path" title={migrationSource}>{migrationSource}</div>
            <div className="settings-modal-actions">
              <button className="settings-button" onClick={() => setConfirmDeleteSource(false)}>Cancel</button>
              <button className="settings-button settings-button-danger" onClick={runMigration}>Delete Source After Migrating</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
