import { useState } from 'react'
import { todayStr, daysBetween } from '../../utils/dates'

const PRIORITY_COLORS = { high: 'bg-red-400', medium: 'bg-amber-400', low: 'bg-gray-300' }

const CAT_STYLES = {
  work: 'bg-amber-50 text-amber-700 border border-amber-200',
  personal: 'bg-emerald-50 text-success border border-emerald-200',
}

function formatDueDate(dueDate, today) {
  if (!dueDate) return null
  const diff = daysBetween(dueDate, today)
  if (diff < 0) return `${Math.abs(diff)}d overdue`
  if (diff === 0) return 'Due today'
  if (diff === 1) return 'Tomorrow'
  const d = new Date(dueDate + 'T12:00:00')
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

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

export default function Todos({ todos, updateTodos }) {
  const today = todayStr()
  const [filter, setFilter] = useState('all')
  const [showAddForm, setShowAddForm] = useState(false)
  const [newTitle, setNewTitle] = useState('')
  const [newCategory, setNewCategory] = useState(null)
  const [newDueDate, setNewDueDate] = useState('')
  const [newPriority, setNewPriority] = useState('medium')

  const pending = todos.filter((td) => !td.done)
  const pendingCount = pending.length
  const overdueCount = pending.filter((td) => td.dueDate && daysBetween(td.dueDate, today) < 0).length

  const filterFn = (todo) => {
    if (filter === 'done') return todo.done
    if (filter === 'work') return !todo.done && todo.category === 'work'
    if (filter === 'personal') return !todo.done && todo.category === 'personal'
    return !todo.done
  }

  const filtered = todos.filter(filterFn)
  const showSections = filter !== 'done'

  const overdue = showSections
    ? filtered.filter((td) => td.dueDate && daysBetween(td.dueDate, today) < 0)
    : []
  const upcoming = showSections
    ? filtered
        .filter((td) => !td.dueDate || daysBetween(td.dueDate, today) >= 0)
        .sort((a, b) => {
          if (!a.dueDate && !b.dueDate) return 0
          if (!a.dueDate) return 1
          if (!b.dueDate) return -1
          return a.dueDate.localeCompare(b.dueDate)
        })
    : []
  const completed = filter === 'done'
    ? filtered.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''))
    : []

  const toggleTodo = (id) => {
    updateTodos(todos.map((td) => td.id === id ? { ...td, done: !td.done } : td))
  }

  const deleteTodo = (id) => {
    updateTodos(todos.filter((td) => td.id !== id))
  }

  const addTodo = (e) => {
    e.preventDefault()
    if (!newTitle.trim()) return
    updateTodos([...todos, {
      id: crypto.randomUUID(),
      title: newTitle.trim(),
      category: newCategory,
      dueDate: newDueDate || null,
      priority: newPriority,
      done: false,
      createdAt: new Date().toISOString(),
    }])
    setNewTitle('')
    setNewCategory(null)
    setNewDueDate('')
    setNewPriority('medium')
    setShowAddForm(false)
  }

  const renderRow = (todo, i, arr) => {
    const diff = todo.dueDate ? daysBetween(todo.dueDate, today) : null
    const isUrgent = diff !== null && diff >= 0 && diff <= 2
    const dueDateLabel = formatDueDate(todo.dueDate, today)
    return (
      <div
        key={todo.id}
        className={`flex items-center gap-3 px-4 py-3 group hover:bg-gray-50 transition-colors ${
          i < arr.length - 1 ? 'border-b border-gray-50' : ''
        }`}
      >
        <button
          onClick={() => toggleTodo(todo.id)}
          className={`w-5 h-5 rounded-full border-2 flex-shrink-0 flex items-center justify-center transition-all ${
            todo.done ? 'bg-success border-success' : 'border-gray-300 hover:border-primary'
          }`}
        >
          {todo.done && <Checkmark />}
        </button>
        <div className="flex-1 min-w-0">
          <span className={`text-sm block truncate ${todo.done ? 'line-through text-gray-400' : 'text-gray-800'}`}>
            {todo.title}
          </span>
          {dueDateLabel && !todo.done && (
            <span className={`text-[10px] font-medium ${
              diff !== null && diff < 0 ? 'text-red-500' : isUrgent ? 'text-amber-500' : 'text-gray-400'
            }`}>
              {dueDateLabel}
            </span>
          )}
        </div>
        {todo.category && (
          <span className={`text-[9px] px-1.5 py-0.5 rounded font-medium flex-shrink-0 ${CAT_STYLES[todo.category]}`}>
            {todo.category === 'work' ? 'Work' : 'Personal'}
          </span>
        )}
        <div className={`w-2 h-2 rounded-full flex-shrink-0 ${PRIORITY_COLORS[todo.priority] || 'bg-gray-300'}`} />
        <button
          onClick={() => deleteTodo(todo.id)}
          className="opacity-0 group-hover:opacity-100 text-gray-300 hover:text-red-400 transition-all"
        >
          <XIcon />
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <div>
        <h1 className="text-lg font-bold text-gray-900">To-Dos</h1>
        <p className="text-gray-400 text-xs mt-0.5">
          {pendingCount} pending{overdueCount > 0 ? ` · ${overdueCount} overdue` : ''}
        </p>
      </div>

      {/* Filter pills */}
      <div className="flex gap-2">
        {[['all', 'All'], ['work', 'Work'], ['personal', 'Personal'], ['done', 'Done']].map(([id, label]) => (
          <button
            key={id}
            onClick={() => setFilter(id)}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${
              filter === id ? 'bg-primary text-white' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* OVERDUE */}
      {overdue.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-4 py-1.5 bg-red-50 border-b border-red-100">
            <p className="text-[9px] text-red-500 uppercase tracking-wider font-bold">Overdue</p>
          </div>
          {overdue.map((td, i) => renderRow(td, i, overdue))}
        </div>
      )}

      {/* UPCOMING */}
      {upcoming.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-4 py-1.5 bg-gray-50 border-b border-gray-100">
            <p className="text-[9px] text-gray-400 uppercase tracking-wider font-bold">Upcoming</p>
          </div>
          {upcoming.map((td, i) => renderRow(td, i, upcoming))}
        </div>
      )}

      {/* Empty state */}
      {showSections && overdue.length === 0 && upcoming.length === 0 && (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm py-10 text-center text-gray-400">
          <p className="text-3xl mb-2">📌</p>
          <p className="text-sm">No to-dos yet. Tap + to add one!</p>
        </div>
      )}

      {/* COMPLETED */}
      {filter === 'done' && (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-4 py-1.5 bg-gray-50 border-b border-gray-100">
            <p className="text-[9px] text-gray-400 uppercase tracking-wider font-bold">Completed</p>
          </div>
          {completed.length > 0 ? (
            completed.map((td, i) => renderRow(td, i, completed))
          ) : (
            <div className="py-8 text-center text-gray-400 text-sm">No completed to-dos yet.</div>
          )}
        </div>
      )}

      {/* FAB */}
      <button
        onClick={() => setShowAddForm(true)}
        className="fixed bottom-20 right-4 z-50 w-12 h-12 bg-primary rounded-full shadow-lg flex items-center justify-center text-white text-2xl hover:bg-primary/90 transition-all active:scale-95"
      >
        +
      </button>

      {/* Add modal */}
      {showAddForm && (
        <div
          className="fixed inset-0 z-50 bg-black/40 flex items-start justify-center pt-16 px-4"
          onClick={() => setShowAddForm(false)}
        >
          <div
            className="bg-white rounded-2xl p-4 shadow-2xl w-full max-w-sm animate-drop-in"
            onClick={(e) => e.stopPropagation()}
          >
            <p className="font-semibold text-gray-800 text-sm mb-3">Add To-Do</p>
            <form onSubmit={addTodo} className="space-y-3">
              <input
                type="text"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="To-do title..."
                autoFocus
                className="w-full bg-gray-50 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 border border-transparent focus:border-primary/20 placeholder-gray-400"
              />
              <div className="flex gap-2 flex-wrap items-center">
                <button
                  type="button"
                  onClick={() => setNewCategory((c) => (c === 'work' ? null : 'work'))}
                  className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                    newCategory === 'work' ? 'bg-amber-50 border-amber-400 text-amber-700' : 'border-gray-200 text-gray-400'
                  }`}
                >
                  💼 Work
                </button>
                <button
                  type="button"
                  onClick={() => setNewCategory((c) => (c === 'personal' ? null : 'personal'))}
                  className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                    newCategory === 'personal' ? 'bg-emerald-50 border-success text-success' : 'border-gray-200 text-gray-400'
                  }`}
                >
                  🏠 Personal
                </button>
                <input
                  type="date"
                  value={newDueDate}
                  onChange={(e) => setNewDueDate(e.target.value)}
                  className="px-3 py-1.5 rounded-full text-xs font-medium border border-gray-200 text-gray-500 bg-white focus:outline-none cursor-pointer"
                />
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-400 flex-shrink-0">Priority:</span>
                <div className="flex gap-1">
                  {[['high', 'High'], ['medium', 'Medium'], ['low', 'Low']].map(([val, label]) => (
                    <button
                      key={val}
                      type="button"
                      onClick={() => setNewPriority(val)}
                      className={`px-2.5 py-1 rounded-full text-[11px] font-semibold transition-colors ${
                        newPriority === val ? 'bg-primary text-white' : 'bg-gray-100 text-gray-500'
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
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
                  disabled={!newTitle.trim()}
                  className="flex-1 py-3 rounded-xl bg-primary text-white text-sm font-semibold disabled:opacity-40"
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
