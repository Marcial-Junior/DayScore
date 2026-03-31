import { useState, useRef, useEffect } from 'react'
import { todayStr, formatTime12h } from '../../utils/dates'

const Checkmark = () => (
  <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
  </svg>
)

const TrashIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
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

// 0=Sun 1=Mon 2=Tue 3=Wed 4=Thu 5=Fri 6=Sat
const DAY_LABELS = ['S', 'M', 'T', 'W', 'T', 'F', 'S']
const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'fri', 'Sat']

const EMOJI_LIST = ['🏋️', '🧘', '🏃', '📚', '💧', '🥗', '😴', '⏰', '💻', '🎵', '🚴', '🧹', '✍️', '🎸', '🧠', '🌅', '💊', '🏊', '🤸', '🎯']

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
    <div
      ref={ref}
      className="absolute left-0 top-full mt-1 z-20 bg-white border border-gray-200 rounded-xl shadow-lg p-2 grid grid-cols-5 gap-1 w-44"
    >
      {EMOJI_LIST.map((em) => (
        <button
          key={em}
          type="button"
          onClick={() => onSelect(em)}
          className="text-xl hover:bg-gray-100 rounded-lg p-1 transition-colors"
        >
          {em}
        </button>
      ))}
    </div>
  )
}

export default function Routine({ routines, updateRoutines }) {
  const today = todayStr()
  const [selectedDate, setSelectedDate] = useState(today)
  const [newHabit, setNewHabit] = useState('')
  const [newTime, setNewTime] = useState('')
  const [newEmoji, setNewEmoji] = useState('')
  const [newActiveDays, setNewActiveDays] = useState([1, 2, 3, 4, 5]) // Mon-Fri default
  const [showEmojiPicker, setShowEmojiPicker] = useState(false)

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

  // Which routines are active on the selected date
  const selectedDayOfWeek = new Date(selectedDate + 'T12:00:00').getDay()
  const activeRoutines = routines.filter((r) => {
    if (!r.activeDays || r.activeDays.length === 0) return true // empty = all days
    return r.activeDays.includes(selectedDayOfWeek)
  })

  // Sort: timed first (ascending), then untimed
  const sortedRoutines = [...activeRoutines].sort((a, b) => {
    if (!a.time && !b.time) return 0
    if (!a.time) return 1
    if (!b.time) return -1
    return a.time.localeCompare(b.time)
  })

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
    setNewActiveDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    )
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Routine</h1>
        <p className="text-gray-400 text-sm mt-0.5">Daily habits to build consistency</p>
      </div>

      {/* Date navigation */}
      <div className="flex items-center justify-between bg-white rounded-xl border border-gray-100 shadow-sm px-4 py-3">
        <button
          onClick={() => navigateDay(-1)}
          disabled={!canGoPrev}
          className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        >
          <ChevronLeft />
        </button>
        <div className="text-center">
          <p className={`font-semibold text-sm ${isToday ? 'text-primary' : 'text-gray-800'}`}>
            {dateLabel(selectedDate, today)}
          </p>
          {isPast && (
            <p className="text-[10px] text-gray-400 mt-0.5">Retroactive entry</p>
          )}
        </div>
        <button
          onClick={() => navigateDay(1)}
          disabled={!canGoNext}
          className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        >
          <ChevronRight />
        </button>
      </div>

      {/* Add habit form */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 space-y-3">
        <form onSubmit={addHabit} className="space-y-3">
          <div className="flex gap-2">
            {/* Emoji button */}
            <div className="relative flex-shrink-0">
              <button
                type="button"
                onClick={() => setShowEmojiPicker((v) => !v)}
                className="w-10 h-10 flex items-center justify-center bg-gray-50 border border-gray-200 rounded-lg text-xl hover:bg-gray-100 transition-colors"
              >
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
              type="text"
              value={newHabit}
              onChange={(e) => setNewHabit(e.target.value)}
              placeholder="Habit name..."
              className="flex-1 bg-gray-50 border border-transparent rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/20 placeholder-gray-400"
            />
            <input
              type="time"
              value={newTime}
              onChange={(e) => setNewTime(e.target.value)}
              className="w-24 bg-gray-50 border border-transparent rounded-lg px-2 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-primary/30 flex-shrink-0"
            />
          </div>
          {/* Active days toggles */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-400 flex-shrink-0">Active:</span>
            <div className="flex gap-1">
              {DAY_LABELS.map((label, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => toggleActiveDay(i)}
                  className={`w-7 h-7 rounded-full text-[11px] font-semibold transition-colors ${
                    newActiveDays.includes(i)
                      ? 'bg-primary text-white'
                      : 'bg-gray-100 text-gray-400 hover:bg-gray-200'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
            <button
              type="submit"
              disabled={!newHabit.trim()}
              className="ml-auto bg-primary text-white rounded-lg px-4 py-2 text-sm font-medium disabled:opacity-40 hover:bg-primary/90 transition-colors flex-shrink-0"
            >
              Add
            </button>
          </div>
        </form>
      </div>

      {/* Habit list */}
      {sortedRoutines.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-100 py-12 text-center text-gray-400">
          <p className="text-4xl mb-3">🌱</p>
          <p className="text-sm">
            {routines.length === 0
              ? 'No habits yet. Start building your routine!'
              : 'No habits scheduled for this day.'}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {sortedRoutines.map((routine) => {
            const isDone = routine.completions?.[selectedDate]
            const activeDays = routine.activeDays || []

            return (
              <div key={routine.id} className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => toggleCompletion(routine.id)}
                    className={`w-6 h-6 rounded-full border-2 flex-shrink-0 flex items-center justify-center transition-all ${
                      isDone
                        ? 'bg-success border-success'
                        : isPast
                        ? 'border-gray-200 hover:border-gray-400'
                        : 'border-gray-300 hover:border-primary'
                    }`}
                  >
                    {isDone && <Checkmark />}
                  </button>
                  <span
                    className={`flex-1 font-medium text-sm ${
                      isDone
                        ? 'line-through text-gray-400'
                        : isPast
                        ? 'text-gray-500'
                        : 'text-gray-900'
                    }`}
                  >
                    {routine.name}
                  </span>
                  {routine.time && (
                    <span className="text-[11px] font-mono bg-primary/10 text-primary px-2 py-0.5 rounded-full flex-shrink-0">
                      {formatTime12h(routine.time)}
                    </span>
                  )}
                  {/* Active day pills */}
                  <div className="flex gap-0.5 flex-shrink-0">
                    {DAY_LABELS.map((label, i) => (
                      <span
                        key={i}
                        className={`w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-semibold ${
                          activeDays.includes(i) || activeDays.length === 0
                            ? 'bg-primary/15 text-primary'
                            : 'bg-gray-100 text-gray-300'
                        }`}
                      >
                        {label}
                      </span>
                    ))}
                  </div>
                  <button
                    onClick={() => deleteRoutine(routine.id)}
                    className="text-gray-300 hover:text-red-400 transition-colors flex-shrink-0"
                  >
                    <TrashIcon />
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
