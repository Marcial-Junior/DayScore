import { BADGES } from '../../utils/achievements'

export default function Achievements({ tasks, routines, streak }) {
  const ctx = { tasks, routines, streak }
  const unlockedCount = BADGES.filter((b) => b.check(ctx)).length

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Achievements</h1>
        <p className="text-gray-400 text-sm mt-0.5">
          {unlockedCount}/{BADGES.length} unlocked
        </p>
      </div>

      {/* Streak banner */}
      <div className="bg-gradient-to-r from-amber-400 to-orange-500 rounded-xl p-5 text-white">
        <div className="flex items-center gap-4">
          <span className="text-5xl">🔥</span>
          <div>
            <p className="text-3xl font-bold leading-none">{streak}</p>
            <p className="text-white/90 text-sm mt-1">
              {streak === 0
                ? 'Start your streak today!'
                : streak === 1
                ? '1 day streak — keep going!'
                : `${streak} day streak — keep it up!`}
            </p>
          </div>
        </div>
      </div>

      {/* Progress bar */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-semibold text-gray-700">Overall progress</span>
          <span className="text-sm font-semibold text-primary">
            {unlockedCount}/{BADGES.length}
          </span>
        </div>
        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-primary rounded-full transition-all duration-500"
            style={{ width: `${(unlockedCount / BADGES.length) * 100}%` }}
          />
        </div>
      </div>

      {/* Badge grid */}
      <div className="grid grid-cols-2 gap-3">
        {BADGES.map((badge) => {
          const unlocked = badge.check(ctx)
          return (
            <div
              key={badge.id}
              className={`bg-white rounded-xl border p-4 transition-all ${
                unlocked ? 'border-primary/20 shadow-sm' : 'border-gray-100 opacity-50'
              }`}
            >
              <div className="flex items-start gap-3">
                <span className={`text-3xl flex-shrink-0 ${!unlocked ? 'grayscale' : ''}`}>
                  {badge.icon}
                </span>
                <div className="min-w-0">
                  <p className={`font-semibold text-sm ${unlocked ? 'text-gray-900' : 'text-gray-400'}`}>
                    {badge.title}
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5 leading-tight">{badge.desc}</p>
                  {unlocked && (
                    <span className="inline-block text-[10px] bg-success/10 text-success font-semibold px-2 py-0.5 rounded-full mt-1.5">
                      Unlocked ✓
                    </span>
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
