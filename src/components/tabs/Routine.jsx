import { useState } from 'react'
import { todayStr, thisWeekDates, formatTime12h } from '../../utils/dates'

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

const WEEK_LABELS = ['M', 'T', 'W', 'T', 'F', 'S', 'S']

export default function Routine({ routines, updateRoutines }) {
  const [newHabit, setNewHabit] = useState('')
  const [newTime, setNewTime] = useState('')
  const date = todayStr()
  const weekDates = thisWeekDates()

  const addHabit = (e) => {
    e.preventDefault()
    if (!newHabit.trim()) return
    const habit = {
      id: crypto.randomUUID(),
      name: newHabit.trim(),
      time: newTime || null,
      completions: {},
    }
    updateRoutines([...routines, habit])
    setNewHabit('')
    setNewTime('')
  }

  const toggleCompletion = (routineId) => {
    updateRoutines(
      routines.map((r) => {
        if (r.id !== routineId) return r
        const completions = { ...r.completions, [date]: !r.completions?.[date] }
        return { ...r, completions }
      })
    )
  }

  const deleteRoutine = (routineId) => {
    updateRoutines(routines.filter((r) => r.id !== routineId))
  }

  const weekStats = (routine) => {
    const daysUpToToday = weekDates.filter((d) => d <= date)
    const completed = daysUpToToday.filter((d) => routine.completions?.[d]).length
    const total = daysUpToToday.length
    const pct = total ? Math.round((completed / total) * 100) : 0
    return { completed, total, pct }
  }

  // Sort: timed routines first (ascending), then untimed
  const sortedRoutines = [...routines].sort((a, b) => {
    if (!a.time && !b.time) return 0
    if (!a.time) return 1
    if (!b.time) return -1
    return a.time.localeCompare(b.time)
  })

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Routine</h1>
        <p className="text-gray-400 text-sm mt-0.5">Daily habits to build consistency</p>
      </div>

      {/* Add habit form */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 space-y-3">
        <form onSubmit={addHabit} className="space-y-3">
          <input
            type="text"
            value={newHabit}
            onChange={(e) => setNewHabit(e.target.value)}
            placeholder="Habit name (e.g. Gym, Reading...)"
            className="w-full bg-gray-50 border border-transparent rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/20 placeholder-gray-400"
          />
          <div className="flex gap-2 items-end">
            <div className="flex-1">
              <label className="text-xs text-gray-400 block mb-1">Time (optional)</label>
              <input
                type="time"
                value={newTime}
                onChange={(e) => setNewTime(e.target.value)}
                className="w-full bg-gray-50 border border-transparent rounded-lg px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>
            <button
              type="submit"
              disabled={!newHabit.trim()}
              className="bg-primary text-white rounded-lg px-5 py-2 text-sm font-medium disabled:opacity-40 hover:bg-primary/90 transition-colors flex-shrink-0"
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
          <p className="text-sm">No habits yet. Start building your routine!</p>
        </div>
      ) : (
        <div className="space-y-3">
          {sortedRoutines.map((routine) => {
            const { completed, total, pct } = weekStats(routine)
            const isDoneToday = routine.completions?.[date]
            const barColor = pct === 100 ? '#1D9E75' : pct >= 60 ? '#534AB7' : '#F59E0B'

            return (
              <div key={routine.id} className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
                {/* Row 1: checkbox + name + time badge + stats + delete */}
                <div className="flex items-center gap-3 mb-3">
                  <button
                    onClick={() => toggleCompletion(routine.id)}
                    className={`w-6 h-6 rounded-full border-2 flex-shrink-0 flex items-center justify-center transition-all ${
                      isDoneToday ? 'bg-success border-success' : 'border-gray-300 hover:border-primary'
                    }`}
                  >
                    {isDoneToday && <Checkmark />}
                  </button>
                  <span
                    className={`flex-1 font-medium text-sm ${
                      isDoneToday ? 'line-through text-gray-400' : 'text-gray-900'
                    }`}
                  >
                    {routine.name}
                  </span>
                  {routine.time && (
                    <span className="text-[11px] font-mono bg-primary/10 text-primary px-2 py-0.5 rounded-full flex-shrink-0">
                      {formatTime12h(routine.time)}
                    </span>
                  )}
                  <span className="text-xs text-gray-400 flex-shrink-0">
                    {completed}/{total}
                  </span>
                  <button
                    onClick={() => deleteRoutine(routine.id)}
                    className="text-gray-300 hover:text-red-400 transition-colors flex-shrink-0"
                  >
                    <TrashIcon />
                  </button>
                </div>

                {/* Row 2: progress bar + day dots */}
                <div className="space-y-2">
                  <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{ width: `${pct}%`, backgroundColor: barColor }}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex gap-1">
                      {weekDates.map((d, i) => {
                        const isFuture = d > date
                        const isDone = routine.completions?.[d]
                        return (
                          <div
                            key={d}
                            title={d}
                            className={`w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-medium ${
                              isFuture
                                ? 'bg-gray-50 text-gray-300 border border-gray-100'
                                : isDone
                                ? 'bg-success text-white'
                                : 'bg-gray-100 text-gray-400'
                            }`}
                          >
                            {WEEK_LABELS[i]}
                          </div>
                        )
                      })}
                    </div>
                    <span className="text-xs font-semibold" style={{ color: barColor }}>
                      {pct}%
                    </span>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
