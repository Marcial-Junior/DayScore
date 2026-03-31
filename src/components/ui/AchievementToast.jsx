import { useEffect, useState } from 'react'

export default function AchievementToast({ achievement, onDismiss }) {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (!achievement) return
    // Slight delay so CSS transition plays on mount
    const show = setTimeout(() => setVisible(true), 20)
    const hide = setTimeout(() => {
      setVisible(false)
      setTimeout(onDismiss, 350)
    }, 3800)
    return () => {
      clearTimeout(show)
      clearTimeout(hide)
    }
  }, [achievement])

  if (!achievement) return null

  return (
    <div
      className={`fixed top-4 left-1/2 z-50 flex items-center gap-3 bg-white border border-primary/20 shadow-xl rounded-2xl px-5 py-3 transition-all duration-350 ${
        visible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-3'
      }`}
      style={{ transform: `translateX(-50%) translateY(${visible ? '0' : '-12px'})` }}
    >
      <span className="text-3xl">{achievement.icon}</span>
      <div>
        <p className="text-[10px] text-primary font-bold uppercase tracking-widest">
          Achievement Unlocked!
        </p>
        <p className="text-sm font-bold text-gray-900 leading-tight">{achievement.title}</p>
        <p className="text-xs text-gray-400">{achievement.desc}</p>
      </div>
      <button
        onClick={() => {
          setVisible(false)
          setTimeout(onDismiss, 350)
        }}
        className="ml-1 text-gray-300 hover:text-gray-500 transition-colors text-lg leading-none"
      >
        ×
      </button>
    </div>
  )
}
