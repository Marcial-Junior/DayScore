import { last7Days, dayLabel, thisWeekDates, todayStr } from '../../utils/dates'
import { calcDayScore } from '../../utils/streak'

export default function History({ tasks, routines }) {
  const days = last7Days()
  const today = todayStr()
  const weekDates = thisWeekDates()

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">History</h1>
        <p className="text-gray-400 text-sm mt-0.5">Last 7 days at a glance</p>
      </div>

      {/* Bar chart */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
        <h2 className="font-semibold text-gray-900 text-sm mb-4">Daily Score</h2>
        <div className="flex items-end gap-1.5" style={{ height: '120px' }}>
          {days.map((date) => {
            const score = calcDayScore(tasks[date] || [])
            const isToday = date === today
            const barH = score > 0 ? Math.max(Math.round((score / 100) * 110), 6) : 4

            return (
              <div key={date} className="flex-1 flex flex-col items-center justify-end h-full">
                {score > 0 && (
                  <span className="text-[9px] text-gray-500 mb-0.5 font-medium">{score}%</span>
                )}
                <div
                  className="w-full rounded-t-md transition-all duration-500"
                  style={{
                    height: `${barH}px`,
                    backgroundColor: isToday ? '#534AB7' : score > 0 ? '#A5A0D9' : '#E5E7EB',
                  }}
                />
              </div>
            )
          })}
        </div>

        {/* Day labels */}
        <div className="flex gap-1.5 mt-2">
          {days.map((date) => {
            const isToday = date === today
            return (
              <div key={date} className="flex-1 text-center">
                <span
                  className={`text-[10px] ${
                    isToday ? 'font-bold text-primary' : 'text-gray-400'
                  }`}
                >
                  {dayLabel(date)}
                </span>
              </div>
            )
          })}
        </div>
      </div>

      {/* Routine weekly progress */}
      {routines.length > 0 ? (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
          <h2 className="font-semibold text-gray-900 text-sm mb-4">Routine This Week</h2>
          <div className="space-y-4">
            {routines.map((routine) => {
              const daysUpToToday = weekDates.filter((d) => d <= today)
              const completed = daysUpToToday.filter((d) => routine.completions?.[d]).length
              const pct = daysUpToToday.length
                ? Math.round((completed / daysUpToToday.length) * 100)
                : 0

              const barColor = pct === 100 ? '#1D9E75' : pct >= 60 ? '#534AB7' : '#F59E0B'
              const textColor =
                pct === 100 ? 'text-success' : pct >= 60 ? 'text-primary' : 'text-amber-500'

              return (
                <div key={routine.id}>
                  <div className="flex justify-between items-center mb-1.5">
                    <span className="text-sm font-medium text-gray-700">{routine.name}</span>
                    <span className={`text-xs font-semibold ${textColor}`}>
                      {completed}/{daysUpToToday.length} days
                    </span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{ width: `${pct}%`, backgroundColor: barColor }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-100 p-8 text-center text-gray-400">
          <p className="text-3xl mb-2">📊</p>
          <p className="text-sm">Add habits in Routine to see weekly progress here.</p>
        </div>
      )}
    </div>
  )
}
