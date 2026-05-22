interface TodoTask { text: string; done: boolean; reminder?: string }
interface MemoMeta { filename: string; title: string; modifiedAt: number; preview: string }
interface TodoList { filename: string; name: string; tasks: TodoTask[] }
interface AppConfig {
  storagePath: string
  storagePathHistory: string[]
  pinnedMemos: string[]
  globalShortcut: string
  theme: 'light' | 'dark' | 'system'
  lastWindowState: {
    x: number; y: number; width: number; height: number
    opacity: number; blur: number; panelColor: string; fontColor: string
    alwaysOnTop: 'always' | 'normal' | 'bottom'
  }
}
interface MeeemoAPI {
  memoList(): Promise<MemoMeta[]>
  memoSearch(query: string): Promise<MemoMeta[]>
  memoRead(filename: string): Promise<string>
  memoWrite(filename: string, content: string): Promise<void>
  memoCreate(title: string): Promise<string>
  memoDelete(filename: string): Promise<void>
  memoRename(oldFilename: string, newTitle: string): Promise<string>
  memoPin(filename: string): Promise<AppConfig>
  todoList(): Promise<TodoList[]>
  todoRead(filename: string): Promise<TodoList>
  todoWrite(filename: string, tasks: TodoTask[]): Promise<void>
  todoCreateList(name: string): Promise<string>
  todoDeleteList(filename: string): Promise<void>
  todoRenameList(oldFilename: string, newName: string): Promise<string>
  todoUncompletedCount(): Promise<number>
  todoReadRaw(filename: string): Promise<string>
  todoWriteRaw(filename: string, content: string): Promise<void>
  todoTrashTask(task: { text: string; done: boolean; reminder?: string }): Promise<void>
  todoDeleteTask(filename: string, taskText: string, taskDone: boolean): Promise<void>
  todoReadTrash(): Promise<TodoTask[]>
  todoClearTrash(): Promise<void>
  todoRestoreFromTrash(index: number): Promise<TodoTask | null>
  todoPermanentDelete(index: number): Promise<void>
  imageSave(base64: string, ext: string): Promise<string>
  configGet(): Promise<AppConfig>
  configSet(partial: Partial<AppConfig>): Promise<AppConfig>
  windowSetOpacity(opacity: number): Promise<void>
  windowSetLevel(level: 'always' | 'normal' | 'bottom'): Promise<void>
  windowSetVibrancy(vibrancy: string | null): Promise<void>
  windowSetShortcut(shortcut: string): Promise<{ ok?: boolean; error?: string }>
  appVersion(): Promise<string>
  openUrl(url: string): Promise<void>
  openStorage(): Promise<void>
  changeStorage(): Promise<string | null>
  resetStorage(): Promise<string>
  migrateStorage(sourcePath: string, keepSource: boolean): Promise<{ copied: number; renamed: number; removedSource: boolean }>
  openSettings(section?: string): Promise<void>
  windowClose(): Promise<void>
  onOpenMemo(callback: (filename: string) => void): (() => void) | void
  onShowTodo(callback: () => void): (() => void) | void
  onDataChanged(callback: () => void): (() => void) | void
  onReminderAlert(callback: () => void): (() => void) | void
  onReminderData(callback: (data: { title: string; body: string }[]) => void): (() => void) | void
  onConfigChanged(callback: () => void): (() => void) | void
  onSettingsNavigate(callback: (section: string) => void): (() => void) | void
}
declare global { interface Window { api: MeeemoAPI } }
export {}
