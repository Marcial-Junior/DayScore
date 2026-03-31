import { last7Days, dayLabel, todayStr, getWeekWindow } from '../../utils/dates'
import { calcDayScore } from '../../utils/streak'
import { t } from '../../utils/i18n'

const MOODS = ['😔', '😐', '🙂', '😄', '🚀']

export default function History({ tasks, routines, mood, streak, lang }) {
  const days = last7Days()
  const today = todayStr()
  const weekDays = getWeekWindow(0)
  const weekLabels = t('week_mon_sun', lang)

  // Summary stats
  const scores = days.map((d) => calcDayScore(tasks[d] || []))
  const activeDays = days.filter((d) => (tasks[d] || []).length > 0).length
  const avgScore = activeDays > 0
    ? Math.round(scores.filter((_, i) => (tasks[days[i]] || []).length > 0).reduce((a, b) => a + b, 0) / activeDays)
    : 0

  // Best day
  const bestScore = Math.max(0, ...scores)
  const bestDayIndex = scores.indexOf(bestScore)
  const bestDate = bestScore > 0 ? days[bestDayIndex] : null
  const bestDateLabel = bestDate
    ? new Date(bestDate + 'T12:00:00').toLocaleDateString(t('locale', lang), { weekday: 'long' })
    : null
  const bestDayTaskCount = bestDate ? (tasks[bestDate] || []).filter((task) => task.done).length : 0

  // Bar color
  const barColor = (date, score) => {
    if (date === today) return '#534AB7'
    if (score === bestScore && score > 0) return '#1D9E75'
    if (score < 50 && score > 0) return '#EF9F27'
    return '#AFA9EC'
  }

  const maxBarH = 80

  return (
    <div className="space-y-3">
      <div>
        <h1 className="text-lg font-bold text-gray-900">{t('history', lang)}</h1>
        <p className="text-gray-400 text-xs mt-0.5">{t('history_sub', lang)}</p>
      </div>

      {/* Summary stats */}
      <div className="flex gap-2">
        <div className="flex-1 bg-white rounded-xl border border-gray-100 shadow-sm p-3 text-center">
          <p className="text-base font-bold text-primary">{avgScore}%</p>
          <p className="text-[10px] text-gray-400 mt-0.5">{t('avg_score', lang)}</p>
        </div>
        <div className="flex-1 bg-white rounded-xl border border-gray-100 shadow-sm p-3 text-center">
          <p className="text-base font-bold text-success">{activeDays}</p>
          <p className="text-[10px] text-gray-400 mt-0.5">{t('active_days', lang)}</p>
        </div>
        <div className="flex-1 bg-white rounded-xl border border-gray-100 shadow-sm p-3 text-center">
          <p className="text-base font-bold text-amber-500">🔥 {streak}</p>
          <p className="text-[10px] text-gray-400 mt-0.5">{t('streak_label', lang)}</p>
        </div>
      </div>

      {/* Bar chart */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
        <h2 className="font-semibold text-gray-900 text-xs mb-3">{t('daily_score', lang)}</h2>
        <div className="flex items-end gap-1.5" style={{ height: `${maxBarH + 18}px` }}>
          {days.map((date, i) => {
            const score = scores[i]
            const isToday = date === today
            const barH = score > 0 ? Math.max(Math.round((score / 100) * maxBarH), 4) : 3
            const color = barColor(date, score)

            return (
              <div key={date} className="flex-1 flex flex-col items-center justify-end h-full gap-0.5">
                {score > 0 && (
                  <span className={`text-[8px] font-medium ${isToday ? 'text-primary font-bold' : 'text-gray-400'}`}>
                    {score}%
                  </span>
                )}
                <div
                  className="w-full rounded-t-sm transition-all duration-500"
                  style={{ height: `${barH}px`, backgroundColor: color }}
                />
                <span className={`text-[9px] ${isToday ? 'font-bold text-primary' : 'text-gray-400'}`}>
                  {dayLabel(date)}
                </span>
              </div>
            )
          })}
        </div>
      </div>

      {/* Mood this week */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
        <h2 className="font-semibold text-gray-900 text-xs mb-3">{t('mood_week', lang)}</h2>
        <div className="flex justify-between">
          {weekDays.map((date, i) => {
            const moodIdx = mood?.[date] ?? null
            return (
              <div key={date} className="flex flex-col items-center gap-1">
                <span className="text-lg">{moodIdx !== null ? MOODS[moodIdx] : '·'}</span>
                <span className="text-[9px] text-gray-300">{weekLabels[i]}</span>
              </div>
            )
          })}
        </div>
      </div>

      {/* Best day card */}
      {bestDate && (
        <div
          className="rounded-xl p-4 text-white"
          style={{ background: 'linear-gradient(135deg, #1a1a2e, #534AB7)' }}
        >
          <p className="text-[10px] text-white/60">{t('best_day_title', lang)}</p>
          <p className="text-base font-bold mt-1">{bestDateLabel} — {bestScore}%</p>
          <p className="text-[10px] text-white/50 mt-0.5">
            {bestDayTaskCount > 0 ? t('tasks_completed', lang, bestDayTaskCount) : t('great_score', lang)}
          </p>
        </div>
      )}
    </div>
  )
}
