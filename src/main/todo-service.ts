import { readdirSync, readFileSync, writeFileSync, unlinkSync, renameSync, existsSync } from 'fs'
import { join, basename } from 'path'
import { loadConfig } from './config'

export interface TodoTask { text: string; done: boolean; reminder?: string; pinned?: boolean }
export interface TodoList { filename: string; name: string; tasks: TodoTask[] }

function todoDir(): string { return join(loadConfig().storagePath, 'todo') }

const REMINDER_RE = / @(\d{4}-\d{1,2}-\d{1,2}-\d{4}[+-]\d{1,2})$/
const PIN_RE = / \[pin\]$/

function parseTodoMd(content: string): TodoTask[] {
  return content.split('\n')
    .filter((line) => line.match(/^- \[([ x])\] /))
    .map((line) => {
      let raw = line.replace(/^- \[[ x]\] /, '')
      const done = line.startsWith('- [x]')
      let pinned = false
      if (PIN_RE.test(raw)) {
        pinned = true
        raw = raw.replace(PIN_RE, '')
      }
      const match = raw.match(REMINDER_RE)
      const task: TodoTask = match
        ? { done, text: raw.replace(REMINDER_RE, ''), reminder: match[1] }
        : { done, text: raw }
      if (pinned) task.pinned = true
      return task
    })
}

function serializeTodoMd(tasks: TodoTask[]): string {
  return tasks.map((t) => {
    const reminder = t.reminder ? ` @${t.reminder}` : ''
    const pin = t.pinned ? ` [pin]` : ''
    return `- [${t.done ? 'x' : ' '}] ${t.text}${reminder}${pin}`
  }).join('\n') + '\n'
}

export function listTodoLists(): TodoList[] {
  const dir = todoDir()
  return readdirSync(dir).filter((f) => f.endsWith('.md') && f !== '_trash.md').map((filename) => {
    const content = readFileSync(join(dir, filename), 'utf-8')
    return { filename, name: basename(filename, '.md'), tasks: parseTodoMd(content) }
  })
}

export function readTodoList(filename: string): TodoList {
  const content = readFileSync(join(todoDir(), filename), 'utf-8')
  return { filename, name: basename(filename, '.md'), tasks: parseTodoMd(content) }
}

export function writeTodoList(filename: string, tasks: TodoTask[]): void {
  writeFileSync(join(todoDir(), filename), serializeTodoMd(tasks))
}

export function createTodoList(name: string): string {
  const filename = `${name}.md`
  writeFileSync(join(todoDir(), filename), '')
  return filename
}

export function readTodoRaw(filename: string): string {
  return readFileSync(join(todoDir(), filename), 'utf-8')
}

export function writeTodoRaw(filename: string, content: string): void {
  writeFileSync(join(todoDir(), filename), content)
}

export function deleteTodoList(filename: string): void { unlinkSync(join(todoDir(), filename)) }

export function renameTodoList(oldFilename: string, newName: string): string {
  const newFilename = `${newName}.md`
  renameSync(join(todoDir(), oldFilename), join(todoDir(), newFilename))
  return newFilename
}

export function totalUncompleted(): number {
  return listTodoLists().reduce((sum, list) => sum + list.tasks.filter((t) => !t.done).length, 0)
}

function trashPath(): string { return join(todoDir(), '_trash.md') }

/** Atomic: remove task from list file and add to trash in one operation */
export function deleteTaskToTrash(filename: string, taskText: string, taskDone: boolean): void {
  const filePath = join(todoDir(), filename)
  const tasks = parseTodoMd(readFileSync(filePath, 'utf-8'))
  const idx = tasks.findIndex((t) => t.text === taskText && t.done === taskDone)
  if (idx < 0) return
  const [removed] = tasks.splice(idx, 1)
  writeFileSync(filePath, serializeTodoMd(tasks))
  trashTask(removed)
}

export function trashTask(task: TodoTask): void {
  const existing = existsSync(trashPath()) ? readFileSync(trashPath(), 'utf-8') : ''
  const line = `- [${task.done ? 'x' : ' '}] ${task.text}${task.reminder ? ` @${task.reminder}` : ''}\n`
  writeFileSync(trashPath(), existing + line)
}

export function readTrash(): TodoTask[] {
  if (!existsSync(trashPath())) return []
  return parseTodoMd(readFileSync(trashPath(), 'utf-8'))
}

export function clearTrash(): void {
  if (existsSync(trashPath())) writeFileSync(trashPath(), '')
}

export function restoreFromTrash(index: number): TodoTask | null {
  const tasks = readTrash()
  if (index < 0 || index >= tasks.length) return null
  const [task] = tasks.splice(index, 1)
  writeFileSync(trashPath(), serializeTodoMd(tasks))
  return task
}

export function permanentDeleteFromTrash(index: number): void {
  const tasks = readTrash()
  if (index < 0 || index >= tasks.length) return
  tasks.splice(index, 1)
  writeFileSync(trashPath(), serializeTodoMd(tasks))
}
