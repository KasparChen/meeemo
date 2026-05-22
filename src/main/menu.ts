import { app, Menu, shell, type MenuItemConstructorOptions } from 'electron'
import { createSettingsWindow, createEditorWindow, createTodoWindow } from './windows'
import { createMemo } from './memo-service'
import { createTodoList } from './todo-service'
import { loadConfig } from './config'
import { getTray } from './tray'

export type SettingsSection = 'general' | 'appearance' | 'image-host' | 'updates'

export function createApplicationMenu(): void {
  const isMac = process.platform === 'darwin'

  const appMenu: MenuItemConstructorOptions = {
    label: app.name,
    submenu: [
      { role: 'about' },
      { type: 'separator' },
      {
        label: 'Settings...',
        click: () => createSettingsWindow('general')
      },
      { type: 'separator' },
      { role: 'services' },
      { type: 'separator' },
      { role: 'hide' },
      { role: 'hideOthers' },
      { role: 'unhide' },
      { type: 'separator' },
      { role: 'quit' }
    ]
  }

  const fileMenu: MenuItemConstructorOptions = {
    label: 'File',
    submenu: [
      {
        label: 'New Memo',
        accelerator: 'CmdOrCtrl+N',
        click: () => {
          const title = `Untitled ${new Date().toISOString().slice(0, 10)}`
          const filename = createMemo(title)
          createEditorWindow(filename)
        }
      },
      {
        label: 'New Todo List',
        accelerator: 'CmdOrCtrl+Shift+N',
        click: () => {
          const name = `Untitled ${new Date().toISOString().slice(0, 10)}`
          createTodoList(name)
          const tray = getTray()
          createTodoWindow(tray ? tray.getBounds() : undefined)
        }
      },
      { type: 'separator' },
      {
        label: 'Show in Finder',
        accelerator: 'CmdOrCtrl+Shift+O',
        click: () => {
          const cfg = loadConfig()
          shell.openPath(cfg.storagePath)
        }
      },
      { type: 'separator' },
      { role: 'close' }
    ]
  }

  const settingsMenu: MenuItemConstructorOptions = {
    label: 'Settings',
    submenu: [
      {
        label: 'General',
        accelerator: 'CmdOrCtrl+,',
        click: () => createSettingsWindow('general')
      },
      {
        label: 'Appearance',
        click: () => createSettingsWindow('appearance')
      },
      {
        label: 'Image Host',
        click: () => createSettingsWindow('image-host')
      },
      { type: 'separator' },
      {
        label: 'Check for Update',
        click: () => createSettingsWindow('updates')
      }
    ]
  }

  const editMenu: MenuItemConstructorOptions = {
    label: 'Edit',
    submenu: [
      { role: 'undo' },
      { role: 'redo' },
      { type: 'separator' },
      { role: 'cut' },
      { role: 'copy' },
      { role: 'paste' },
      { role: 'selectAll' }
    ]
  }

  const viewMenu: MenuItemConstructorOptions = {
    label: 'View',
    submenu: [
      { role: 'reload' },
      { role: 'toggleDevTools' },
      { type: 'separator' },
      { role: 'togglefullscreen' }
    ]
  }

  const windowMenu: MenuItemConstructorOptions = {
    label: 'Window',
    submenu: [{ role: 'minimize' }, { role: 'zoom' }, { role: 'front' }]
  }

  const helpMenu: MenuItemConstructorOptions = {
    role: 'help',
    submenu: [
      {
        label: 'GitHub Repository',
        click: () => shell.openExternal('https://github.com/KasparChen/meeemo')
      },
      {
        label: 'Report an Issue',
        click: () => shell.openExternal('https://github.com/KasparChen/meeemo/issues')
      }
    ]
  }

  const template: MenuItemConstructorOptions[] = isMac
    ? [appMenu, settingsMenu, fileMenu, editMenu, viewMenu, windowMenu, helpMenu]
    : [settingsMenu, fileMenu, editMenu, viewMenu, windowMenu, helpMenu]

  Menu.setApplicationMenu(Menu.buildFromTemplate(template))
}
