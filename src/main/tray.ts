import { app, Tray, nativeImage } from 'electron'
import { createTodoWindow } from './windows'
import { listTodoLists } from './todo-service'
import { parseReminderToDate } from './reminder-scheduler'

let tray: Tray | null = null

// 16x16 PNG checkmark icon embedded as base64 (macOS tray requires PNG)
const TRAY_ICON_BASE64 = 'iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAAWElEQVR4nGNgoCJIAeITROIUXJqJBRiGkKIZq56hZcB/SgwAaYYFHk4D/jNgB8ia8RqQgsUQdM14DUA3BJtmggYgG4JNM1EGwAzBBVD0UJyUkQ0hKzORDQCUpjH8gbiXEQAAAABJRU5ErkJggg=='

export function createTray(): Tray {
  const icon = nativeImage.createFromDataURL(`data:image/png;base64,${TRAY_ICON_BASE64}`)
  icon.setTemplateImage(true)

  tray = new Tray(icon)
  tray.setToolTip('Meeemo')
  updateTrayBadge()

  tray.on('click', (_event, bounds) => {
    // Bring app to foreground so menu bar switches to Meeemo's menu (File / Settings / ...)
    app.focus({ steal: true })
    createTodoWindow(bounds)
  })

  return tray
}

export function updateTrayBadge(): void {
  if (!tray) return
  const lists = listTodoLists()
  const now = Date.now()
  let totalUncompleted = 0
  let overdueCount = 0

  for (const list of lists) {
    for (const task of list.tasks) {
      if (task.done) continue
      totalUncompleted++
      if (task.reminder) {
        const d = parseReminderToDate(task.reminder)
        if (d && d.getTime() <= now) {
          overdueCount++
        }
      }
    }
  }

  if (totalUncompleted === 0) {
    tray.setTitle('')
  } else if (overdueCount > 0) {
    tray.setTitle(`${overdueCount}!·${totalUncompleted}`)
  } else {
    tray.setTitle(`${totalUncompleted}`)
  }
}

export function getTray(): Tray | null {
  return tray
}
