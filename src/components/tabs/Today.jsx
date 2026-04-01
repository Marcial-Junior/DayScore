import { useState, useRef, useEffect } from 'react'
import { todayStr, formatDate, daysBetween, getWeekWindow } from '../../utils/dates'
import { calcDayScore } from '../../utils/streak'
import { t } from '../../utils/i18n'
import ScoreRing from '../ui/ScoreRing'
import ConfettiBurst from '../ui/ConfettiBurst'

const MOODS = ['😔', '😐', '🙂', '😄', '🚀']

const Checkmark = () => (
  <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
  </svg>
)
const XIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
  </svg>
)
const PencilIcon = () => (
  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536M9 13l6.768-6.768a2 2 0 012.828 2.828L11.828 15.828a2 2 0 01-1.414.586H8v-2.414a2 2 0 01.586-1.414z" />
  </svg>
)

function offsetDate(base, offset) {
  const d = new Date(base + 'T12:00:00')
  d.setDate(d.getDate() + offset)
  return d.toISOString().split('T')[0]
}

function greeting(lang) {
  const h = new Date().getHours()
  if (h < 12) return t('good_morning', lang)
  if (h < 18) return t('good_afternoon', lang)
  return t('good_evening', lang)
}

// daysBetween(dueDate, today): negative = overdue, 0 = today, positive = future
function dueBadge(dueDate, done, lang) {
  if (!dueDate || done) return null
  const diff = daysBetween(dueDate, todayStr())
  if (diff < 0) return { label: t('overdue', lang), cls: 'bg-red-50 text-red-500 border border-red-200' }
  if (diff === 0) return { label: t('due_today', lang), cls: 'bg-amber-50 text-amber-600 border border-amber-200' }
  if (diff === 1) return { label: t('tomorrow', lang), cls: 'bg-amber-50 text-amber-500 border border-amber-100' }
  const d = new Date(dueDate + 'T12:00:00')
  const label = d.toLocaleDateString(t('locale', lang), { month: 'short', day: 'numeric' })
  return { label, cls: 'bg-gray-50 text-gray-400 border border-gray-200' }
}

function urgencyScore(task) {
  if (task.done) return 9999
  if (!task.dueDate) return 1000
  return daysBetween(task.dueDate, todayStr())
}

function catDotColor(category) {
  if (category === 'work') return 'bg-primary'
  if (category === 'personal') return 'bg-success'
  return 'bg-amber-300'
}

// Returns tasks from OTHER dates whose dueDate === targetDate
function getTasksDueOn(allTasks, targetDate) {
  const stored = allTasks[targetDate] || []
  const storedIds = new Set(stored.map((t) => t.id))
  return Object.values(allTasks)
    .flat()
    .filter((task) => task.dueDate === targetDate && !storedIds.has(task.id))
}

function shortDate(dateStr, lang) {
  const d = new Date(dateStr + 'T12:00:00')
  return d.toLocaleDateString(t('locale', lang), { month: 'short', day: 'numeric' })
}

function taskSectionLabel(date, today, lang) {
  if (date === today) return `${t('today_label', lang)} · ${shortDate(date, lang)}`
  if (date === offsetDate(today, 1)) return `${t('tomorrow', lang)} · ${shortDate(date, lang)}`
  const d = new Date(date + 'T12:00:00')
  return d.toLocaleDateString(t('locale', lang), { weekday: 'short', month: 'short', day: 'numeric' })
}

export default function Today({ tasks, updateTasks, mood, updateMood, routines, streak, userName, lang, todos, updateTodos }) {
  const today = todayStr()
  const [selectedDate, setSelectedDate] = useState(today)
  const [newTask, setNewTask] = useState('')
  const [newCategory, setNewCategory] = useState(null)
  const [newDueDate, setNewDueDate] = useState('')
  const [showAddForm, setShowAddForm] = useState(false)
  const [editingTask, setEditingTask] = useState(null)
  const [confettiOrigin, setConfettiOrigin] = useState(null)
  const [recentMood, setRecentMood] = useState(null)
  const inputRef = useRef(null)
  const longPressTimer = useRef(null)

  const isToday = selectedDate === today
  const isFuture = selectedDate > today

  // Tasks stored on selected date + tasks from other dates due on this date
  const dayTasks = tasks[selectedDate] || []
  const tasksDueHere = getTasksDueOn(tasks, selectedDate)
  const allVisibleTasks = [...dayTasks, ...tasksDueHere].sort((a, b) => urgencyScore(a) - urgencyScore(b))

  const score = calcDayScore(allVisibleTasks)
  const done = allVisibleTasks.filter((task) => task.done).length
  const remaining = allVisibleTasks.length - done
  const todayMood = mood[selectedDate] ?? null
  const weekDays = getWeekWindow(0)
  const weekLabels = t('week_mon_sun', lang)
  const moodLabels = t('mood_labels', lang)

  const isFormOpen = showAddForm || editingTask !== null

  // Focus input when form opens
  useEffect(() => {
    if (isFormOpen) setTimeout(() => inputRef.current?.focus(), 50)
  }, [isFormOpen])

  // Populate form when editing
  useEffect(() => {
    if (editingTask) {
      setNewTask(editingTask.text)
      setNewCategory(editingTask.category || null)
      setNewDueDate(editingTask.dueDate || '')
    }
  }, [editingTask])

  const openAdd = () => {
    setNewTask('')
    setNewCategory(null)
    setNewDueDate('')
    setEditingTask(null)
    setShowAddForm(true)
  }

  const closeForm = () => {
    setShowAddForm(false)
    setEditingTask(null)
    setNewTask('')
    setNewCategory(null)
    setNewDueDate('')
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!newTask.trim()) return
    if (editingTask) {
      // find which bucket stores this task
      const storageDate = Object.keys(tasks).find((d) => tasks[d].some((task) => task.id === editingTask.id))
      if (storageDate) {
        updateTasks({
          ...tasks,
          [storageDate]: tasks[storageDate].map((task) =>
            task.id === editingTask.id
              ? { ...task, text: newTask.trim(), category: newCategory, dueDate: newDueDate || null }
              : task
          ),
        })
      }
    } else {
      const task = {
        id: crypto.randomUUID(),
        text: newTask.trim(),
        done: false,
        isRoutine: false,
        category: newCategory,
        dueDate: newDueDate || null,
      }
      updateTasks({ ...tasks, [selectedDate]: [...dayTasks, task] })
    }
    closeForm()
  }

  const toggleTask = (id, btnEl) => {
    const storageDate = Object.keys(tasks).find((d) => tasks[d].some((task) => task.id === id))
    if (!storageDate) return
    const bucket = tasks[storageDate]
    const task = bucket.find((task) => task.id === id)
    if (task && !task.done && btnEl) {
      const rect = btnEl.getBoundingClientRect()
      setConfettiOrigin({ x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 })
      setTimeout(() => setConfettiOrigin(null), 800)
    }
    updateTasks({
      ...tasks,
      [storageDate]: bucket.map((task) => (task.id === id ? { ...task, done: !task.done } : task)),
    })
  }

  const deleteTask = (id) => {
    const storageDate = Object.keys(tasks).find((d) => tasks[d].some((task) => task.id === id))
    if (!storageDate) return
    updateTasks({
      ...tasks,
      [storageDate]: tasks[storageDate].filter((task) => task.id !== id),
    })
  }

  const startLongPress = (task) => {
    longPressTimer.current = setTimeout(() => setEditingTask(task), 500)
  }

  const cancelLongPress = () => {
    if (longPressTimer.current) clearTimeout(longPressTimer.current)
  }

  const setTodayMood = (index) => {
    updateMood({ ...mood, [selectedDate]: index })
    setRecentMood(index)
    setTimeout(() => setRecentMood(null), 600)
  }

  const toggleNewCategory = (cat) => {
    setNewCategory((prev) => (prev === cat ? null : cat))
  }

  const isEditing = editingTask !== null
  const sectionLabel = taskSectionLabel(selectedDate, today, lang)

  return (
    <div className="space-y-3">
      <ConfettiBurst origin={confettiOrigin} />

      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          {isToday ? (
            <>
              <h1 className="text-lg font-bold text-gray-900">{greeting(lang)}, {userName}!</h1>
              <p className="text-gray-400 text-xs mt-0.5">{formatDate(today)}</p>
            </>
          ) : (
            <>
              <h1 className="text-lg font-bold text-gray-900">{formatDate(selectedDate)}</h1>
              <p
                className="text-xs mt-0.5 text-primary/70 cursor-pointer"
                onClick={() => setSelectedDate(today)}
              >
                {t('tap_go_back', lang)}
              </p>
            </>
          )}
        </div>
        <div className="flex items-center gap-1 bg-amber-50 border border-amber-200 rounded-full px-2.5 py-1 flex-shrink-0">
          <span className="text-sm">🔥</span>
          <span className="font-bold text-amber-600 text-xs">{streak}</span>
        </div>
      </div>

      {/* Compact week strip */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm px-3 py-2.5">
        <div className="flex justify-between">
          {weekDays.map((date, i) => {
            const isThisToday = date === today
            const isSelected = date === selectedDate
            const dayNum = new Date(date + 'T12:00:00').getDate()
            const dayTasksForDate = tasks[date] || []
            const hasDone = dayTasksForDate.some((task) => task.done)
            // Amber dot: any task from any bucket with dueDate === date and not done
            const hasDue = !hasDone && Object.values(tasks).flat().some(
              (task) => task.dueDate === date && !task.done
            )

            return (
              <button
                key={date}
                onClick={() => setSelectedDate(date)}
                className="flex flex-col items-center gap-1"
              >
                <span className="text-[9px] text-gray-300 font-medium">{weekLabels[i]}</span>
                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold transition-all ${
                    isSelected && isThisToday
                      ? 'bg-primary text-white'
                      : isSelected
                      ? 'ring-2 ring-primary text-primary'
                      : hasDone
                      ? 'text-success'
                      : 'text-gray-500'
                  }`}
                >
                  {dayNum}
                </div>
                <div
                  className={`w-1 h-1 rounded-full ${
                    hasDone ? 'bg-success' : hasDue ? 'bg-amber-400' : 'bg-gray-200'
                  }`}
                />
              </button>
            )
          })}
        </div>
      </div>

      {/* Stats: ring + mini stats */}
      <div className="flex gap-3">
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm flex items-center justify-center p-3 flex-shrink-0">
          <ScoreRing score={score} size={56} strokeWidth={5} />
        </div>
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm flex-1 px-4 py-3 flex flex-col justify-around">
          <div className="flex justify-between items-center">
            <span className="text-[10px] text-gray-400">{t('planned', lang)}</span>
            <span className="text-xs font-semibold text-gray-800">{allVisibleTasks.length}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-[10px] text-gray-400">{t('done', lang)}</span>
            <span className="text-xs font-semibold text-success">{done}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-[10px] text-gray-400">{t('remaining', lang)}</span>
            <span className={`text-xs font-semibold ${remaining > 0 ? 'text-red-400' : 'text-gray-400'}`}>
              {remaining}
            </span>
          </div>
        </div>
      </div>

      {/* Task list */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        {/* Section label */}
        <div className="px-4 py-1.5 bg-gray-50 border-b border-gray-100">
          <p className="text-[9px] text-gray-400 uppercase tracking-wider font-semibold">{sectionLabel}</p>
        </div>
        {allVisibleTasks.length === 0 ? (
          <div className="py-8 text-center text-gray-400">
            <p className="text-3xl mb-2">📭</p>
            <p className="text-sm">{t('no_tasks', lang)}</p>
          </div>
        ) : (
          <ul>
            {allVisibleTasks.map((task, i) => {
              const badge = dueBadge(task.dueDate, task.done, lang)
              return (
                <li
                  key={task.id}
                  className={`flex items-center gap-3 px-4 py-3 group transition-colors hover:bg-gray-50 ${
                    i < allVisibleTasks.length - 1 ? 'border-b border-gray-50' : ''
                  }`}
                  onTouchStart={() => startLongPress(task)}
                  onTouchEnd={cancelLongPress}
                  onTouchMove={cancelLongPress}
                  onMouseLeave={cancelLongPress}
                >
                  <button
                    onClick={(e) => toggleTask(task.id, e.currentTarget)}
                    className={`w-5 h-5 rounded-full border-2 flex-shrink-0 flex items-center justify-center transition-all ${
                      task.done ? 'bg-success border-success' : 'border-gray-300 hover:border-primary'
                    }`}
                  >
                    {task.done && <Checkmark />}
                  </button>
                  <div className="flex-1 min-w-0">
                    <span
                      className={`text-sm block ${
                        task.done ? 'line-through text-gray-400' : 'text-gray-700'
                      }`}
                    >
                      {task.text}
                    </span>
                    {badge && (
                      <span className={`inline-block text-[10px] px-1.5 py-0.5 rounded mt-0.5 font-medium ${badge.cls}`}>
                        {badge.label}
                      </span>
                    )}
                  </div>
                  <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${catDotColor(task.category)}`} />
                  <button
                    onClick={() => setEditingTask(task)}
                    className="opacity-0 group-hover:opacity-100 text-gray-300 hover:text-primary transition-all"
                  >
                    <PencilIcon />
                  </button>
                  <button
                    onClick={() => deleteTask(task.id)}
                    className="opacity-0 group-hover:opacity-100 text-gray-300 hover:text-red-400 transition-all"
                  >
                    <XIcon />
                  </button>
                </li>
              )
            })}
          </ul>
        )}
      </div>

      {/* Due today — todos from To-Dos tab */}
      {(() => {
        const todaysTodos = (todos || []).filter((td) => td.dueDate === today && !td.done)
        if (!isToday || todaysTodos.length === 0) return null
        return (
          <div className="bg-amber-50 border border-amber-200 rounded-xl overflow-hidden">
            <div className="px-4 py-2 border-b border-amber-200">
              <p className="text-[10px] text-amber-700 font-semibold">📌 Due today — doesn't count in score</p>
            </div>
            <ul>
              {todaysTodos.map((todo, i) => (
                <li
                  key={todo.id}
                  className={`flex items-center gap-3 px-4 py-3 ${i < todaysTodos.length - 1 ? 'border-b border-amber-100' : ''}`}
                >
                  <button
                    onClick={() => updateTodos((todos || []).map((td) => td.id === todo.id ? { ...td, done: true } : td))}
                    className="w-5 h-5 rounded-full border-2 border-amber-400 flex-shrink-0 flex items-center justify-center hover:bg-amber-200 transition-all"
                  />
                  <span className="flex-1 text-sm text-amber-900">{todo.title}</span>
                  {todo.category && (
                    <span className="text-[9px] text-amber-600 font-medium capitalize">{todo.category}</span>
                  )}
                </li>
              ))}
            </ul>
          </div>
        )
      })()}

      {/* Mood selector */}
      {!isFuture && (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm px-4 py-3">
          <h2 className="text-[10px] text-gray-400 mb-2">
            {isToday ? t('how_feeling', lang) : t('mood_that_day', lang)}
          </h2>
          <div className="flex justify-around">
            {MOODS.map((emoji, i) => {
              const isSelected = todayMood === i
              return (
                <button
                  key={i}
                  onClick={() => setTodayMood(i)}
                  className="flex flex-col items-center gap-1 relative"
                >
                  {recentMood === i && (
                    <span className="absolute inset-0 rounded-full animate-ping bg-primary/20 pointer-events-none" />
                  )}
                  <span
                    className={`text-xl transition-all ${
                      isSelected ? 'bg-primary/10 rounded-full p-1' : 'p-1'
                    }`}
                  >
                    {emoji}
                  </span>
                  <span
                    className={`text-[9px] ${
                      isSelected ? 'text-primary font-semibold' : 'text-gray-400'
                    }`}
                  >
                    {moodLabels[i]}
                  </span>
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* FAB */}
      <button
        onClick={openAdd}
        className="fixed bottom-20 right-4 z-50 w-12 h-12 bg-primary rounded-full shadow-lg flex items-center justify-center text-white text-2xl hover:bg-primary/90 transition-all active:scale-95"
      >
        +
      </button>

      {/* Floating modal (add / edit) */}
      {isFormOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/40 flex items-start justify-center pt-16 px-4"
          onClick={closeForm}
        >
          <div
            className="bg-white rounded-2xl p-4 shadow-2xl w-full max-w-sm animate-drop-in"
            onClick={(e) => e.stopPropagation()}
          >
            <p className="font-semibold text-gray-800 text-sm mb-3">
              {isEditing ? t('edit_task', lang) : t('add_task', lang)}
            </p>
            <form onSubmit={handleSubmit} className="space-y-3">
              <input
                ref={inputRef}
                type="text"
                value={newTask}
                onChange={(e) => setNewTask(e.target.value)}
                placeholder={t('task_placeholder', lang)}
                className="w-full bg-gray-50 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 border border-transparent focus:border-primary/20 placeholder-gray-400"
              />
              <div className="flex gap-2 flex-wrap items-center">
                <button
                  type="button"
                  onClick={() => toggleNewCategory('work')}
                  className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                    newCategory === 'work'
                      ? 'bg-amber-50 border-amber-400 text-amber-700'
                      : 'border-gray-200 text-gray-400'
                  }`}
                >
                  💼 {t('work', lang)}
                </button>
                <button
                  type="button"
                  onClick={() => toggleNewCategory('personal')}
                  className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                    newCategory === 'personal'
                      ? 'bg-emerald-50 border-success text-success'
                      : 'border-gray-200 text-gray-400'
                  }`}
                >
                  🏠 {t('personal', lang)}
                </button>
                <input
                  type="date"
                  value={newDueDate}
                  onChange={(e) => setNewDueDate(e.target.value)}
                  className="px-3 py-1.5 rounded-full text-xs font-medium border border-gray-200 text-gray-500 bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 cursor-pointer"
                />
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={closeForm}
                  className="flex-1 py-3 rounded-xl border border-gray-200 text-sm text-gray-500 font-medium"
                >
                  {t('cancel', lang)}
                </button>
                <button
                  type="submit"
                  disabled={!newTask.trim()}
                  className="flex-1 py-3 rounded-xl bg-primary text-white text-sm font-semibold disabled:opacity-40 hover:bg-primary/90 transition-colors"
                >
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
