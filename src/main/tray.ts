import { app, Tray, nativeImage } from 'electron'
import { createTodoWindow } from './windows'
import { listTodoLists } from './todo-service'
import { parseReminderToDate } from './reminder-scheduler'

let tray: Tray | null = null

// Tray icons as base64-encoded PNG (template images — macOS auto-inverts under dark menu bar)
const TRAY_ICON_CHECKMARK = 'iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAAWElEQVR4nGNgoCJIAeITROIUXJqJBRiGkKIZq56hZcB/SgwAaYYFHk4D/jNgB8ia8RqQgsUQdM14DUA3BJtmggYgG4JNM1EGwAzBBVD0UJyUkQ0hKzORDQCUpjH8gbiXEQAAAABJRU5ErkJggg=='

// 22×22 cat (1x)
const TRAY_ICON_CAT_1X = 'iVBORw0KGgoAAAANSUhEUgAAABYAAAAWCAYAAADEtGw7AAAABGdBTUEAALGPC/xhBQAAACBjSFJNAAB6JgAAgIQAAPoAAACA6AAAdTAAAOpgAAA6mAAAF3CculE8AAAAimVYSWZNTQAqAAAACAAFARoABQAAAAEAAABKARsABQAAAAEAAABSASgAAwAAAAEAAgAAATEAAgAAAAYAAABah2kABAAAAAEAAABgAAAAAAAAAEgAAAABAAAASAAAAAFGaWdtYQAAA6ABAAMAAAABAAEAAKACAAQAAAABAAAAFqADAAQAAAABAAAAFgAAAABf8AiFAAAACXBIWXMAAAsTAAALEwEAmpwYAAABWWlUWHRYTUw6Y29tLmFkb2JlLnhtcAAAAAAAPHg6eG1wbWV0YSB4bWxuczp4PSJhZG9iZTpuczptZXRhLyIgeDp4bXB0az0iWE1QIENvcmUgNi4wLjAiPgogICA8cmRmOlJERiB4bWxuczpyZGY9Imh0dHA6Ly93d3cudzMub3JnLzE5OTkvMDIvMjItcmRmLXN5bnRheC1ucyMiPgogICAgICA8cmRmOkRlc2NyaXB0aW9uIHJkZjphYm91dD0iIgogICAgICAgICAgICB4bWxuczp4bXA9Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC8iPgogICAgICAgICA8eG1wOkNyZWF0b3JUb29sPkZpZ21hPC94bXA6Q3JlYXRvclRvb2w+CiAgICAgIDwvcmRmOkRlc2NyaXB0aW9uPgogICA8L3JkZjpSREY+CjwveDp4bXBtZXRhPgoE/1zIAAAB/UlEQVQ4Ee2TPWsUURSG58w4+xF3ZzfEZWFtwlYRJIghxMZA1EpIYy8Wgp02gl06W0Es/A3+ANuAqGlSBMQmKS3capPdmWWZxIQZn3PNlbmTaCtCDtw597zvOe/9OuN5F/bf3kBw3s673e7lMAheVWu1xU6ns5MkyUkpr9KOomfVavVRvV7fOsRKvHepDGicpuljX+SpMJ8kyb0oijZEpKFcnucxbsMTWVc+y7LvuJcMx5Q7Y61mc5PCO2eIX0COK9Ztx0myUs71y0Cr1eojuljGC3FRVOGF2UbjeoE307KwL3n+msor5cS/xFEm8gY+LOY4wuz2Bue8r2fFYvxn/JGJ3M8PTvUB6MDAImuzzaZzHY4wSUs8UmDOKvKCbriN+FswrR8zYp2DvYvjeI3TPVfCYCLLOrfmdAUvXjsV8Si6pvcN1j9NnqAQE9fJmW+32/O0RN8sSUIuUrOi6h1hCvboJ91RAvcA8Sf4GcQmYDuSZSeId8lZBfsKN2LsIz4Ht8v8t9kFDaA/xmGafmSBmxSi5bRVOdYai+36QXBrNBppjxtz/rzpdHochuEnhFcYVxk2T70bwMGrfRHffzgej7/9MdkSvV5vhkXWie+y8QVeeI6t2Ts8YoV97nQPbrNSqbwfDocTW2u9swsLnuNDFjN9OhgMjuF1XNg/voGfP9Off6yq6jsAAAAASUVORK5CYII='

// 44×44 cat (2x for retina menu bar)
const TRAY_ICON_CAT_2X = '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'

function makeIcon(b64: string): Electron.NativeImage {
  const img = nativeImage.createFromDataURL(`data:image/png;base64,${b64}`)
  img.setTemplateImage(true)
  return img
}

function makeCatIcon(): Electron.NativeImage {
  const img = nativeImage.createFromDataURL(`data:image/png;base64,${TRAY_ICON_CAT_1X}`)
  img.addRepresentation({
    scaleFactor: 2.0,
    dataURL: `data:image/png;base64,${TRAY_ICON_CAT_2X}`
  })
  img.setTemplateImage(true)
  return img
}

export function createTray(): Tray {
  tray = new Tray(makeCatIcon())
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
    tray.setImage(makeCatIcon())
  } else {
    tray.setImage(makeIcon(TRAY_ICON_CHECKMARK))
    if (overdueCount > 0) tray.setTitle(`${overdueCount}!·${totalUncompleted}`)
    else tray.setTitle(`${totalUncompleted}`)
  }
}

export function getTray(): Tray | null {
  return tray
}
