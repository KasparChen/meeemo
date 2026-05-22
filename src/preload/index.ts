import { contextBridge, ipcRenderer } from 'electron'

const api = {
  memoList: () => ipcRenderer.invoke('memo:list'),
  memoSearch: (query: string) => ipcRenderer.invoke('memo:search', query),
  memoRead: (filename: string) => ipcRenderer.invoke('memo:read', filename),
  memoWrite: (filename: string, content: string) => ipcRenderer.invoke('memo:write', filename, content),
  memoCreate: (title: string) => ipcRenderer.invoke('memo:create', title),
  memoDelete: (filename: string) => ipcRenderer.invoke('memo:delete', filename),
  memoRename: (oldFilename: string, newTitle: string) => ipcRenderer.invoke('memo:rename', oldFilename, newTitle),
  memoPin: (filename: string) => ipcRenderer.invoke('memo:pin', filename),
  todoList: () => ipcRenderer.invoke('todo:list'),
  todoRead: (filename: string) => ipcRenderer.invoke('todo:read', filename),
  todoWrite: (filename: string, tasks: { text: string; done: boolean }[]) => ipcRenderer.invoke('todo:write', filename, tasks),
  todoCreateList: (name: string) => ipcRenderer.invoke('todo:create-list', name),
  todoDeleteList: (filename: string) => ipcRenderer.invoke('todo:delete-list', filename),
  todoRenameList: (oldFilename: string, newName: string) => ipcRenderer.invoke('todo:rename-list', oldFilename, newName),
  todoUncompletedCount: () => ipcRenderer.invoke('todo:uncompleted-count'),
  todoReadRaw: (filename: string) => ipcRenderer.invoke('todo:read-raw', filename),
  todoWriteRaw: (filename: string, content: string) => ipcRenderer.invoke('todo:write-raw', filename, content),
  todoTrashTask: (task: { text: string; done: boolean; reminder?: string }) => ipcRenderer.invoke('todo:trash-task', task),
  todoDeleteTask: (filename: string, taskText: string, taskDone: boolean) => ipcRenderer.invoke('todo:delete-task', filename, taskText, taskDone),
  todoReadTrash: () => ipcRenderer.invoke('todo:read-trash'),
  todoClearTrash: () => ipcRenderer.invoke('todo:clear-trash'),
  todoRestoreFromTrash: (index: number) => ipcRenderer.invoke('todo:restore-from-trash', index),
  todoPermanentDelete: (index: number) => ipcRenderer.invoke('todo:permanent-delete', index),
  imageSave: (base64: string, ext: string) => ipcRenderer.invoke('image:save', base64, ext),
  configGet: () => ipcRenderer.invoke('config:get'),
  configSet: (partial: Record<string, unknown>) => ipcRenderer.invoke('config:set', partial),
  windowSetOpacity: (opacity: number) => ipcRenderer.invoke('window:set-opacity', opacity),
  windowSetLevel: (level: 'always' | 'normal' | 'bottom') => ipcRenderer.invoke('window:set-level', level),
  windowSetVibrancy: (vibrancy: string | null) => ipcRenderer.invoke('window:set-vibrancy', vibrancy),
  windowSetShortcut: (shortcut: string) => ipcRenderer.invoke('window:set-shortcut', shortcut),
  appVersion: () => ipcRenderer.invoke('app:version'),
  openUrl: (url: string) => ipcRenderer.invoke('app:open-url', url),
  openStorage: () => ipcRenderer.invoke('app:open-storage'),
  changeStorage: () => ipcRenderer.invoke('app:change-storage'),
  resetStorage: () => ipcRenderer.invoke('app:reset-storage'),
  openSettings: (section?: string) => ipcRenderer.invoke('app:open-settings', section),
  windowClose: () => ipcRenderer.invoke('window:close'),
  onOpenMemo: (callback: (filename: string) => void) => {
    const handler = (_e: any, filename: string) => callback(filename)
    ipcRenderer.on('open-memo', handler)
    return () => { ipcRenderer.removeListener('open-memo', handler) }
  },
  onShowTodo: (callback: () => void) => {
    const handler = () => callback()
    ipcRenderer.on('show-todo', handler)
    return () => { ipcRenderer.removeListener('show-todo', handler) }
  },
  onDataChanged: (callback: () => void) => {
    const handler = () => callback()
    ipcRenderer.on('data-changed', handler)
    return () => { ipcRenderer.removeListener('data-changed', handler) }
  },
  onReminderAlert: (callback: () => void) => {
    const handler = () => callback()
    ipcRenderer.on('reminder-alert', handler)
    return () => { ipcRenderer.removeListener('reminder-alert', handler) }
  },
  onReminderData: (callback: (data: { title: string; body: string }[]) => void) => {
    const handler = (_e: any, data: any) => callback(data)
    ipcRenderer.on('reminder-data', handler)
    return () => { ipcRenderer.removeListener('reminder-data', handler) }
  },
  onConfigChanged: (callback: () => void) => {
    const handler = () => callback()
    ipcRenderer.on('config-changed', handler)
    return () => { ipcRenderer.removeListener('config-changed', handler) }
  },
  onSettingsNavigate: (callback: (section: string) => void) => {
    const handler = (_e: any, section: string) => callback(section)
    ipcRenderer.on('settings-navigate', handler)
    return () => { ipcRenderer.removeListener('settings-navigate', handler) }
  }
}

contextBridge.exposeInMainWorld('api', api)

// Also expose send for fire-and-forget messages
contextBridge.exposeInMainWorld('__electron_ipc_send', (channel: string, ...args: unknown[]) => {
  const ALLOWED_SEND = ['open-editor', 'show-todo-from-palette', 'update-tray-badge', 'app-quit', 'create-and-open-memo']
  if (ALLOWED_SEND.includes(channel)) {
    ipcRenderer.send(channel, ...args)
  }
})

export type MeeemoAPI = typeof api
