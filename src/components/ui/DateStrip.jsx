import { todayStr, getWeekWindow } from '../../utils/dates'

const DAY_LABELS = ['M', 'T', 'W', 'T', 'F', 'S', 'S']

export default function DateStrip({ selectedDate, onSelectDate, weekOffset, onChangeWeek, tasks }) {
  const today = todayStr()
  const days = getWeekWindow(weekOffset)
  const midDate = days[3]
  const monthLabel = new Date(midDate + 'T12:00:00').toLocaleDateString('en-US', {
    month: 'short',
    year: 'numeric',
  })

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm px-3 pt-3 pb-2">
      {/* Month label + arrows */}
      <div className="flex items-center justify-between mb-2.5 px-1">
        <button
          onClick={() => onChangeWeek(weekOffset - 1)}
          className="w-6 h-6 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-400 transition-colors text-lg leading-none"
        >
          ‹
        </button>
        <span className="text-xs font-semibold text-gray-500">{monthLabel}</span>
        <button
          onClick={() => onChangeWeek(weekOffset + 1)}
          disabled={weekOffset >= 2}
          className="w-6 h-6 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-400 transition-colors disabled:opacity-30 text-lg leading-none"
        >
          ›
        </button>
      </div>

      {/* Day columns */}
      <div className="flex justify-between">
        {days.map((date, i) => {
          const isToday = date === today
          const isSelected = date === selectedDate
          const dayNum = new Date(date + 'T12:00:00').getDate()
          const dayTasks = tasks[date] || []
          const hasDone = dayTasks.some((t) => t.done)
          const hasPending = dayTasks.some((t) => !t.done)

          return (
            <button
              key={date}
              onClick={() => onSelectDate(date)}
              className="flex flex-col items-center gap-1 group"
            >
              <span className="text-[9px] text-gray-400 uppercase tracking-wider font-medium">
                {DAY_LABELS[i]}
              </span>
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-all ${
                  isSelected && isToday
                    ? 'bg-primary text-white shadow-sm'
                    : isSelected
                    ? 'bg-primary/20 text-primary font-semibold'
                    : isToday
                    ? 'ring-2 ring-primary/40 text-primary font-semibold'
                    : 'text-gray-600 group-hover:bg-gray-100'
                }`}
              >
                {dayNum}
              </div>
              {/* Dot indicator */}
              <div className="flex gap-0.5">
                {hasDone && <div className="w-1 h-1 rounded-full bg-success" />}
                {hasPending && <div className="w-1 h-1 rounded-full bg-amber-400" />}
                {!hasDone && !hasPending && <div className="w-1 h-1 rounded-full bg-transparent" />}
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}
