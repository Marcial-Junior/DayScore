import { BADGES } from '../../utils/achievements'

const STREAK_MILESTONES = [3, 7, 14, 30, 100, 365]

function nextMilestone(streak) {
  return STREAK_MILESTONES.find((m) => m > streak) || STREAK_MILESTONES[STREAK_MILESTONES.length - 1]
}

export default function Achievements({ tasks, routines, streak }) {
  const ctx = { tasks, routines, streak }
  const unlockedCount = BADGES.filter((b) => b.check(ctx)).length
  const next = nextMilestone(streak)
  const milestoneProgress = Math.min((streak / next) * 100, 100)

  const streakLabel =
    streak === 0
      ? 'Start your streak today!'
      : streak === 1
      ? '1 day streak — keep going!'
      : `${streak} day streak — keep it up!`

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-lg font-bold text-gray-900">Awards</h1>
        <p className="text-xs mt-0.5" style={{ color: '#1D9E75' }}>
          {unlockedCount}/{BADGES.length} unlocked
        </p>
      </div>

      {/* Streak card */}
      <div
        className="rounded-xl p-4 text-white flex items-center gap-4"
        style={{ background: 'linear-gradient(135deg, #1a1a2e, #534AB7)' }}
      >
        <span className="text-4xl flex-shrink-0">🔥</span>
        <div className="flex-1 min-w-0">
          <p className="text-3xl font-bold leading-none">{streak}</p>
          <p className="text-white/80 text-xs mt-1">{streakLabel}</p>
          <p className="text-white/55 text-[10px] mt-1">Next milestone: {next} days</p>
          <div className="h-1 bg-white/20 rounded-full mt-2 overflow-hidden">
            <div
              className="h-full bg-white/80 rounded-full transition-all duration-500"
              style={{ width: `${milestoneProgress}%` }}
            />
          </div>
        </div>
      </div>

      {/* Achievements grid */}
      <p className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold px-1">Achievements</p>
      <div className="grid grid-cols-2 gap-3">
        {BADGES.map((badge) => {
          const unlocked = badge.check(ctx)
          const pct = Math.round(badge.progress(ctx))
          return (
            <div
              key={badge.id}
              className={`bg-white rounded-xl border border-gray-100 p-4 flex flex-col items-center gap-2 transition-all ${
                unlocked ? 'shadow-sm' : 'opacity-40'
              }`}
            >
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center text-xl"
                style={{ backgroundColor: badge.iconBg }}
              >
                {badge.icon}
              </div>
              <p className="font-semibold text-xs text-gray-900 text-center leading-tight">{badge.title}</p>
              <p className="text-[10px] text-gray-400 text-center leading-tight">{badge.desc}</p>
              <div className="w-full h-[3px] bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{ width: `${pct}%`, backgroundColor: badge.color }}
                />
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
