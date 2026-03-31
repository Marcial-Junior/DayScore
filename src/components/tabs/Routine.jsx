import { useState, useRef, useEffect } from 'react'
import { todayStr, getWeekWindow } from '../../utils/dates'

const ICON_BG_COLORS = ['#fff8e6', '#e8f5ee', '#EEEDFE', '#E6F1FB', '#FAEEDA', '#FCEBEB']

// Mon-Fri day-of-week indices (JS: 0=Sun)
const WEEKDAY_INDICES = [1, 2, 3, 4, 5]
const WEEKDAY_LABELS = ['M', 'T', 'W', 'T', 'F']

const DAY_ALL_LABELS = ['S', 'M', 'T', 'W', 'T', 'F', 'S']

const EMOJI_LIST = ['🏋️', '🧘', '🏃', '📚', '💧', '🥗', '😴', '⏰', '💻', '🎵', '🚴', '🧹', '✍️', '🎸', '🧠', '🌅', '💊', '🏊', '🤸', '🎯']

function extractEmoji(name) {
  const match = name.match(/^\p{Emoji_Presentation}/u) || name.match(/^\p{Emoji}\uFE0F/u) || name.match(/^[\u{1F300}-\u{1FAFF}]/u)
  return match ? match[0] : null
}

function stripEmoji(name) {
  return name.replace(/^[\p{Emoji_Presentation}\p{Emoji}\uFE0F\s]+/u, '').trim()
}

function calcRoutineStreak(completions) {
  const today = todayStr()
  let streak = 0
  let d = today
  while (completions?.[d]) {
    streak++
    const prev = new Date(d + 'T12:00:00')
    prev.setDate(prev.getDate() - 1)
    d = prev.toISOString().split('T')[0]
  }
  return streak
}

const Checkmark = () => (
  <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
  </svg>
)

const ChevronLeft = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
  </svg>
)
const ChevronRight = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
  </svg>
)

function offsetDate(base, offset) {
  const d = new Date(base + 'T12:00:00')
  d.setDate(d.getDate() + offset)
  return d.toISOString().split('T')[0]
}

function dateLabel(dateStr, today) {
  if (dateStr === today) return 'Today'
  const d = new Date(dateStr + 'T12:00:00')
  return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
}

function EmojiPicker({ onSelect, onClose }) {
  const ref = useRef(null)
  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) onClose() }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [onClose])
  return (
    <div ref={ref} className="absolute left-0 top-full mt-1 z-20 bg-white border border-gray-200 rounded-xl shadow-lg p-2 grid grid-cols-5 gap-1 w-44">
      {EMOJI_LIST.map((em) => (
        <button key={em} type="button" onClick={() => onSelect(em)}
          className="text-xl hover:bg-gray-100 rounded-lg p-1 transition-colors">{em}</button>
      ))}
    </div>
  )
}

export default function Routine({ routines, updateRoutines }) {
  const today = todayStr()
  const [selectedDate, setSelectedDate] = useState(today)
  const [showAddForm, setShowAddForm] = useState(false)
  const [newHabit, setNewHabit] = useState('')
  const [newTime, setNewTime] = useState('')
  const [newEmoji, setNewEmoji] = useState('')
  const [newActiveDays, setNewActiveDays] = useState([1, 2, 3, 4, 5])
  const [showEmojiPicker, setShowEmojiPicker] = useState(false)
  const inputRef = useRef(null)

  const isPast = selectedDate < today
  const isToday = selectedDate === today
  const canGoPrev = offsetDate(selectedDate, -1) >= offsetDate(today, -7)
  const canGoNext = selectedDate < today

  const navigateDay = (dir) => {
    const next = offsetDate(selectedDate, dir)
    if (dir < 0 && !canGoPrev) return
    if (dir > 0 && !canGoNext) return
    setSelectedDate(next)
  }

  useEffect(() => {
    if (showAddForm) setTimeout(() => inputRef.current?.focus(), 50)
  }, [showAddForm])

  const selectedDayOfWeek = new Date(selectedDate + 'T12:00:00').getDay()
  const activeRoutines = routines.filter((r) => {
    if (!r.activeDays || r.activeDays.length === 0) return true
    return r.activeDays.includes(selectedDayOfWeek)
  })

  const sortedRoutines = [...activeRoutines].sort((a, b) => {
    if (!a.time && !b.time) return 0
    if (!a.time) return 1
    if (!b.time) return -1
    return a.time.localeCompare(b.time)
  })

  // Get Mon-Fri dates for the current week
  const weekDays = getWeekWindow(0)
  const monFriDates = WEEKDAY_INDICES.map((dow) => weekDays[dow - 1]) // Mon=index0, Tue=1...

  const addHabit = (e) => {
    e.preventDefault()
    if (!newHabit.trim()) return
    const habit = {
      id: crypto.randomUUID(),
      name: (newEmoji ? newEmoji + ' ' : '') + newHabit.trim(),
      time: newTime || null,
      activeDays: newActiveDays,
      completions: {},
    }
    updateRoutines([...routines, habit])
    setNewHabit('')
    setNewTime('')
    setNewEmoji('')
    setNewActiveDays([1, 2, 3, 4, 5])
    setShowAddForm(false)
  }

  const toggleCompletion = (routineId) => {
    updateRoutines(
      routines.map((r) => {
        if (r.id !== routineId) return r
        const completions = { ...r.completions, [selectedDate]: !r.completions?.[selectedDate] }
        return { ...r, completions }
      })
    )
  }

  const deleteRoutine = (routineId) => {
    updateRoutines(routines.filter((r) => r.id !== routineId))
  }

  const toggleActiveDay = (day) => {
    setNewActiveDays((prev) => prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day])
  }

  return (
    <div className="space-y-3">
      <div>
        <h1 className="text-lg font-bold text-gray-900">Routine</h1>
        <p className="text-gray-400 text-xs mt-0.5">Daily habits to build consistency</p>
      </div>

      {/* Date navigation */}
      <div className="flex items-center justify-between bg-white rounded-xl border border-gray-100 shadow-sm px-4 py-2.5">
        <button onClick={() => navigateDay(-1)} disabled={!canGoPrev}
          className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 disabled:opacity-30 transition-colors">
          <ChevronLeft />
        </button>
        <div className="text-center">
          <p className={`font-semibold text-sm ${isToday ? 'text-primary' : 'text-gray-800'}`}>
            {dateLabel(selectedDate, today)}
          </p>
          {isPast && <p className="text-[10px] text-gray-400 mt-0.5">Retroactive entry</p>}
        </div>
        <button onClick={() => navigateDay(1)} disabled={!canGoNext}
          className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 disabled:opacity-30 transition-colors">
          <ChevronRight />
        </button>
      </div>

      {/* Habit list */}
      <div className="space-y-2">
        {sortedRoutines.map((routine, idx) => {
          const isDone = routine.completions?.[selectedDate]
          const emoji = extractEmoji(routine.name)
          const displayName = emoji ? stripEmoji(routine.name) : routine.name
          const iconBg = ICON_BG_COLORS[idx % ICON_BG_COLORS.length]
          const rstreak = calcRoutineStreak(routine.completions)

          // Week progress (Mon-Fri)
          const doneThisWeek = monFriDates.filter((d) => d <= today && routine.completions?.[d]).length
          const totalThisWeek = monFriDates.filter((d) => d <= today).length
          const pct = totalThisWeek > 0 ? Math.round((doneThisWeek / totalThisWeek) * 100) : 0
          const barColor = pct >= 80 ? '#1D9E75' : pct >= 50 ? '#534AB7' : '#EF9F27'

          return (
            <div key={routine.id} className="bg-white rounded-xl border border-gray-100 shadow-sm p-3 flex items-center gap-3">
              {/* Icon */}
              <div
                className="w-9 h-9 rounded-xl flex items-center justify-center text-lg flex-shrink-0"
                style={{ backgroundColor: iconBg }}
              >
                {emoji || displayName[0]?.toUpperCase()}
              </div>

              {/* Body */}
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm text-gray-900 truncate mb-1.5">{displayName}</p>
                {/* Progress bar */}
                <div className="h-[3px] bg-gray-100 rounded-full overflow-hidden mb-2">
                  <div className="h-full rounded-full transition-all duration-500"
                    style={{ width: `${pct}%`, backgroundColor: barColor }} />
                </div>
                {/* Day dots + streak */}
                <div className="flex items-center justify-between">
                  <div className="flex gap-1">
                    {monFriDates.map((date, i) => {
                      const isThisToday = date === today
                      const done = routine.completions?.[date]
                      const isFutureDate = date > today
                      return (
                        <div key={date}
                          className={`w-4 h-4 rounded-full flex items-center justify-center text-[8px] font-semibold ${
                            isFutureDate
                              ? 'bg-gray-100 text-gray-300'
                              : done
                              ? 'bg-success text-white'
                              : isThisToday
                              ? 'bg-primary text-white'
                              : 'bg-gray-100 text-gray-400'
                          }`}
                        >
                          {WEEKDAY_LABELS[i]}
                        </div>
                      )
                    })}
                  </div>
                  {rstreak > 0 && (
                    <span className="text-[9px] font-semibold text-amber-500 flex-shrink-0">🔥 {rstreak}d</span>
                  )}
                </div>
              </div>

              {/* Checkmark */}
              <button
                onClick={() => toggleCompletion(routine.id)}
                onLongPress={() => deleteRoutine(routine.id)}
                className={`w-7 h-7 rounded-full border-2 flex-shrink-0 flex items-center justify-center transition-all ${
                  isDone ? 'bg-success border-success' : isPast ? 'border-gray-200' : 'border-gray-300 hover:border-primary'
                }`}
              >
                {isDone && <Checkmark />}
              </button>
            </div>
          )
        })}

        {/* Empty state if no active routines but routines exist */}
        {sortedRoutines.length === 0 && routines.length > 0 && (
          <div className="bg-white rounded-xl border border-gray-100 py-8 text-center text-gray-400">
            <p className="text-sm">No habits scheduled for this day.</p>
          </div>
        )}

        {/* Dashed add row */}
        <button
          onClick={() => setShowAddForm(true)}
          className="w-full bg-white rounded-xl border border-dashed border-gray-300 py-3 flex items-center justify-center gap-2 text-gray-400 hover:text-primary hover:border-primary transition-colors text-sm"
        >
          <span className="text-base">➕</span>
          Add new habit...
        </button>
      </div>

      {/* Bottom sheet add form */}
      {showAddForm && (
        <div className="fixed inset-0 z-50 bg-black/30" onClick={() => setShowAddForm(false)}>
          <div className="absolute bottom-0 left-0 right-0 bg-white rounded-t-2xl p-4 pb-10 shadow-2xl"
            onClick={(e) => e.stopPropagation()}>
            <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto mb-4" />
            <p className="font-semibold text-gray-800 text-sm mb-3">Add habit</p>
            <form onSubmit={addHabit} className="space-y-3">
              <div className="flex gap-2">
                <div className="relative flex-shrink-0">
                  <button type="button" onClick={() => setShowEmojiPicker((v) => !v)}
                    className="w-10 h-10 flex items-center justify-center bg-gray-50 border border-gray-200 rounded-lg text-xl hover:bg-gray-100 transition-colors">
                    {newEmoji || '😊'}
                  </button>
                  {showEmojiPicker && (
                    <EmojiPicker
                      onSelect={(em) => { setNewEmoji(em); setShowEmojiPicker(false) }}
                      onClose={() => setShowEmojiPicker(false)}
                    />
                  )}
                </div>
                <input
                  ref={inputRef}
                  type="text"
                  value={newHabit}
                  onChange={(e) => setNewHabit(e.target.value)}
                  placeholder="Habit name..."
                  className="flex-1 bg-gray-50 border border-transparent rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 placeholder-gray-400"
                />
                <input
                  type="time"
                  value={newTime}
                  onChange={(e) => setNewTime(e.target.value)}
                  className="w-20 bg-gray-50 border border-transparent rounded-xl px-2 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-primary/30 flex-shrink-0"
                />
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-400 flex-shrink-0">Active:</span>
                <div className="flex gap-1">
                  {DAY_ALL_LABELS.map((label, i) => (
                    <button key={i} type="button" onClick={() => toggleActiveDay(i)}
                      className={`w-7 h-7 rounded-full text-[11px] font-semibold transition-colors ${
                        newActiveDays.includes(i) ? 'bg-primary text-white' : 'bg-gray-100 text-gray-400'
                      }`}>
                      {label}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex gap-2">
                <button type="button" onClick={() => setShowAddForm(false)}
                  className="flex-1 py-3 rounded-xl border border-gray-200 text-sm text-gray-500 font-medium">
                  Cancel
                </button>
                <button type="submit" disabled={!newHabit.trim()}
                  className="flex-1 py-3 rounded-xl bg-primary text-white text-sm font-semibold disabled:opacity-40 hover:bg-primary/90 transition-colors">
                  Add
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
