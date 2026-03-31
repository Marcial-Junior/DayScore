export const calcStreak = (tasks, routines) => {
  const now = new Date()
  let streak = 0

  for (let i = 0; i < 365; i++) {
    const d = new Date(now)
    d.setDate(now.getDate() - i)
    const dateStr = d.toISOString().split('T')[0]

    const dayTasks = tasks[dateStr] || []
    const hasDoneTask = dayTasks.some((t) => t.done)
    const hasRoutine = routines.some((r) => r.completions?.[dateStr])
    const active = hasDoneTask || hasRoutine

    if (i === 0 && !active) continue // today hasn't started yet
    if (active) streak++
    else break
  }

  return streak
}

export const calcDayScore = (dayTasks) => {
  if (!dayTasks || dayTasks.length === 0) return 0
  const done = dayTasks.filter((t) => t.done).length
  return Math.round((done / dayTasks.length) * 100)
}
