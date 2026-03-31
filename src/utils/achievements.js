import { calcDayScore } from './streak'

export const BADGES = [
  {
    id: 'first_task',
    icon: '🌟',
    title: 'First Step',
    desc: 'Complete your first task',
    check: ({ tasks }) => Object.values(tasks).some((day) => day.some((t) => t.done)),
  },
  {
    id: 'score_80',
    icon: '🎯',
    title: 'Sharp Focus',
    desc: 'Score 80%+ in a single day',
    check: ({ tasks }) => Object.values(tasks).some((day) => calcDayScore(day) >= 80),
  },
  {
    id: 'perfect_day',
    icon: '💎',
    title: 'Perfect Day',
    desc: '100% score in a day',
    check: ({ tasks }) =>
      Object.values(tasks).some((day) => day.length > 0 && calcDayScore(day) === 100),
  },
  {
    id: 'streak_3',
    icon: '🔥',
    title: 'On Fire',
    desc: '3 days in a row',
    check: ({ streak }) => streak >= 3,
  },
  {
    id: 'streak_7',
    icon: '🗓️',
    title: '7 Days Strong',
    desc: '7-day streak',
    check: ({ streak }) => streak >= 7,
  },
  {
    id: 'first_week',
    icon: '🌈',
    title: 'First Week',
    desc: 'Tasks done 7 consecutive days',
    check: ({ tasks }) => {
      const dates = Object.keys(tasks)
        .filter((d) => tasks[d].some((t) => t.done))
        .sort()
      if (dates.length < 7) return false
      for (let i = 0; i <= dates.length - 7; i++) {
        let ok = true
        for (let j = 1; j < 7; j++) {
          const diff =
            (new Date(dates[i + j]) - new Date(dates[i + j - 1])) / (1000 * 60 * 60 * 24)
          if (diff !== 1) {
            ok = false
            break
          }
        }
        if (ok) return true
      }
      return false
    },
  },
  {
    id: 'streak_30',
    icon: '🏆',
    title: '30 Day Legend',
    desc: '30-day streak',
    check: ({ streak }) => streak >= 30,
  },
  {
    id: 'routine_5',
    icon: '⚙️',
    title: 'Habit Builder',
    desc: 'Complete a habit 5 days in a row',
    check: ({ routines }) =>
      routines.some((r) => {
        const dates = Object.keys(r.completions || {})
          .filter((d) => r.completions[d])
          .sort()
        if (dates.length < 5) return false
        for (let i = 0; i <= dates.length - 5; i++) {
          let ok = true
          for (let j = 1; j < 5; j++) {
            const diff =
              (new Date(dates[i + j]) - new Date(dates[i + j - 1])) / (1000 * 60 * 60 * 24)
            if (diff !== 1) {
              ok = false
              break
            }
          }
          if (ok) return true
        }
        return false
      }),
  },
]
