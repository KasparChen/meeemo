import { app, globalShortcut, ipcMain, protocol, net } from 'electron'
import { join } from 'path'
import { registerIpcHandlers } from './ipc'
import { loadConfig } from './config'
import { createMemo } from './memo-service'
import { togglePalette, createEditorWindow, hidePalette, createTodoWindow, openMemoDirectly } from './windows'
import { createTray, updateTrayBadge, getTray } from './tray'
import { startReminderScheduler } from './reminder-scheduler'
import { createApplicationMenu } from './menu'

app.whenReady().then(() => {
  const config = loadConfig()

  // Register asset:// protocol to serve images from storage/assets
  protocol.handle('asset', (request) => {
    const url = request.url.replace('asset://', '')
    const filePath = join(config.storagePath, url)
    return net.fetch(`file://${filePath}`)
  })

  registerIpcHandlers()
  createApplicationMenu()
  createTray()
  startReminderScheduler()

  const shortcut = config.globalShortcut || 'Alt+Space'
  globalShortcut.register(shortcut, () => {
    const cfg = loadConfig()
    const target = cfg.shortcutTarget || 'command'

    if (target === 'command') {
      togglePalette()
    } else if (target === 'notes') {
      openMemoDirectly(cfg.shortcutTargetOption || 'last-edit')
    } else if (target === 'task') {
      const tray = getTray()
      if (tray) {
        createTodoWindow(tray.getBounds())
      }
    }
  })

  ipcMain.on('open-editor', (_e, filename: string) => {
    hidePalette()
    createEditorWindow(filename)
  })

  ipcMain.on('create-and-open-memo', (_e, title: string) => {
    hidePalette()
    const filename = createMemo(title)
    createEditorWindow(filename)
  })

  ipcMain.on('show-todo-from-palette', () => {
    hidePalette()
    const tray = getTray()
    if (tray) {
      createTodoWindow(tray.getBounds())
    }
  })

  ipcMain.on('update-tray-badge', () => {
    updateTrayBadge()
  })

  ipcMain.on('app-quit', () => {
    app.quit()
  })
})

app.on('will-quit', () => {
  globalShortcut.unregisterAll()
})

app.on('window-all-closed', () => {
  // Keep app running (tray app)
})
