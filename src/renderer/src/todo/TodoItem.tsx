import { useEffect, useRef, useState } from 'react'

function formatReminder(reminder: string): string {
  const match = reminder.match(/^(\d+)-(\d+)-(\d+)-(\d{2})(\d{2})([+-]\d+)?$/)
  if (!match) return reminder
  const [, , month, day, hour, minute] = match
  return `${Number(month)}/${Number(day)} ${hour}:${minute}`
}

function getLocalTimezoneOffset(): number {
  return -(new Date().getTimezoneOffset() / 60)
}

function toDatetimeLocal(reminder: string): string {
  const match = reminder.match(/^(\d+)-(\d+)-(\d+)-(\d{2})(\d{2})([+-]\d+)?$/)
  if (!match) return ''
  const [, year, month, day, hour, minute] = match
  return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}T${hour}:${minute}`
}

function toDateValue(reminder: string): string {
  const match = reminder.match(/^(\d+)-(\d+)-(\d+)-(\d{2})(\d{2})([+-]\d+)?$/)
  if (!match) return ''
  const [, year, month, day] = match
  return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`
}

function toTimeValue(reminder: string): string {
  const match = reminder.match(/^(\d+)-(\d+)-(\d+)-(\d{2})(\d{2})([+-]\d+)?$/)
  if (!match) return ''
  const [, , , , hour, minute] = match
  return `${hour}:${minute}`
}

function fromDateAndTime(dateVal: string, timeVal: string): string {
  if (!dateVal || !timeVal) return ''
  const [year, month, day] = dateVal.split('-')
  const [hour, minute] = timeVal.split(':')
  const offset = getLocalTimezoneOffset()
  const sign = offset >= 0 ? '+' : ''
  return `${Number(year)}-${Number(month)}-${Number(day)}-${hour}${minute}${sign}${offset}`
}

function parseReminderToDate(reminder: string): Date | null {
  const match = reminder.match(/^(\d{4})-(\d{1,2})-(\d{1,2})-(\d{2})(\d{2})([+-]\d{1,2})$/)
  if (!match) return null
  const [, year, month, day, hour, min, offsetStr] = match
  const offset = parseInt(offsetStr, 10)
  const s = offset >= 0 ? '+' : '-'
  const absOffset = Math.abs(offset)
  const iso = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}T${hour}:${min}:00${s}${String(absOffset).padStart(2, '0')}:00`
  const d = new Date(iso)
  return isNaN(d.getTime()) ? null : d
}

function isOverdue(reminder: string): boolean {
  const d = parseReminderToDate(reminder)
  return d ? d.getTime() <= Date.now() : false
}

function todayDate(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function nowTime(): string {
  const d = new Date()
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

interface TodoItemProps {
  text: string
  done: boolean
  reminder?: string
  onToggle: () => void
  onDelete: () => void
  onSetReminder: (reminder: string | undefined) => void
  onRename: (text: string) => void
  dragHandleProps?: Record<string, unknown>
}

export function TodoItem({
  text,
  done,
  reminder,
  onToggle,
  onDelete,
  onSetReminder,
  onRename,
  dragHandleProps
}: TodoItemProps) {
  const [showPicker, setShowPicker] = useState(false)
  const [dateValue, setDateValue] = useState('')
  const [timeValue, setTimeValue] = useState('')
  const [isEditing, setIsEditing] = useState(false)
  const [draft, setDraft] = useState(text)
  const inputRef = useRef<HTMLInputElement>(null)
  const overdue = !done && reminder ? isOverdue(reminder) : false

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus()
      inputRef.current.select()
    }
  }, [isEditing])

  const beginEdit = () => {
    if (done) return
    setDraft(text)
    setIsEditing(true)
  }

  const commitEdit = () => {
    const next = draft.trim()
    if (next && next !== text) onRename(next)
    setIsEditing(false)
  }

  const cancelEdit = () => {
    setDraft(text)
    setIsEditing(false)
  }

  const handleClockClick = () => {
    if (reminder) {
      setDateValue(toDateValue(reminder))
      setTimeValue(toTimeValue(reminder))
    } else {
      setDateValue(todayDate())
      setTimeValue(nowTime())
    }
    setShowPicker(true)
  }

  const handleConfirm = () => {
    const result = fromDateAndTime(dateValue, timeValue)
    if (result) {
      onSetReminder(result)
    }
    setShowPicker(false)
  }

  const handleClear = () => {
    onSetReminder(undefined)
    setShowPicker(false)
  }

  return (
    <div
      className="group px-3 py-1.5 rounded-lg mx-1 relative"
      style={{ transition: 'background 0.1s' }}
      onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(0,0,0,0.04)')}
      onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
    >
      <div className="flex items-start gap-2">
        {/* Drag handle */}
        <span
          className="text-xs cursor-grab active:cursor-grabbing select-none mt-1"
          style={{ color: 'var(--text-secondary)', opacity: 0.5 }}
          {...dragHandleProps}
        >
          ⋮⋮
        </span>

        {/* Checkbox */}
        <button
          onClick={onToggle}
          className="flex items-center justify-center flex-shrink-0 transition-colors mt-0.5"
          style={{
            width: '1.125rem',
            height: '1.125rem',
            borderRadius: '4px',
            border: done ? 'none' : '1.5px solid var(--border-color)',
            background: done ? '#34c759' : 'transparent',
            cursor: 'pointer'
          }}
        >
          {done && <span style={{ color: 'white', fontSize: '10px', lineHeight: 1 }}>✓</span>}
        </button>

        {/* Content column, text + date aligned */}
        <div className="flex-1 min-w-0">
          {isEditing ? (
            <input
              ref={inputRef}
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onBlur={commitEdit}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  commitEdit()
                } else if (e.key === 'Escape') {
                  e.preventDefault()
                  cancelEdit()
                }
              }}
              onPointerDown={(e) => e.stopPropagation()}
              className="text-sm block w-full bg-transparent outline-none border-0 p-0"
              style={{
                color: 'var(--text-primary)',
                font: 'inherit'
              }}
            />
          ) : (
            <span
              className="text-sm truncate block"
              style={{
                color: done ? 'var(--text-secondary)' : overdue ? '#a1845c' : 'var(--text-primary)',
                textDecoration: done ? 'line-through' : 'none',
                cursor: done ? 'default' : 'text'
              }}
              onDoubleClick={beginEdit}
            >
              {text}
            </span>
          )}
          {reminder && !done && (
            <span
              className="inline-block text-xs px-1.5 py-0.5 rounded mt-0.5"
              style={{
                background: overdue ? 'rgba(180, 130, 60, 0.12)' : 'rgba(59, 130, 246, 0.12)',
                color: overdue ? '#a1845c' : '#3b82f6',
                fontSize: '10px',
                lineHeight: 1.2,
                whiteSpace: 'nowrap'
              }}
            >
              {overdue ? 'overdue · ' : ''}{formatReminder(reminder)}
            </span>
          )}
        </div>

        {/* Clock button */}
        <button
          onClick={handleClockClick}
          onPointerDown={(e) => e.stopPropagation()}
          className="opacity-0 group-hover:opacity-100 text-xs transition-opacity flex-shrink-0 mt-0.5"
          style={{ color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '12px' }}
          onMouseEnter={(e) => (e.currentTarget.style.color = '#3b82f6')}
          onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-secondary)')}
        >
          🕐
        </button>

        {/* Delete */}
        <button
          onClick={onDelete}
          onPointerDown={(e) => e.stopPropagation()}
          className="opacity-0 group-hover:opacity-100 text-xs transition-opacity mt-0.5"
          style={{ color: 'var(--text-secondary)', cursor: 'pointer' }}
          onMouseEnter={(e) => (e.currentTarget.style.color = '#ff3b30')}
          onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-secondary)')}
        >
          ✕
        </button>
      </div>

      {/* Date picker popover + backdrop */}
      {showPicker && (
        <>
          {/* Backdrop — click outside to dismiss */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setShowPicker(false)}
          />

          {/* Picker */}
          <div
            className="absolute left-6 top-full mt-1 z-50 rounded-xl border shadow-xl p-4"
            style={{
              background: 'var(--panel-bg, #fff)',
              borderColor: 'var(--border-color)',
              backdropFilter: 'blur(20px)',
              WebkitBackdropFilter: 'blur(20px)',
              minWidth: '240px'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Date + Time in a row */}
            <div className="flex gap-2 mb-3">
              <div className="flex-1">
                <div className="text-[10px] text-[var(--text-secondary)] font-semibold tracking-wider mb-1">DATE</div>
                <input
                  type="date"
                  value={dateValue}
                  onChange={(e) => setDateValue(e.target.value)}
                  className="w-full px-2 py-1.5 rounded-lg text-sm border outline-none"
                  style={{
                    background: 'rgba(0,0,0,0.04)',
                    color: 'var(--text-primary)',
                    borderColor: 'var(--border-color)'
                  }}
                  autoFocus
                />
              </div>
              <div style={{ width: '90px' }}>
                <div className="text-[10px] text-[var(--text-secondary)] font-semibold tracking-wider mb-1">TIME</div>
                <input
                  type="time"
                  value={timeValue}
                  onChange={(e) => setTimeValue(e.target.value)}
                  className="w-full px-2 py-1.5 rounded-lg text-sm border outline-none"
                  style={{
                    background: 'rgba(0,0,0,0.04)',
                    color: 'var(--text-primary)',
                    borderColor: 'var(--border-color)'
                  }}
                />
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2">
              {reminder && (
                <button
                  onClick={handleClear}
                  className="text-xs px-2 py-1 rounded transition-colors"
                  style={{ color: 'var(--text-secondary)', cursor: 'pointer' }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = '#ff3b30')}
                  onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-secondary)')}
                >
                  Clear
                </button>
              )}
              <div className="flex-1" />
              <button
                onClick={() => setShowPicker(false)}
                className="text-xs px-2 py-1 rounded"
                style={{ color: 'var(--text-secondary)', cursor: 'pointer' }}
              >
                Cancel
              </button>
              <button
                onClick={handleConfirm}
                className="text-xs px-3 py-1.5 rounded-lg text-white font-medium"
                style={{ background: 'var(--accent, #007aff)', cursor: 'pointer' }}
              >
                Done
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
