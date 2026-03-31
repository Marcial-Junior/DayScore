import { useState, useEffect } from 'react'
import { todayStr, getWeekWindow } from '../../utils/dates'
import { t } from '../../utils/i18n'

const ICON_BG_COLORS = ['#fff8e6', '#e8f5ee', '#EEEDFE', '#E6F1FB', '#FAEEDA', '#FCEBEB']
const DEFAULT_ICONS = ['⭐', '✅', '💪', '🎯', '📌', '🔑', '⚡', '🌟']

// Mon-Fri day-of-week indices (JS: 0=Sun)
const WEEKDAY_INDICES = [1, 2, 3, 4, 5]

const EMOJI_BY_CATEGORY = {
  Health: ['⏰', '🏃', '🧘', '💧', '🥗', '😴', '🏋️', '🚴', '💊', '🫁', '🚿', '🦷'],
  Work:   ['💼', '📧', '💰', '🎯', '📊', '📝', '✍️', '💻', '📞', '🗂️'],
  Mind:   ['🧠', '📚', '🙏', '🎵', '🎨', '📖', '🌿', '🧩', '✨'],
  Home:   ['🏠', '🧹', '🍳', '🛒', '🐶', '🌱', '☕'],
  Fun:    ['🎮', '🎸', '⚽', '🏊', '🎬', '🎤'],
}
const ALL_EMOJIS = Object.values(EMOJI_BY_CATEGORY).flat()
const CATEGORIES = ['All', ...Object.keys(EMOJI_BY_CATEGORY)]

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

function formatTime(time) {
  if (!time) return ''
  const [h, m] = time.split(':').map(Number)
  const ampm = h >= 12 ? 'PM' : 'AM'
  const h12 = h % 12 || 12
  return `${h12}:${String(m).padStart(2, '0')} ${ampm}`
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

function dateLabel(dateStr, today, lang) {
  if (dateStr === today) return t('today_label', lang)
  const d = new Date(dateStr + 'T12:00:00')
  return d.toLocaleDateString(t('locale', lang), { weekday: 'short', month: 'short', day: 'numeric' })
}

function ExpandedEmojiPicker({ selected, onSelect }) {
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('All')

  const baseList = category === 'All' ? ALL_EMOJIS : (EMOJI_BY_CATEGORY[category] || [])
  const filtered = search.trim()
    ? baseList.filter((e) => e.includes(search.trim()))
    : baseList

  return (
    <div className="mt-2 bg-gray-50 rounded-xl p-3 border border-gray-100">
      <p className="text-[10px] font-semibold text-gray-700 mb-2">Choose an icon</p>
      <input
        type="text"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="🔍  Search emoji..."
        className="w-full bg-white border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/20 mb-2"
      />
      <div className="flex gap-1.5 overflow-x-auto pb-1 mb-2 scrollbar-hide">
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            type="button"
            onClick={() => setCategory(cat)}
            className={`text-[9px] px-2.5 py-1 rounded-full font-semibold whitespace-nowrap flex-shrink-0 transition-colors ${
              category === cat
                ? 'bg-primary text-white'
                : 'bg-primary/10 text-primary hover:bg-primary/20'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {filtered.map((em) => (
          <button
            key={em}
            type="button"
            onClick={() => onSelect(em)}
            className={`w-8 h-8 rounded-lg text-base flex items-center justify-center transition-all ${
              selected === em
                ? 'bg-primary/10 outline outline-2 outline-primary'
                : 'hover:bg-gray-200'
            }`}
          >
            {em}
          </button>
        ))}
        {filtered.length === 0 && (
          <p className="col-span-7 text-center text-[10px] text-gray-400 py-2">No results</p>
        )}
      </div>
    </div>
  )
}

export default function Routine({ routines, updateRoutines, lang }) {
  const today = todayStr()
  const [selectedDate, setSelectedDate] = useState(today)
  const [showAddForm, setShowAddForm] = useState(false)
  const [editingRoutine, setEditingRoutine] = useState(null)
  const [newHabit, setNewHabit] = useState('')
  const [newTime, setNewTime] = useState('')
  const [newEmoji, setNewEmoji] = useState('')
  const [newActiveDays, setNewActiveDays] = useState([1, 2, 3, 4, 5])
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

  const isFormOpen = showAddForm || editingRoutine !== null
  const isEditing = editingRoutine !== null

  // Populate form when editing
  useEffect(() => {
    if (editingRoutine) {
      const emoji = extractEmoji(editingRoutine.name)
      const name = emoji ? stripEmoji(editingRoutine.name) : editingRoutine.name
      setNewEmoji(emoji || '')
      setNewHabit(name)
      setNewTime(editingRoutine.time || '')
      setNewActiveDays(editingRoutine.activeDays || [1, 2, 3, 4, 5])
    }
  }, [editingRoutine])

  const openAdd = () => {
    setNewHabit('')
    setNewTime('')
    setNewEmoji('')
    setNewActiveDays([1, 2, 3, 4, 5])
    setShowEmojiPicker(false)
    setEditingRoutine(null)
    setShowAddForm(true)
  }

  const closeForm = () => {
    setShowAddForm(false)
    setEditingRoutine(null)
    setNewHabit('')
    setNewTime('')
    setNewEmoji('')
    setNewActiveDays([1, 2, 3, 4, 5])
    setShowEmojiPicker(false)
  }

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
  const monFriDates = WEEKDAY_INDICES.map((dow) => weekDays[dow - 1])
  const weekMtwtf = t('week_mtwtf', lang)
  const daySunSat = t('week_sun_sat', lang)

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!newHabit.trim()) return
    const fullName = (newEmoji ? newEmoji + ' ' : '') + newHabit.trim()
    if (isEditing) {
      updateRoutines(
        routines.map((r) =>
          r.id === editingRoutine.id
            ? { ...r, name: fullName, time: newTime || null, activeDays: newActiveDays }
            : r
        )
      )
    } else {
      const habit = {
        id: crypto.randomUUID(),
        name: fullName,
        time: newTime || null,
        activeDays: newActiveDays,
        completions: {},
      }
      updateRoutines([...routines, habit])
    }
    closeForm()
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
        <h1 className="text-lg font-bold text-gray-900">{t('routine', lang)}</h1>
        <p className="text-gray-400 text-xs mt-0.5">{t('routine_sub', lang)}</p>
      </div>

      {/* Date navigation */}
      <div className="flex items-center justify-between bg-white rounded-xl border border-gray-100 shadow-sm px-4 py-2.5">
        <button onClick={() => navigateDay(-1)} disabled={!canGoPrev}
          className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 disabled:opacity-30 transition-colors">
          <ChevronLeft />
        </button>
        <div className="text-center">
          <p className={`font-semibold text-sm ${isToday ? 'text-primary' : 'text-gray-800'}`}>
            {dateLabel(selectedDate, today, lang)}
          </p>
          {isPast && <p className="text-[10px] text-gray-400 mt-0.5">{t('retroactive', lang)}</p>}
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
          const iconContent = emoji || DEFAULT_ICONS[idx % DEFAULT_ICONS.length]
          const iconBg = ICON_BG_COLORS[idx % ICON_BG_COLORS.length]
          const rstreak = calcRoutineStreak(routine.completions)

          // Week dots (Mon-Fri)
          const doneThisWeek = monFriDates.filter((d) => d <= today && routine.completions?.[d]).length
          const totalThisWeek = monFriDates.filter((d) => d <= today).length

          return (
            <div key={routine.id} className="bg-white rounded-xl border border-gray-100 shadow-sm p-3 flex items-center gap-3">
              {/* Icon */}
              <div
                className="w-9 h-9 rounded-xl flex items-center justify-center text-lg flex-shrink-0"
                style={{ backgroundColor: iconBg }}
              >
                {iconContent}
              </div>

              {/* Body */}
              <div className="flex-1 min-w-0">
                <button
                  className="font-semibold text-sm text-gray-900 truncate text-left w-full hover:text-primary transition-colors"
                  onClick={() => setEditingRoutine(routine)}
                >
                  {displayName}
                </button>
                {routine.time && (
                  <p className="text-xs font-bold text-primary mb-1.5">{formatTime(routine.time)}</p>
                )}
                {/* Day dots + streak */}
                <div className="flex items-center justify-between mt-1">
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
                          {weekMtwtf[i]}
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
            <p className="text-sm">{t('no_habits_day', lang)}</p>
          </div>
        )}

        {/* Dashed add row */}
        <button
          onClick={openAdd}
          className="w-full bg-white rounded-xl border border-dashed border-gray-300 py-3 flex items-center justify-center gap-2 text-gray-400 hover:text-primary hover:border-primary transition-colors text-sm"
        >
          <span className="text-base">➕</span>
          {t('add_new_habit', lang)}
        </button>
      </div>

      {/* Floating modal (add / edit) */}
      {isFormOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-start justify-center pt-10 px-4 overflow-y-auto"
          onClick={closeForm}>
          <div className="bg-white rounded-2xl p-4 shadow-2xl w-full max-w-sm animate-drop-in my-4"
            onClick={(e) => e.stopPropagation()}>
            <p className="font-semibold text-gray-800 text-sm mb-3">
              {isEditing ? t('edit_habit', lang) : t('add_habit', lang)}
            </p>
            <form onSubmit={handleSubmit} className="space-y-3">
              <div className="flex gap-2">
                <button type="button" onClick={() => setShowEmojiPicker((v) => !v)}
                  className={`w-10 h-10 flex items-center justify-center bg-gray-50 border rounded-lg text-xl hover:bg-gray-100 transition-colors flex-shrink-0 ${
                    showEmojiPicker ? 'border-primary' : 'border-gray-200'
                  }`}>
                  {newEmoji || '😊'}
                </button>
                <input
                  type="text"
                  value={newHabit}
                  onChange={(e) => setNewHabit(e.target.value)}
                  placeholder={t('habit_placeholder', lang)}
                  className="flex-1 bg-gray-50 border border-transparent rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 placeholder-gray-400"
                  autoFocus
                />
                <input
                  type="time"
                  value={newTime}
                  onChange={(e) => setNewTime(e.target.value)}
                  className="w-20 bg-gray-50 border border-transparent rounded-xl px-2 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-primary/30 flex-shrink-0"
                />
              </div>

              {showEmojiPicker && (
                <ExpandedEmojiPicker
                  selected={newEmoji}
                  onSelect={(em) => { setNewEmoji(em); setShowEmojiPicker(false) }}
                />
              )}

              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-400 flex-shrink-0">{t('active_label', lang)}</span>
                <div className="flex gap-1">
                  {daySunSat.map((label, i) => (
                    <button key={i} type="button" onClick={() => toggleActiveDay(i)}
                      className={`w-7 h-7 rounded-full text-[11px] font-semibold transition-colors ${
                        newActiveDays.includes(i) ? 'bg-primary text-white' : 'bg-gray-100 text-gray-400'
                      }`}>
                      {label}
                    </button>
                  ))}
                </div>
              </div>
              {isEditing && (
                <button
                  type="button"
                  onClick={() => { deleteRoutine(editingRoutine.id); closeForm() }}
                  className="w-full py-2 rounded-xl text-xs text-red-400 hover:bg-red-50 transition-colors"
                >
                  🗑️ Delete habit
                </button>
              )}
              <div className="flex gap-2">
                <button type="button" onClick={closeForm}
                  className="flex-1 py-3 rounded-xl border border-gray-200 text-sm text-gray-500 font-medium">
                  {t('cancel', lang)}
                </button>
                <button type="submit" disabled={!newHabit.trim()}
                  className="flex-1 py-3 rounded-xl bg-primary text-white text-sm font-semibold disabled:opacity-40 hover:bg-primary/90 transition-colors">
                  {isEditing ? t('save', lang) : t('add', lang)}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
