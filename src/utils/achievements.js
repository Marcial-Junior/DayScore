import { calcDayScore } from './streak'

export const BADGES = [
  {
    id: 'first_task',
    icon: '⭐',
    iconBg: '#EEEDFE',
    color: '#534AB7',
    title: 'First Step',
    desc: 'Complete your first task',
    check: ({ tasks }) => Object.values(tasks).some((day) => day.some((t) => t.done)),
    progress: ({ tasks }) =>
      Object.values(tasks).some((day) => day.some((t) => t.done)) ? 100 : 0,
  },
  {
    id: 'score_80',
    icon: '🎯',
    iconBg: '#E6F1FB',
    color: '#378ADD',
    title: 'Sharp Focus',
    desc: 'Score 80%+ in a single day',
    check: ({ tasks }) => Object.values(tasks).some((day) => calcDayScore(day) >= 80),
    progress: ({ tasks }) => {
      const best = Math.max(0, ...Object.values(tasks).map((d) => calcDayScore(d)))
      return Math.min((best / 80) * 100, 100)
    },
  },
  {
    id: 'perfect_day',
    icon: '💎',
    iconBg: '#E1F5EE',
    color: '#1D9E75',
    title: 'Perfect Day',
    desc: '100% score in a day',
    check: ({ tasks }) =>
      Object.values(tasks).some((day) => day.length > 0 && calcDayScore(day) === 100),
    progress: ({ tasks }) => {
      const best = Math.max(0, ...Object.values(tasks).map((d) => calcDayScore(d)))
      return Math.min(best, 100)
    },
  },
  {
    id: 'streak_3',
    icon: '🔥',
    iconBg: '#FAEEDA',
    color: '#EF9F27',
    title: 'On Fire',
    desc: '3 days in a row',
    check: ({ streak }) => streak >= 3,
    progress: ({ streak }) => Math.min((streak / 3) * 100, 100),
  },
  {
    id: 'streak_7',
    icon: '📅',
    iconBg: '#FCEBEB',
    color: '#E24B4A',
    title: '7 Days Strong',
    desc: '7-day streak',
    check: ({ streak }) => streak >= 7,
    progress: ({ streak }) => Math.min((streak / 7) * 100, 100),
  },
  {
    id: 'first_week',
    icon: '🌈',
    iconBg: '#FBEAF0',
    color: '#D4537E',
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
          if (diff !== 1) { ok = false; break }
        }
        if (ok) return true
      }
      return false
    },
    progress: ({ tasks }) => {
      const dates = Object.keys(tasks)
        .filter((d) => tasks[d].some((t) => t.done))
        .sort()
      return Math.min((dates.length / 7) * 100, 100)
    },
  },
  {
    id: 'streak_30',
    icon: '🏆',
    iconBg: '#FFF3CD',
    color: '#F59E0B',
    title: '30 Day Legend',
    desc: '30-day streak',
    check: ({ streak }) => streak >= 30,
    progress: ({ streak }) => Math.min((streak / 30) * 100, 100),
  },
  {
    id: 'routine_5',
    icon: '⚙️',
    iconBg: '#E8F5EE',
    color: '#1D9E75',
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
            if (diff !== 1) { ok = false; break }
          }
          if (ok) return true
        }
        return false
      }),
    progress: ({ routines }) => {
      let best = 0
      routines.forEach((r) => {
        const dates = Object.keys(r.completions || {})
          .filter((d) => r.completions[d])
          .sort()
        best = Math.max(best, dates.length)
      })
      return Math.min((best / 5) * 100, 100)
    },
  },
]
