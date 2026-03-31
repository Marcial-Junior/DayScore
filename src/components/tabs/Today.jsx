import { useState } from 'react'
import { todayStr, formatDate } from '../../utils/dates'
import { calcDayScore } from '../../utils/streak'
import DateStrip from '../ui/DateStrip'
import ScoreRing from '../ui/ScoreRing'
import ConfettiBurst from '../ui/ConfettiBurst'

const MOODS = ['😔', '😐', '🙂', '😄', '🚀']
const MOOD_LABELS = ['Rough', 'Okay', 'Good', 'Great', 'Amazing']

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

export default function Today({ tasks, updateTasks, mood, updateMood, routines, streak, userName }) {
  const today = todayStr()
  const [selectedDate, setSelectedDate] = useState(today)
  const [weekOffset, setWeekOffset] = useState(0)
  const [newTask, setNewTask] = useState('')
  const [newCategory, setNewCategory] = useState(null) // 'work' | 'personal' | null
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [confettiOrigin, setConfettiOrigin] = useState(null)
  const [recentMood, setRecentMood] = useState(null) // tracks recently set mood for animation

  const isToday = selectedDate === today
  const isFuture = selectedDate > today
  const dayTasks = tasks[selectedDate] || []
  const visibleTasks =
    categoryFilter === 'all' ? dayTasks : dayTasks.filter((t) => t.category === categoryFilter)
  const score = calcDayScore(dayTasks)
  const done = dayTasks.filter((t) => t.done).length
  const todayMood = mood[selectedDate] ?? null

  const addTask = (e) => {
    e.preventDefault()
    if (!newTask.trim()) return
    const task = {
      id: crypto.randomUUID(),
      text: newTask.trim(),
      done: false,
      isRoutine: false,
      category: newCategory,
    }
    updateTasks({ ...tasks, [selectedDate]: [...dayTasks, task] })
    setNewTask('')
    setNewCategory(null)
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
    <div className="space-y-4">
      <ConfettiBurst origin={confettiOrigin} />

      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          {isToday ? (
            <>
              <h1 className="text-2xl font-bold text-gray-900">{greeting()}, {userName}!</h1>
              <p className="text-gray-400 text-sm mt-0.5">{formatDate(today)}</p>
            </>
          ) : (
            <>
              <h1 className="text-xl font-bold text-gray-900">{formatDate(selectedDate)}</h1>
              <p className="text-sm mt-0.5">
                {isFuture ? (
                  <span className="text-primary font-medium">📅 Planning ahead</span>
                ) : (
                  <span className="text-gray-400">📖 Past day</span>
                )}
              </p>
            </>
          )}
        </div>
        <div className="flex items-center gap-1.5 bg-amber-50 border border-amber-200 rounded-full px-3 py-1.5 flex-shrink-0">
          <span className="text-base">🔥</span>
          <span className="font-bold text-amber-600 text-sm">{streak}</span>
        </div>
      </div>

      {/* Date strip */}
      <DateStrip
        selectedDate={selectedDate}
        onSelectDate={setSelectedDate}
        weekOffset={weekOffset}
        onChangeWeek={setWeekOffset}
        tasks={tasks}
      />

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm text-center">
          <p className="text-2xl font-bold text-gray-800">{dayTasks.length}</p>
          <p className="text-xs text-gray-400 mt-1">Planned</p>
        </div>
        <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm text-center">
          <p className="text-2xl font-bold text-success">{done}</p>
          <p className="text-xs text-gray-400 mt-1">Done</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm flex items-center justify-center p-2">
          <ScoreRing score={score} size={68} strokeWidth={6} />
        </div>
      </div>

      {/* Task list */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-50">
          <h2 className="font-semibold text-gray-900 text-sm">Tasks</h2>
        </div>

        {/* Add task form */}
        <form onSubmit={addTask} className="p-3 border-b border-gray-50 space-y-2">
          <div className="flex gap-2">
            <input
              type="text"
              value={newTask}
              onChange={(e) => setNewTask(e.target.value)}
              placeholder="Add a task..."
              className="flex-1 bg-gray-50 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 border border-transparent focus:border-primary/20 placeholder-gray-400"
            />
            <button
              type="submit"
              disabled={!newTask.trim()}
              className="bg-primary text-white rounded-lg px-4 py-2 text-sm font-medium disabled:opacity-40 hover:bg-primary/90 transition-colors flex-shrink-0"
            >
              Add
            </button>
          </div>
          {/* Category toggle */}
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => toggleNewCategory('work')}
              className={`flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
                newCategory === 'work'
                  ? 'bg-amber-50 border-amber-400 text-amber-700'
                  : 'border-gray-200 text-gray-400 hover:border-gray-300'
              }`}
            >
              💼 Work
            </button>
            <button
              type="button"
              onClick={() => toggleNewCategory('personal')}
              className={`flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
                newCategory === 'personal'
                  ? 'bg-emerald-50 border-success text-success'
                  : 'border-gray-200 text-gray-400 hover:border-gray-300'
              }`}
            >
              🏠 Personal
            </button>
          </div>
        </form>

        {/* Category filter */}
        {dayTasks.length > 0 && (
          <div className="flex gap-2 px-3 py-2 border-b border-gray-50">
            {['all', 'work', 'personal'].map((cat) => (
              <button
                key={cat}
                onClick={() => setCategoryFilter(cat)}
                className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                  categoryFilter === cat
                    ? 'bg-primary text-white'
                    : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                }`}
              >
                {cat === 'all' ? 'All' : cat === 'work' ? '💼 Work' : '🏠 Personal'}
              </button>
            ))}
          </div>
        )}

        {/* Task items */}
        {visibleTasks.length === 0 ? (
          <div className="py-8 text-center text-gray-400">
            {dayTasks.length === 0 ? (
              <>
                <p className="text-3xl mb-2">📝</p>
                <p className="text-sm">No tasks yet. Add one above!</p>
              </>
            ) : (
              <p className="text-sm">No {categoryFilter} tasks.</p>
            )}
          </div>
        ) : (
          <ul>
            {visibleTasks.map((task, i) => (
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
                <span
                  className={`flex-1 text-sm transition-all ${
                    task.done ? 'line-through text-gray-400' : 'text-gray-700'
                  }`}
                >
                  {task.text}
                </span>
                {task.category === 'work' && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-50 text-amber-600 border border-amber-200 flex-shrink-0">
                    💼
                  </span>
                )}
                {task.category === 'personal' && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-50 text-success border border-emerald-200 flex-shrink-0">
                    🏠
                  </span>
                )}
                {task.isRoutine && (
                  <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full flex-shrink-0">
                    routine
                  </span>
                )}
                <button
                  onClick={() => deleteTask(task.id)}
                  className="opacity-0 group-hover:opacity-100 text-gray-300 hover:text-red-400 transition-all"
                >
                  <XIcon />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Mood selector — hide for future dates */}
      {!isFuture && (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
          <h2 className="font-semibold text-gray-900 text-sm mb-3">
            {isToday ? 'How are you feeling?' : 'Mood that day'}
          </h2>
          <div className="flex justify-around">
            {MOODS.map((emoji, i) => {
              const isSelected = todayMood === i
              const otherSelected = todayMood !== null && todayMood !== i
              return (
                <button
                  key={i}
                  onClick={() => setTodayMood(i)}
                  className={`flex flex-col items-center gap-1 p-2 rounded-xl transition-all duration-300 relative ${
                    isSelected
                      ? 'bg-primary/10 scale-125'
                      : otherSelected
                      ? 'opacity-50 scale-90'
                      : 'hover:bg-gray-50 scale-100'
                  }`}
                >
                  {/* Pulse ring on recent select */}
                  {recentMood === i && (
                    <span className="absolute inset-0 rounded-xl animate-ping bg-primary/20 pointer-events-none" />
                  )}
                  <span className="text-2xl">{emoji}</span>
                  <span
                    className={`text-[10px] ${
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
    </div>
  )
}
