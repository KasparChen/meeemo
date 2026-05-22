import { app, globalShortcut, ipcMain, shell, BrowserWindow } from 'electron'
import { join } from 'path'
import { listMemos, searchMemos, readMemo, writeMemo, createMemo, deleteMemo, renameMemo } from './memo-service'
import { listTodoLists, readTodoList, writeTodoList, createTodoList, deleteTodoList, renameTodoList, totalUncompleted, readTodoRaw, writeTodoRaw, trashTask, deleteTaskToTrash, readTrash, clearTrash, restoreFromTrash, permanentDeleteFromTrash } from './todo-service'
import { loadConfig, updateConfig, type AppConfig } from './config'
import { saveImage } from './image-service'
import { updateTrayBadge } from './tray'

// Broadcast to all windows EXCEPT the sender (ColaMD-style isInternalSave pattern)
function broadcastToOthers(senderContents: Electron.WebContents | null, channel: string, ...args: unknown[]): void {
  for (const win of BrowserWindow.getAllWindows()) {
    if (!win.isDestroyed() && win.webContents !== senderContents) {
      win.webContents.send(channel, ...args)
    }
  }
}

function broadcastToAll(channel: string, ...args: unknown[]): void {
  for (const win of BrowserWindow.getAllWindows()) {
    if (!win.isDestroyed()) {
      win.webContents.send(channel, ...args)
    }
  }
}

export function registerIpcHandlers(): void {
  ipcMain.handle('memo:list', () => listMemos())
  ipcMain.handle('memo:search', (_e, query: string) => searchMemos(query))
  ipcMain.handle('memo:read', (_e, filename: string) => readMemo(filename))
  ipcMain.handle('memo:write', (e, filename: string, content: string) => {
    writeMemo(filename, content)
    broadcastToOthers(e.sender, 'data-changed')
  })
  ipcMain.handle('memo:create', (_e, title: string) => {
    const result = createMemo(title)
    broadcastToAll('data-changed')
    return result
  })
  ipcMain.handle('memo:delete', (_e, filename: string) => {
    deleteMemo(filename)
    broadcastToAll('data-changed')
  })
  ipcMain.handle('memo:rename', (_e, oldFilename: string, newTitle: string) => {
    const result = renameMemo(oldFilename, newTitle)
    broadcastToAll('data-changed')
    return result
  })
  ipcMain.handle('memo:pin', (_e, filename: string) => {
    const config = loadConfig()
    const idx = config.pinnedMemos.indexOf(filename)
    if (idx >= 0) { config.pinnedMemos.splice(idx, 1) } else { config.pinnedMemos.push(filename) }
    const result = updateConfig({ pinnedMemos: config.pinnedMemos })
    broadcastToAll('data-changed')
    return result
  })
  ipcMain.handle('todo:list', () => listTodoLists())
  ipcMain.handle('todo:read', (_e, filename: string) => readTodoList(filename))
  ipcMain.handle('todo:write', (e, filename: string, tasks: any[]) => {
    writeTodoList(filename, tasks)
    broadcastToOthers(e.sender, 'data-changed')
    updateTrayBadge()
  })
  ipcMain.handle('todo:create-list', (_e, name: string) => {
    const result = createTodoList(name)
    broadcastToAll('data-changed')
    return result
  })
  ipcMain.handle('todo:delete-list', (_e, filename: string) => {
    deleteTodoList(filename)
    broadcastToAll('data-changed')
  })
  ipcMain.handle('todo:rename-list', (_e, oldFilename: string, newName: string) => renameTodoList(oldFilename, newName))
  ipcMain.handle('todo:uncompleted-count', () => totalUncompleted())
  ipcMain.handle('todo:read-raw', (_e, filename: string) => readTodoRaw(filename))
  ipcMain.handle('todo:write-raw', (e, filename: string, content: string) => {
    writeTodoRaw(filename, content)
    broadcastToOthers(e.sender, 'data-changed')
    updateTrayBadge()
  })
  ipcMain.handle('todo:trash-task', (e, task: any) => {
    trashTask(task)
    broadcastToOthers(e.sender, 'data-changed')
  })
  ipcMain.handle('todo:delete-task', (_e, filename: string, taskText: string, taskDone: boolean) => {
    deleteTaskToTrash(filename, taskText, taskDone)
    broadcastToAll('data-changed')
    updateTrayBadge()
  })
  ipcMain.handle('todo:read-trash', () => readTrash())
  ipcMain.handle('todo:clear-trash', () => {
    clearTrash()
    broadcastToAll('data-changed')
  })
  ipcMain.handle('todo:restore-from-trash', (_e, index: number) => {
    const task = restoreFromTrash(index)
    broadcastToAll('data-changed')
    return task
  })
  ipcMain.handle('todo:permanent-delete', (_e, index: number) => {
    permanentDeleteFromTrash(index)
    broadcastToAll('data-changed')
  })
  ipcMain.handle('image:save', (_e, base64: string, ext: string) => {
    const buffer = Buffer.from(base64, 'base64')
    return saveImage(buffer, ext)
  })
  ipcMain.handle('config:get', () => loadConfig())
  ipcMain.handle('config:set', (_e, partial: Partial<AppConfig>) => {
    const updated = updateConfig(partial)
    broadcastToAll('config-changed')
    return updated
  })
  ipcMain.handle('window:set-opacity', (e, opacity: number) => {
    BrowserWindow.fromWebContents(e.sender)?.setOpacity(opacity)
  })
  ipcMain.handle('window:set-level', (e, level: 'always' | 'normal' | 'bottom') => {
    const win = BrowserWindow.fromWebContents(e.sender)
    if (!win) return
    if (level === 'always') win.setAlwaysOnTop(true, 'floating')
    else if (level === 'bottom') win.setAlwaysOnTop(true, 'utility', -1)
    else win.setAlwaysOnTop(false)
  })
  ipcMain.handle('window:set-vibrancy', (e, vibrancy: string | null) => {
    const win = BrowserWindow.fromWebContents(e.sender)
    if (!win) return
    let addon: any
    try { addon = require(join(app.getAppPath(), 'native/macos-vibrancy')) }
    catch { return }
    if (vibrancy) {
      addon.setVibrancy(win.getNativeWindowHandle(), vibrancy)
    } else {
      addon.removeVibrancy(win.getNativeWindowHandle())
    }
  })
  ipcMain.handle('window:set-shortcut', (_e, shortcut: string) => {
    const { togglePalette, openMemoDirectly, createTodoWindow } = require('./windows')
    const { getTray } = require('./tray')
    globalShortcut.unregisterAll()
    const ok = globalShortcut.register(shortcut, () => {
      const cfg = loadConfig()
      const target = cfg.shortcutTarget || 'command'
      if (target === 'command') {
        togglePalette()
      } else if (target === 'notes') {
        openMemoDirectly(cfg.shortcutTargetOption || 'last-edit')
      } else if (target === 'task') {
        const tray = getTray()
        if (tray) createTodoWindow(tray.getBounds())
      }
    })
    if (!ok) return { error: `Failed to register "${shortcut}"` }
    updateConfig({ globalShortcut: shortcut })
    return { ok: true }
  })
  ipcMain.handle('app:version', () => app.getVersion())
  ipcMain.handle('app:open-url', (_e, url: string) => shell.openExternal(url))
  ipcMain.handle('app:open-storage', () => {
    const config = loadConfig()
    shell.openPath(config.storagePath)
  })
  ipcMain.handle('app:open-settings', (_e, section?: string) => {
    const { createSettingsWindow } = require('./windows')
    createSettingsWindow(section || 'general')
  })
  ipcMain.handle('app:change-storage', async () => {
    const { dialog } = require('electron')
    const win = BrowserWindow.getAllWindows()[0]
    const result = await dialog.showOpenDialog(win, {
      properties: ['openDirectory', 'createDirectory'],
      title: 'Choose storage folder'
    })
    if (result.canceled || result.filePaths.length === 0) return null
    const newPath = result.filePaths[0]
    const updated = updateConfig({ storagePath: newPath })
    return updated.storagePath
  })
  ipcMain.handle('window:close', (e) => { BrowserWindow.fromWebContents(e.sender)?.close() })
}
