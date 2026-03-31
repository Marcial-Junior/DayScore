import { useState, useRef, useEffect } from 'react'
import { todayStr, formatDate, daysBetween, getWeekWindow } from '../../utils/dates'
import { calcDayScore } from '../../utils/streak'
import ScoreRing from '../ui/ScoreRing'
import ConfettiBurst from '../ui/ConfettiBurst'

const MOODS = ['😔', '😐', '🙂', '😄', '🚀']
const MOOD_LABELS = ['Rough', 'Okay', 'Good', 'Great', 'Amazing']
const WEEK_LABELS = ['M', 'T', 'W', 'T', 'F', 'S', 'S']

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

function greeting() {
  const h = new Date().getHours()
  if (h < 12) return 'Good morning'
  if (h < 18) return 'Good afternoon'
  return 'Good evening'
}

// daysBetween(dueDate, today): negative = overdue, 0 = today, positive = future
function dueBadge(dueDate, done) {
  if (!dueDate || done) return null
  const diff = daysBetween(dueDate, todayStr())
  if (diff < 0) return { label: 'Overdue', cls: 'bg-red-50 text-red-500 border border-red-200' }
  if (diff === 0) return { label: 'Due today', cls: 'bg-amber-50 text-amber-600 border border-amber-200' }
  if (diff === 1) return { label: 'Tomorrow', cls: 'bg-amber-50 text-amber-500 border border-amber-100' }
  const d = new Date(dueDate + 'T12:00:00')
  const label = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
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

export default function Today({ tasks, updateTasks, mood, updateMood, routines, streak, userName }) {
  const today = todayStr()
  const [selectedDate, setSelectedDate] = useState(today)
  const [newTask, setNewTask] = useState('')
  const [newCategory, setNewCategory] = useState(null)
  const [newDueDate, setNewDueDate] = useState('')
  const [showAddForm, setShowAddForm] = useState(false)
  const [confettiOrigin, setConfettiOrigin] = useState(null)
  const [recentMood, setRecentMood] = useState(null)
  const inputRef = useRef(null)

  const isToday = selectedDate === today
  const isFuture = selectedDate > today
  const dayTasks = tasks[selectedDate] || []
  const visibleTasks = [...dayTasks].sort((a, b) => urgencyScore(a) - urgencyScore(b))
  const score = calcDayScore(dayTasks)
  const done = dayTasks.filter((t) => t.done).length
  const remaining = dayTasks.length - done
  const todayMood = mood[selectedDate] ?? null
  const weekDays = getWeekWindow(0)

  // Focus input when sheet opens
  useEffect(() => {
    if (showAddForm) setTimeout(() => inputRef.current?.focus(), 50)
  }, [showAddForm])

  const addTask = (e) => {
    e.preventDefault()
    if (!newTask.trim()) return
    const task = {
      id: crypto.randomUUID(),
      text: newTask.trim(),
      done: false,
      isRoutine: false,
      category: newCategory,
      dueDate: newDueDate || null,
    }
    updateTasks({ ...tasks, [selectedDate]: [...dayTasks, task] })
    setNewTask('')
    setNewCategory(null)
    setNewDueDate('')
    setShowAddForm(false)
  }

  const toggleTask = (id, btnEl) => {
    const task = dayTasks.find((t) => t.id === id)
    if (task && !task.done && btnEl) {
      const rect = btnEl.getBoundingClientRect()
      setConfettiOrigin({ x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 })
      setTimeout(() => setConfettiOrigin(null), 800)
    }
    updateTasks({
      ...tasks,
      [selectedDate]: dayTasks.map((t) => (t.id === id ? { ...t, done: !t.done } : t)),
    })
  }

  const deleteTask = (id) => {
    updateTasks({ ...tasks, [selectedDate]: dayTasks.filter((t) => t.id !== id) })
  }

  const setTodayMood = (index) => {
    updateMood({ ...mood, [selectedDate]: index })
    setRecentMood(index)
    setTimeout(() => setRecentMood(null), 600)
  }

  const toggleNewCategory = (cat) => {
    setNewCategory((prev) => (prev === cat ? null : cat))
  }

  return (
    <div className="space-y-3">
      <ConfettiBurst origin={confettiOrigin} />

      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          {isToday ? (
            <>
              <h1 className="text-lg font-bold text-gray-900">{greeting()}, {userName}!</h1>
              <p className="text-gray-400 text-xs mt-0.5">{formatDate(today)}</p>
            </>
          ) : (
            <>
              <h1 className="text-lg font-bold text-gray-900">{formatDate(selectedDate)}</h1>
              <p className="text-xs mt-0.5">
                {isFuture ? (
                  <span className="text-primary font-medium">📅 Planning ahead</span>
                ) : (
                  <span className="text-gray-400">📖 Past day</span>
                )}
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
            const isToday = date === today
            const isSelected = date === selectedDate
            const dayNum = new Date(date + 'T12:00:00').getDate()
            const dayTasks2 = tasks[date] || []
            const hasDone = dayTasks2.some((t) => t.done)

            return (
              <button
                key={date}
                onClick={() => setSelectedDate(date)}
                className="flex flex-col items-center gap-1"
              >
                <span className="text-[9px] text-gray-300 font-medium">{WEEK_LABELS[i]}</span>
                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold transition-all ${
                    isSelected && isToday
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
                  className={`w-1 h-1 rounded-full ${hasDone ? 'bg-success' : 'bg-gray-200'}`}
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
            <span className="text-[10px] text-gray-400">Planned</span>
            <span className="text-xs font-semibold text-gray-800">{dayTasks.length}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-[10px] text-gray-400">Done</span>
            <span className="text-xs font-semibold text-success">{done}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-[10px] text-gray-400">Remaining</span>
            <span className={`text-xs font-semibold ${remaining > 0 ? 'text-red-400' : 'text-gray-400'}`}>
              {remaining}
            </span>
          </div>
        </div>
      </div>

      {/* Task list */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        {visibleTasks.length === 0 ? (
          <div className="py-8 text-center text-gray-400">
            <p className="text-3xl mb-2">📝</p>
            <p className="text-sm">No tasks yet. Tap + to add one!</p>
          </div>
        ) : (
          <ul>
            {visibleTasks.map((task, i) => {
              const badge = dueBadge(task.dueDate, task.done)
              return (
                <li
                  key={task.id}
                  className={`flex items-center gap-3 px-4 py-3 group transition-colors hover:bg-gray-50 ${
                    i < visibleTasks.length - 1 ? 'border-b border-gray-50' : ''
                  }`}
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

      {/* Mood selector */}
      {!isFuture && (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm px-4 py-3">
          <h2 className="text-[10px] text-gray-400 mb-2">
            {isToday ? 'How are you feeling?' : 'Mood that day'}
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
                    {MOOD_LABELS[i]}
                  </span>
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* FAB */}
      <button
        onClick={() => setShowAddForm(true)}
        className="fixed bottom-20 right-4 z-50 w-12 h-12 bg-primary rounded-full shadow-lg flex items-center justify-center text-white text-2xl hover:bg-primary/90 transition-all active:scale-95"
      >
        +
      </button>

      {/* Bottom sheet add form */}
      {showAddForm && (
        <div
          className="fixed inset-0 z-50 bg-black/30"
          onClick={() => setShowAddForm(false)}
        >
          <div
            className="absolute bottom-0 left-0 right-0 bg-white rounded-t-2xl p-4 pb-10 shadow-2xl animate-slide-up"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto mb-4" />
            <p className="font-semibold text-gray-800 text-sm mb-3">Add task</p>
            <form onSubmit={addTask} className="space-y-3">
              <input
                ref={inputRef}
                type="text"
                value={newTask}
                onChange={(e) => setNewTask(e.target.value)}
                placeholder="Task name..."
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
                  💼 Work
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
                  🏠 Personal
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
                  onClick={() => setShowAddForm(false)}
                  className="flex-1 py-3 rounded-xl border border-gray-200 text-sm text-gray-500 font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!newTask.trim()}
                  className="flex-1 py-3 rounded-xl bg-primary text-white text-sm font-semibold disabled:opacity-40 hover:bg-primary/90 transition-colors"
                >
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
