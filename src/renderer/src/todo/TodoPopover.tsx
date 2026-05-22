import { useState, useEffect, useCallback, useRef } from 'react'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent
} from '@dnd-kit/core'
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  horizontalListSortingStrategy,
  useSortable
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { TodoItem } from './TodoItem'
import { TodoTabBar } from './TodoTabBar'
import { useApi } from '../hooks/use-ipc'

type ViewMode = 'todo' | 'note'

function SortableViewTab({
  id,
  label,
  active,
  onSelect
}: {
  id: ViewMode
  label: string
  active: boolean
  onSelect: () => void
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id })
  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    color: active ? 'var(--text-primary)' : 'var(--text-secondary)',
    background: active ? 'rgba(0,0,0,0.06)' : 'transparent',
    cursor: isDragging ? 'grabbing' : 'pointer',
    opacity: isDragging ? 0.7 : 1
  }
  return (
    <button
      ref={setNodeRef}
      onClick={onSelect}
      className="text-sm font-semibold px-2.5 py-1 rounded-md transition-colors"
      style={{ border: 'none', ...style }}
      {...attributes}
      {...listeners}
    >
      {label}
    </button>
  )
}

function SortableMemoItem({
  id,
  filename,
  title,
  modifiedAt,
  preview,
  onOpen,
  onRename,
  onDelete
}: {
  id: string
  filename: string
  title: string
  modifiedAt: number
  preview: string
  onOpen: () => void
  onRename: (newTitle: string) => void
  onDelete: () => void
}) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id })
  const [isEditing, setIsEditing] = useState(false)
  const [draft, setDraft] = useState(title)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus()
      inputRef.current.select()
    }
  }, [isEditing])

  const beginEdit = () => {
    setDraft(title)
    setIsEditing(true)
  }
  const commitEdit = () => {
    const next = draft.trim()
    if (next && next !== title) onRename(next)
    setIsEditing(false)
  }
  const cancelEdit = () => {
    setDraft(title)
    setIsEditing(false)
  }

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      {...attributes}
    >
      <div
        className="group flex items-center gap-2 px-3 py-2 transition-colors"
        style={{
          borderBottom: '1px solid var(--border-color)',
          cursor: isEditing ? 'default' : 'pointer',
          background: 'transparent'
        }}
        onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(0,0,0,0.04)')}
        onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
        onClick={() => { if (!isEditing) onOpen() }}
      >
        <span
          className="text-xs cursor-grab active:cursor-grabbing select-none flex-shrink-0"
          style={{ color: 'var(--text-secondary)', opacity: 0.5 }}
          onClick={(e) => e.stopPropagation()}
          {...listeners}
        >
          ⋮⋮
        </span>
        <div className="flex-1 min-w-0" onDoubleClick={(e) => { e.stopPropagation(); beginEdit() }}>
          {isEditing ? (
            <input
              ref={inputRef}
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onBlur={commitEdit}
              onClick={(e) => e.stopPropagation()}
              onPointerDown={(e) => e.stopPropagation()}
              onKeyDown={(e) => {
                if (e.key === 'Enter') { e.preventDefault(); commitEdit() }
                else if (e.key === 'Escape') { e.preventDefault(); cancelEdit() }
              }}
              className="text-sm font-medium block w-full bg-transparent outline-none border-0 p-0"
              style={{ color: 'var(--text-primary)', font: 'inherit' }}
            />
          ) : (
            <div className="text-sm font-medium truncate" style={{ color: 'var(--text-primary)' }}>
              {title || 'Untitled'}
            </div>
          )}
          <div className="text-xs truncate mt-0.5" style={{ color: 'var(--text-secondary)' }}>
            {new Date(modifiedAt).toLocaleDateString()}
            {preview ? ` · ${preview}` : ''}
          </div>
        </div>
        <button
          onClick={(e) => { e.stopPropagation(); onDelete() }}
          onPointerDown={(e) => e.stopPropagation()}
          className="opacity-0 group-hover:opacity-100 text-xs transition-opacity flex-shrink-0"
          style={{ color: 'var(--text-secondary)', background: 'none', border: 'none', cursor: 'pointer', padding: '2px 6px' }}
          onMouseEnter={(e) => (e.currentTarget.style.color = '#ff3b30')}
          onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-secondary)')}
          title="Delete"
        >
          ✕
        </button>
      </div>
    </div>
  )
}

function SortableTodoItem({
  id,
  text,
  done,
  reminder,
  pinned,
  onToggle,
  onDelete,
  onSetReminder,
  onRename,
  onTogglePin
}: {
  id: string
  text: string
  done: boolean
  reminder?: string
  pinned?: boolean
  onToggle: () => void
  onDelete: () => void
  onSetReminder: (reminder: string | undefined) => void
  onRename: (text: string) => void
  onTogglePin: () => void
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id })

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition: isDragging ? 'none' : transition,
    opacity: isDragging ? 0.6 : 1,
    zIndex: isDragging ? 10 : undefined,
    position: 'relative'
  }

  return (
    <div ref={setNodeRef} style={style} {...attributes}>
      <TodoItem
        text={text}
        done={done}
        reminder={reminder}
        pinned={pinned}
        onToggle={onToggle}
        onDelete={onDelete}
        onSetReminder={onSetReminder}
        onRename={onRename}
        onTogglePin={onTogglePin}
        dragHandleProps={listeners}
      />
    </div>
  )
}

function reorderTasks(tasks: TodoTask[]): TodoTask[] {
  const pinned = tasks.filter((t) => t.pinned)
  const activeUnpinned = tasks.filter((t) => !t.pinned && !t.done)
  const doneUnpinned = tasks.filter((t) => !t.pinned && t.done)
  return [...pinned, ...activeUnpinned, ...doneUnpinned]
}

export function TodoPopover() {
  const api = useApi()
  const [lists, setLists] = useState<TodoList[]>([])
  const [activeFilename, setActiveFilename] = useState<string>('')
  const [newTaskText, setNewTaskText] = useState('')
  const [showCompleted, setShowCompleted] = useState(true)
  const [showOverdueBanner, setShowOverdueBanner] = useState(false)
  const [showTrash, setShowTrash] = useState(false)
  const [trashTasks, setTrashTasks] = useState<TodoTask[]>([])
  const [viewMode, setViewMode] = useState<ViewMode>('todo')
  const [memos, setMemos] = useState<MemoMeta[]>([])
  const [tabOrder, setTabOrder] = useState<ViewMode[]>(['todo', 'note'])
  const addTaskInputRef = useRef<HTMLInputElement>(null)

  // Force re-render every 30s so overdue colors update in real time
  const [, setTick] = useState(0)
  useEffect(() => {
    const timer = setInterval(() => setTick((t) => t + 1), 30_000)
    return () => clearInterval(timer)
  }, [])

  const loadLists = useCallback(async () => {
    const all = await api.todoList()
    // Apply saved tab order from config
    const config = await api.configGet()
    const order: string[] = (config as any).todoOrder || []
    const sorted = [...all].sort((a, b) => {
      const ai = order.indexOf(a.filename)
      const bi = order.indexOf(b.filename)
      if (ai === -1 && bi === -1) return 0
      if (ai === -1) return 1
      if (bi === -1) return -1
      return ai - bi
    })
    setLists(sorted)
    if (!activeFilename && sorted.length > 0) {
      setActiveFilename(sorted[0].filename)
    }
  }, [api, activeFilename])

  const loadMemos = useCallback(async () => {
    const all = await api.memoList()
    const config = await api.configGet()
    const order: string[] = (config as any).memoOrder || []
    if (order.length === 0) { setMemos(all); return }
    const sorted = [...all].sort((a, b) => {
      const ai = order.indexOf(a.filename)
      const bi = order.indexOf(b.filename)
      if (ai === -1 && bi === -1) return 0
      if (ai === -1) return 1
      if (bi === -1) return -1
      return ai - bi
    })
    setMemos(sorted)
  }, [api])

  // Use ref so IPC listeners always call the latest loadLists without re-registering
  const loadListsRef = useRef(loadLists)
  loadListsRef.current = loadLists
  const loadMemosRef = useRef(loadMemos)
  loadMemosRef.current = loadMemos

  useEffect(() => {
    loadLists()
    loadTrash()
    loadMemos()
  }, [loadLists, loadMemos])

  useEffect(() => {
    const cleanup = api.onFocusNewTodo?.(() => {
      setViewMode('todo')
      setShowTrash(false)
      setLists((curr) => {
        if (curr.length > 0) {
          setActiveFilename((prev) => prev || curr[0].filename)
        }
        return curr
      })
      setTimeout(() => addTaskInputRef.current?.focus(), 80)
    })
    return () => { cleanup?.() }
  }, [api])

  useEffect(() => {
    api.configGet().then((cfg) => {
      const order = (cfg as any).viewTabOrder
      if (
        Array.isArray(order) &&
        order.length === 2 &&
        order.includes('todo') &&
        order.includes('note')
      ) {
        setTabOrder(order as ViewMode[])
      }
    })
  }, [api])

  // Register IPC listeners ONCE, use ref to call latest callback
  useEffect(() => {
    const cleanupData = api.onDataChanged(() => {
      loadListsRef.current()
      loadMemosRef.current()
    })
    const cleanupAlert = typeof api.onReminderAlert === 'function'
      ? api.onReminderAlert(() => {
          loadListsRef.current()
          setShowOverdueBanner(true) // auto-expand banner on alert
        })
      : undefined
    return () => {
      cleanupData?.()
      cleanupAlert?.()
    }
  }, [api])

  const activeList = lists.find((l) => l.filename === activeFilename)
  const tasks = activeList?.tasks || []
  const orderedTasks = reorderTasks(tasks)
  const displayTasks = showCompleted ? orderedTasks : orderedTasks.filter((t) => !t.done)
  const hiddenCount = orderedTasks.length - displayTasks.length
  const taskId = (t: TodoTask): string => `task::${t.text}::${t.done ? 'd' : 'a'}::${t.pinned ? 'p' : 'u'}`

  const now = Date.now()
  const overdueTasks = tasks.filter((t) => {
    if (t.done || !t.reminder) return false
    try {
      const match = t.reminder.match(/^(\d{4})-(\d{1,2})-(\d{1,2})-(\d{2})(\d{2})([+-]\d{1,2})$/)
      if (!match) return false
      const [, year, month, day, hour, min, offsetStr] = match
      const offset = parseInt(offsetStr, 10)
      const sign = offset >= 0 ? '+' : '-'
      const absOffset = Math.abs(offset)
      const iso = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}T${hour}:${min}:00${sign}${String(absOffset).padStart(2, '0')}:00`
      const d = new Date(iso)
      return !isNaN(d.getTime()) && d.getTime() <= now
    } catch { return false }
  })

  const saveTasks = useCallback(
    async (newTasks: TodoTask[]) => {
      if (!activeFilename) return
      const sorted = reorderTasks(newTasks)
      await api.todoWrite(activeFilename, sorted)
      ;(window as any).__electron_ipc_send?.('update-tray-badge')
      loadLists()
    },
    [activeFilename, api, loadLists]
  )

  const loadTrash = async () => {
    const items = await api.todoReadTrash()
    setTrashTasks(items)
  }

  const handleSelectTrash = () => {
    loadTrash()
    setShowTrash(true)
  }

  const handleSelectTab = (filename: string) => {
    setActiveFilename(filename)
    setShowTrash(false)
  }

  const handleToggle = (index: number) => {
    const allTasks = [...tasks]
    const task = displayTasks[index]
    const realIndex = allTasks.findIndex((t) => t.text === task.text && t.done === task.done)
    if (realIndex >= 0) {
      allTasks[realIndex] = { ...allTasks[realIndex], done: !allTasks[realIndex].done }
      saveTasks(allTasks)
    }
  }

  const handleDelete = async (index: number) => {
    const task = displayTasks[index]
    if (!task || !activeFilename) return
    // Single atomic IPC: remove from list + add to trash in main process
    await api.todoDeleteTask(activeFilename, task.text, task.done)
    loadLists()
    loadTrash()
  }

  const handleSetReminder = (index: number, reminder: string | undefined) => {
    const allTasks = [...tasks]
    const task = displayTasks[index]
    const realIndex = allTasks.findIndex((t) => t.text === task.text && t.done === task.done)
    if (realIndex >= 0) {
      allTasks[realIndex] = { ...allTasks[realIndex], reminder }
      saveTasks(allTasks)
    }
  }

  const handleRename = (index: number, newText: string) => {
    const allTasks = [...tasks]
    const task = displayTasks[index]
    const realIndex = allTasks.findIndex((t) => t.text === task.text && t.done === task.done)
    if (realIndex >= 0) {
      allTasks[realIndex] = { ...allTasks[realIndex], text: newText }
      saveTasks(allTasks)
    }
  }

  const handleTogglePin = (index: number) => {
    const allTasks = [...tasks]
    const task = displayTasks[index]
    const realIndex = allTasks.findIndex((t) => t.text === task.text && t.done === task.done)
    if (realIndex >= 0) {
      allTasks[realIndex] = { ...allTasks[realIndex], pinned: !allTasks[realIndex].pinned }
      saveTasks(allTasks)
    }
  }

  const handleAddTask = () => {
    if (!newTaskText.trim()) return
    const newTask: TodoTask = { text: newTaskText.trim(), done: false }
    saveTasks([...tasks, newTask])
    setNewTaskText('')
  }

  const handleCreateList = async (name: string) => {
    const filename = await api.todoCreateList(name)
    setActiveFilename(filename)
    loadLists()
  }

  const handleCreateMemo = async () => {
    const title = `Untitled ${new Date().toISOString().slice(0, 10)}`
    const filename = await api.memoCreate(title)
    await api.openMemo(filename)
  }

  const handleRenameMemo = async (filename: string, newTitle: string) => {
    await api.memoRename(filename, newTitle)
  }

  const handleDeleteMemo = async (filename: string, title: string) => {
    if (!window.confirm(`Delete "${title || filename.replace('.md', '')}"?\n\nThis cannot be undone.`)) return
    await api.memoDelete(filename)
  }

  const handleTabDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id) return
    const oldIndex = tabOrder.indexOf(active.id as ViewMode)
    const newIndex = tabOrder.indexOf(over.id as ViewMode)
    if (oldIndex < 0 || newIndex < 0) return
    const next = [...tabOrder]
    const [removed] = next.splice(oldIndex, 1)
    next.splice(newIndex, 0, removed)
    setTabOrder(next)
    api.configSet({ viewTabOrder: next } as any)
  }

  const handleMemoDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id) return
    const oldIndex = memos.findIndex((m) => `memo-${m.filename}` === active.id)
    const newIndex = memos.findIndex((m) => `memo-${m.filename}` === over.id)
    if (oldIndex < 0 || newIndex < 0) return
    const reordered = [...memos]
    const [removed] = reordered.splice(oldIndex, 1)
    reordered.splice(newIndex, 0, removed)
    setMemos(reordered)
    api.configSet({ memoOrder: reordered.map((m) => m.filename) } as any)
  }

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id) return

    const oldIndex = displayTasks.findIndex((t) => taskId(t) === active.id)
    const newIndex = displayTasks.findIndex((t) => taskId(t) === over.id)

    if (oldIndex < 0 || newIndex < 0) return

    const reordered = [...displayTasks]
    const [removed] = reordered.splice(oldIndex, 1)
    reordered.splice(newIndex, 0, removed)

    const hidden = showCompleted ? [] : tasks.filter((t) => t.done && !t.pinned)
    const sorted = reorderTasks([...reordered, ...hidden])
    // Optimistic update so the drop animation lands on the final layout
    // instead of bouncing back while saveTasks roundtrips through disk.
    setLists((prev) =>
      prev.map((l) => (l.filename === activeFilename ? { ...l, tasks: sorted } : l))
    )
    saveTasks(sorted)
  }

  return (
    <div
      className="frosted-fixed flex flex-col h-screen rounded-xl overflow-hidden"
      style={{ border: '1px solid var(--border-color)' }}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between px-3 py-2"
        style={{ borderBottom: '1px solid var(--border-color)' }}
      >
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleTabDragEnd}
        >
          <SortableContext items={tabOrder} strategy={horizontalListSortingStrategy}>
            <div className="flex items-center gap-0.5">
              {tabOrder.map((m) => (
                <SortableViewTab
                  key={m}
                  id={m}
                  label={m === 'todo' ? 'Todo' : 'Note'}
                  active={viewMode === m}
                  onSelect={() => { setViewMode(m); setShowTrash(false) }}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
        <div className="flex items-center gap-1">
          {viewMode === 'todo' ? (
            <>
              {overdueTasks.length > 0 && (
                <button
                  onClick={() => setShowOverdueBanner(!showOverdueBanner)}
                  className="text-xs px-2 py-1 rounded transition-colors"
                  style={{
                    background: 'rgba(180, 130, 60, 0.15)',
                    color: '#a1845c',
                    border: 'none',
                    cursor: 'pointer',
                    fontWeight: 600
                  }}
                  title="Show overdue tasks"
                >
                  {overdueTasks.length}!
                </button>
              )}
              <button
                onClick={() => setShowCompleted(!showCompleted)}
                className="text-xs px-2 py-1 rounded transition-colors"
                style={{
                  background: showCompleted ? 'rgba(0,0,0,0.06)' : 'var(--accent)',
                  color: showCompleted ? 'var(--text-secondary)' : '#fff',
                  border: 'none',
                  cursor: 'pointer'
                }}
              >
                {showCompleted ? 'All' : 'Active'}
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => api.openSettings()}
                className="px-1 transition-colors"
                style={{
                  background: 'transparent',
                  color: 'var(--text-secondary)',
                  border: 'none',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
                onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--text-primary)')}
                onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-secondary)')}
                title="Settings"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="3" />
                  <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
                </svg>
              </button>
              <button
                onClick={handleCreateMemo}
                className="text-xs px-2 py-1 rounded transition-colors"
                style={{
                  background: 'rgba(0,0,0,0.06)',
                  color: 'var(--text-primary)',
                  border: 'none',
                  cursor: 'pointer'
                }}
              >
                + New
              </button>
            </>
          )}
        </div>
      </div>

      {/* Overdue alert banner, collapsible */}
      {viewMode === 'todo' && overdueTasks.length > 0 && showOverdueBanner && (
        <div
          className="px-4 py-2 text-xs flex items-start gap-2"
          style={{
            background: 'rgba(180, 130, 60, 0.1)',
            color: '#a1845c',
            borderBottom: '1px solid var(--border-color)'
          }}
        >
          <div className="flex-1">
            <span style={{ fontWeight: 600 }}>{overdueTasks.length} overdue</span>
            {' · '}
            {overdueTasks.map((t) => t.text).join(' || ')}
          </div>
          <button
            onClick={() => setShowOverdueBanner(false)}
            style={{ color: '#a1845c', cursor: 'pointer', flexShrink: 0 }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="18 15 12 9 6 15" />
            </svg>
          </button>
        </div>
      )}

      {/* Task list */}
      <div className="flex-1 overflow-y-auto py-1">
        {viewMode === 'note' ? (
          memos.length === 0 ? (
            <div className="text-center text-xs py-8" style={{ color: 'var(--text-secondary)' }}>
              No notes yet. Click + New to create one.
            </div>
          ) : (
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleMemoDragEnd}
            >
              <SortableContext
                items={memos.map((m) => `memo-${m.filename}`)}
                strategy={verticalListSortingStrategy}
              >
                {memos.map((m) => (
                  <SortableMemoItem
                    key={`memo-${m.filename}`}
                    id={`memo-${m.filename}`}
                    filename={m.filename}
                    title={m.title}
                    modifiedAt={m.modifiedAt}
                    preview={m.preview}
                    onOpen={() => api.openMemo(m.filename)}
                    onRename={(t) => handleRenameMemo(m.filename, t)}
                    onDelete={() => handleDeleteMemo(m.filename, m.title)}
                  />
                ))}
              </SortableContext>
            </DndContext>
          )
        ) : showTrash ? (
          <div className="px-3 py-2">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold" style={{ color: 'var(--text-secondary)' }}>
                Recycle Bin ({trashTasks.length})
              </span>
              {trashTasks.length > 0 && (
                <button
                  onClick={async () => { await api.todoClearTrash(); loadTrash() }}
                  className="text-xs"
                  style={{ color: '#ef4444', border: 'none', background: 'none', cursor: 'pointer' }}
                >
                  Clear all
                </button>
              )}
            </div>
            {trashTasks.length === 0 && (
              <div className="text-center text-xs py-4" style={{ color: 'var(--text-secondary)' }}>
                Trash is empty
              </div>
            )}
            {trashTasks.map((task, i) => (
              <div
                key={i}
                className="flex items-center gap-2 px-1 py-1.5 rounded text-sm"
                style={{ color: 'var(--text-secondary)' }}
              >
                <span className="flex-1 truncate" style={{ textDecoration: task.done ? 'line-through' : 'none' }}>
                  {task.text}
                </span>
                <button
                  onClick={async () => {
                    const restored = await api.todoRestoreFromTrash(i)
                    if (restored && activeFilename) {
                      const newTasks = [...tasks, restored]
                      await api.todoWrite(activeFilename, newTasks)
                    }
                    loadTrash()
                    loadLists()
                  }}
                  className="text-xs px-1.5 py-0.5 rounded"
                  style={{ color: 'var(--accent)', border: 'none', background: 'rgba(0,0,0,0.04)', cursor: 'pointer' }}
                  title="Restore"
                >
                  Restore
                </button>
                <button
                  onClick={async () => { await api.todoPermanentDelete(i); loadTrash() }}
                  className="text-xs px-1.5 py-0.5 rounded"
                  style={{ color: '#ef4444', border: 'none', background: 'rgba(0,0,0,0.04)', cursor: 'pointer' }}
                  title="Delete permanently"
                >
                  Delete
                </button>
              </div>
            ))}
          </div>
        ) : (
        <>
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={displayTasks.map((t) => taskId(t))}
            strategy={verticalListSortingStrategy}
          >
            {displayTasks.map((task, i) => (
              <SortableTodoItem
                key={taskId(task)}
                id={taskId(task)}
                text={task.text}
                done={task.done}
                reminder={task.reminder}
                pinned={task.pinned}
                onToggle={() => handleToggle(i)}
                onDelete={() => handleDelete(i)}
                onSetReminder={(r) => handleSetReminder(i, r)}
                onRename={(t) => handleRename(i, t)}
                onTogglePin={() => handleTogglePin(i)}
              />
            ))}
          </SortableContext>
        </DndContext>

        {!showCompleted && hiddenCount > 0 && (
          <div
            className="text-center text-xs py-2"
            style={{ color: 'var(--text-secondary)' }}
          >
            {hiddenCount} completed task{hiddenCount > 1 ? 's' : ''} hidden
          </div>
        )}

        {/* Add task input */}
        <div className="px-3 py-2">
          <input
            ref={addTaskInputRef}
            value={newTaskText}
            onChange={(e) => setNewTaskText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleAddTask()
            }}
            placeholder="+ Add task..."
            className="w-full rounded-lg px-3 py-2 text-sm outline-none"
            style={{
              background: 'rgba(0,0,0,0.04)',
              color: 'var(--text-primary)',
              border: '1px solid transparent'
            }}
            onFocus={(e) => {
              e.currentTarget.style.background = 'rgba(0,0,0,0.06)'
              e.currentTarget.style.border = '1px solid var(--border-color)'
            }}
            onBlur={(e) => {
              e.currentTarget.style.background = 'rgba(0,0,0,0.04)'
              e.currentTarget.style.border = '1px solid transparent'
            }}
          />
        </div>
        </>
        )}
      </div>

      {/* Tab bar, only in Todo mode */}
      {viewMode === 'todo' && (
      <TodoTabBar
        lists={lists.map((l) => ({ filename: l.filename, name: l.name }))}
        activeFilename={activeFilename}
        onSelect={handleSelectTab}
        onCreateList={handleCreateList}
        onSelectTrash={handleSelectTrash}
        showTrash={showTrash}
        trashCount={trashTasks.length}
        onDeleteList={async (filename) => {
          await api.todoDeleteList(filename)
          const remaining = lists.filter((l) => l.filename !== filename)
          if (remaining.length > 0) {
            setActiveFilename(remaining[0].filename)
          }
          loadLists()
        }}
        onRenameList={async (filename, newName) => {
          const newFilename = await api.todoRenameList(filename, newName)
          setActiveFilename(newFilename)
          loadLists()
        }}
        onReorder={(filenames) => {
          // Reorder lists in state to match drag result
          const ordered = filenames.map((fn) => lists.find((l) => l.filename === fn)!).filter(Boolean)
          setLists(ordered)
          // Persist order in config
          api.configSet({ todoOrder: filenames } as any)
        }}
      />
      )}
    </div>
  )
}
