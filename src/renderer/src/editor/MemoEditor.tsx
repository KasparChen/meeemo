import { useState, useEffect, useCallback, useRef } from 'react'
import { PlainTextEditor } from './PlainTextEditor'
import { TiptapEditor } from './TiptapEditor'
import { EditorHeader } from './EditorHeader'
import { useApi } from '../hooks/use-ipc'
import { resolveTheme, THEME_DEFAULTS, hexToRgb } from '../lib/theme'

type FileType = 'memo' | 'todo'

export function MemoEditor() {
  const api = useApi()

  // Core state — monotonic sessionId ensures every file switch is unique
  const [sessionId, setSessionId] = useState(0)
  const [filename, setFilename] = useState<string | null>(null)
  const [fileType, setFileType] = useState<FileType>('memo')
  const [content, setContent] = useState('')
  const [mode, setMode] = useState<'plain' | 'wysiwyg'>('wysiwyg')

  // UI state
  const [headerVisible, setHeaderVisible] = useState(false)
  const [popoverOpen, setPopoverOpen] = useState(false)

  // Refs for async access (closures always get latest value)
  const filenameRef = useRef<string | null>(null)
  const fileTypeRef = useRef<FileType>('memo')
  const contentRef = useRef('')
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const skipNextReadRef = useRef(false)

  // Sync refs
  filenameRef.current = filename
  fileTypeRef.current = fileType

  // ---- Helpers ----

  function cancelSave() {
    if (saveTimerRef.current) {
      clearTimeout(saveTimerRef.current)
      saveTimerRef.current = null
    }
  }

  function readFile(fname: string, ftype: FileType) {
    return ftype === 'memo' ? api.memoRead(fname) : api.todoReadRaw(fname)
  }

  function writeFile(fname: string, c: string, ftype: FileType) {
    return ftype === 'memo' ? api.memoWrite(fname, c) : api.todoWriteRaw(fname, c)
  }

  // Open a file: cancel any pending save, load content, then set all state atomically
  // MUST load content before bumping sessionId so TiptapEditor remounts with correct content
  const openFile = useCallback(async (fname: string, ftype: FileType) => {
    cancelSave()
    const c = await readFile(fname, ftype)
    skipNextReadRef.current = true // openFile already loaded content, skip redundant effect read
    setFilename(fname)
    setFileType(ftype)
    setContent(c)
    contentRef.current = c
    filenameRef.current = fname
    fileTypeRef.current = ftype
    setSessionId((s) => s + 1)
  }, [api])

  // ---- Effects ----

  // Listen for IPC: main process tells us to open a memo (register once, use ref)
  const openFileRef = useRef(openFile)
  openFileRef.current = openFile
  useEffect(() => {
    const cleanup = api.onOpenMemo((fname: string) => openFileRef.current(fname, 'memo'))
    return () => { cleanup?.() }
  }, [api])

  // Re-read content when sessionId changes (mode toggle, cross-window sync).
  // openFile already loads content before bumping sessionId, so skip redundant reads.
  useEffect(() => {
    if (!filename) return
    if (skipNextReadRef.current) {
      skipNextReadRef.current = false
      return
    }
    readFile(filename, fileType).then((c) => {
      setContent(c)
      contentRef.current = c
    }).catch(() => {})
  }, [sessionId]) // eslint-disable-line -- sessionId encapsulates all file identity changes

  // Apply config-driven appearance on mount, on config changes, and on system theme changes
  useEffect(() => {
    function applyAppearance() {
      api.configGet().then((cfg: any) => {
        const ws = cfg.lastWindowState
        const eff = resolveTheme(cfg.theme)
        document.documentElement.setAttribute('data-theme', eff)
        const panelColor = cfg.theme === 'system' ? THEME_DEFAULTS[eff].panelColor : ws.panelColor
        const fontColor = cfg.theme === 'system' ? THEME_DEFAULTS[eff].fontColor : ws.fontColor
        const { r, g, b } = hexToRgb(panelColor)
        document.documentElement.style.setProperty('--panel-bg', `rgba(${r},${g},${b},${ws.opacity})`)
        document.documentElement.style.setProperty('--text-primary', fontColor)
        const blurPx = typeof ws.blur === 'number' ? ws.blur : 24
        document.documentElement.style.setProperty('--panel-blur', `${blurPx}px`)
        api.windowSetLevel(ws.alwaysOnTop)
      })
    }
    applyAppearance()
    const cleanup = api.onConfigChanged(applyAppearance)
    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    const mqHandler = () => applyAppearance()
    mq.addEventListener('change', mqHandler)
    return () => {
      cleanup?.()
      mq.removeEventListener('change', mqHandler)
    }
  }, [api])

  // Cross-window sync (register once with cleanup)
  useEffect(() => {
    const cleanup = api.onDataChanged(() => {
      const fn = filenameRef.current
      const ft = fileTypeRef.current
      if (!fn) return
      readFile(fn, ft).then((c) => {
        if (c !== contentRef.current) {
          setContent(c)
          contentRef.current = c
          // Bump session to remount Tiptap with fresh content
          setSessionId((s) => s + 1)
        }
      }).catch(() => {})
    })
    return () => { cleanup?.() }
  }, [api])

  // ---- Handlers ----

  const handleChange = useCallback((newContent: string) => {
    setContent(newContent)
    contentRef.current = newContent

    cancelSave()
    const fn = filenameRef.current
    const ft = fileTypeRef.current
    if (!fn) return

    saveTimerRef.current = setTimeout(() => {
      writeFile(fn, newContent, ft)
      ;(window as any).__electron_ipc_send?.('update-tray-badge')
    }, 500)
  }, [api])

  const handleRename = useCallback(async (newTitle: string) => {
    const fn = filenameRef.current
    if (!fn || fileTypeRef.current !== 'memo') return
    cancelSave()
    const newFilename = await api.memoRename(fn, newTitle)
    openFile(newFilename, 'memo')
  }, [api, openFile])

  const handleSwitchMemo = useCallback((newFilename: string) => {
    // Flush current content synchronously before switching
    const fn = filenameRef.current
    const ft = fileTypeRef.current
    cancelSave()
    if (fn && contentRef.current) {
      writeFile(fn, contentRef.current, ft)
    }
    openFile(newFilename, 'memo')
  }, [api, openFile])

  const handleSwitchTodo = useCallback((newFilename: string) => {
    const fn = filenameRef.current
    const ft = fileTypeRef.current
    cancelSave()
    if (fn && contentRef.current) {
      writeFile(fn, contentRef.current, ft)
    }
    openFile(newFilename, 'todo')
  }, [api, openFile])

  const handleToggleMode = useCallback(async () => {
    // Save current content, re-read for clean round-trip, then switch mode
    const fn = filenameRef.current
    const ft = fileTypeRef.current
    cancelSave()
    if (fn && contentRef.current) {
      await writeFile(fn, contentRef.current, ft)
    }
    setMode((m) => (m === 'plain' ? 'wysiwyg' : 'plain'))
    setSessionId((s) => s + 1) // forces re-read and remount
  }, [api])

  const showHeader = headerVisible || popoverOpen

  return (
    <div className="flex flex-col h-screen frosted-glass rounded-xl overflow-hidden">
      {/* Invisible hover trigger — only active when header is hidden */}
      {!showHeader && (
        <div
          className="absolute top-0 left-0 right-0 h-12 z-30"
          onMouseEnter={() => setHeaderVisible(true)}
        />
      )}

      {!showHeader && (
        <button
          onClick={() => api.windowClose()}
          className="absolute top-3 left-3 w-3 h-3 rounded-full bg-red-500 hover:bg-red-400 z-50 transition-colors"
        />
      )}

      <EditorHeader
        visible={showHeader}
        filename={filename}
        mode={mode}
        onToggleMode={handleToggleMode}
        onSwitchMemo={handleSwitchMemo}
        onSwitchTodo={handleSwitchTodo}
        onRename={handleRename}
        onClose={() => api.windowClose()}
        onPopoverChange={setPopoverOpen}
        onMouseLeave={() => { if (!popoverOpen) setHeaderVisible(false) }}
      />

      <div className="flex-1 overflow-y-auto">
        {filename ? (
          mode === 'plain' ? (
            <PlainTextEditor key={`p-${sessionId}`} content={content} onChange={handleChange} />
          ) : (
            <TiptapEditor key={`w-${sessionId}`} content={content} onChange={handleChange} />
          )
        ) : (
          <div className="flex items-center justify-center h-full text-[var(--text-secondary)] text-sm">
            Open a memo from the command palette (⌥ Space)
          </div>
        )}
      </div>
    </div>
  )
}
