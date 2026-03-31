import { useState, useEffect } from 'react'
import { supabase, saveUserData } from '../../utils/supabase'

const ACCENT_COLORS = [
  { value: '#534AB7', rgb: '83 74 183', label: 'Purple' },
  { value: '#1D9E75', rgb: '29 158 117', label: 'Green' },
  { value: '#E24B4A', rgb: '226 75 74', label: 'Red' },
  { value: '#EF9F27', rgb: '239 159 39', label: 'Amber' },
]

function getInitials(name) {
  if (!name) return '?'
  return name.split(' ').map((w) => w[0]).join('').toUpperCase().slice(0, 2)
}

export default function Settings({ session, tasks, mood, routines, onSignOut }) {
  const userName = session?.user?.user_metadata?.name || session?.user?.email?.split('@')[0] || ''
  const initials = getInitials(userName)

  const [accent, setAccent] = useState(() => localStorage.getItem('ds_accent') || '#534AB7')
  const [reminder, setReminder] = useState(() => localStorage.getItem('ds_reminder') === 'true')
  const [reminderTime, setReminderTime] = useState(() => localStorage.getItem('ds_reminder_time') || '08:00')
  const [resetting, setResetting] = useState(false)

  // Apply accent color via CSS variable on mount and change
  useEffect(() => {
    const found = ACCENT_COLORS.find((c) => c.value === accent)
    if (found) {
      document.documentElement.style.setProperty('--primary-rgb', found.rgb)
    }
    localStorage.setItem('ds_accent', accent)
  }, [accent])

  useEffect(() => {
    localStorage.setItem('ds_reminder', reminder)
  }, [reminder])

  useEffect(() => {
    localStorage.setItem('ds_reminder_time', reminderTime)
  }, [reminderTime])

  const handleExport = () => {
    const data = {
      version: 1,
      exportedAt: new Date().toISOString(),
      name: userName,
      tasks,
      mood,
      routines,
    }
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `dayscore-backup-${new Date().toISOString().split('T')[0]}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleReset = async () => {
    if (!window.confirm('Reset all data? This will permanently delete all your tasks, mood entries, and habits. This cannot be undone.')) return
    setResetting(true)
    try {
      await saveUserData(session.user.id, { tasks: {}, mood: {}, routines: [] })
    } catch (e) {
      // sign out anyway
    }
    await supabase.auth.signOut()
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-lg font-bold text-gray-900">Settings</h1>
        <p className="text-gray-400 text-xs mt-0.5">Personalize your experience</p>
      </div>

      {/* Profile card */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm px-4 py-3 flex items-center gap-3">
        <div className="w-11 h-11 rounded-full bg-primary flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
          {initials}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-gray-900 text-sm">{userName}</p>
          <p className="text-xs text-gray-400 mt-0.5">{session?.user?.email}</p>
        </div>
      </div>

      {/* Appearance */}
      <div>
        <p className="text-[10px] text-gray-400 uppercase tracking-wider font-medium mb-1.5 px-1">Appearance</p>
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          {/* Dark mode — coming soon */}
          <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-50 opacity-50">
            <div className="w-8 h-8 rounded-lg bg-gray-900 flex items-center justify-center text-sm flex-shrink-0">🌙</div>
            <span className="flex-1 text-sm text-gray-800">Dark mode</span>
            <span className="text-[10px] bg-gray-100 text-gray-400 px-2 py-0.5 rounded-full font-medium">Soon</span>
          </div>
          {/* Accent color */}
          <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-50">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-sm flex-shrink-0">🎨</div>
            <span className="flex-1 text-sm text-gray-800">Accent color</span>
            <div className="flex gap-2">
              {ACCENT_COLORS.map(({ value }) => (
                <button
                  key={value}
                  onClick={() => setAccent(value)}
                  className="w-5 h-5 rounded-full flex-shrink-0 transition-all"
                  style={{
                    backgroundColor: value,
                    outline: accent === value ? `2px solid ${value}` : 'none',
                    outlineOffset: '2px',
                  }}
                />
              ))}
            </div>
          </div>
          {/* Language */}
          <div className="flex items-center gap-3 px-4 py-3">
            <div className="w-8 h-8 rounded-lg bg-[#E6F1FB] flex items-center justify-center text-sm flex-shrink-0">🌐</div>
            <span className="flex-1 text-sm text-gray-800">Language</span>
            <span className="text-xs text-gray-400">English</span>
          </div>
        </div>
      </div>

      {/* Notifications */}
      <div>
        <p className="text-[10px] text-gray-400 uppercase tracking-wider font-medium mb-1.5 px-1">Notifications</p>
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-50">
            <div className="w-8 h-8 rounded-lg bg-[#FAEEDA] flex items-center justify-center text-sm flex-shrink-0">🔔</div>
            <span className="flex-1 text-sm text-gray-800">Daily reminder</span>
            <button
              onClick={() => setReminder((v) => !v)}
              className={`w-10 h-6 rounded-full relative transition-colors flex-shrink-0 ${reminder ? 'bg-primary' : 'bg-gray-200'}`}
            >
              <span className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${reminder ? 'translate-x-5' : 'translate-x-1'}`} />
            </button>
          </div>
          {reminder && (
            <div className="flex items-center gap-3 px-4 py-3">
              <div className="w-8 h-8 rounded-lg bg-[#EAF3DE] flex items-center justify-center text-sm flex-shrink-0">⏰</div>
              <span className="flex-1 text-sm text-gray-800">Reminder time</span>
              <input
                type="time"
                value={reminderTime}
                onChange={(e) => setReminderTime(e.target.value)}
                className="text-xs text-gray-500 bg-transparent focus:outline-none cursor-pointer"
              />
            </div>
          )}
        </div>
      </div>

      {/* Data */}
      <div>
        <p className="text-[10px] text-gray-400 uppercase tracking-wider font-medium mb-1.5 px-1">Data</p>
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          <button
            onClick={handleExport}
            className="flex items-center gap-3 px-4 py-3 w-full border-b border-gray-50 hover:bg-gray-50 transition-colors"
          >
            <div className="w-8 h-8 rounded-lg bg-[#EAF3DE] flex items-center justify-center text-sm flex-shrink-0">💾</div>
            <span className="flex-1 text-sm text-gray-800 text-left">Export data</span>
            <span className="text-gray-300 text-lg">›</span>
          </button>
          <button
            onClick={handleReset}
            disabled={resetting}
            className="flex items-center gap-3 px-4 py-3 w-full hover:bg-red-50 transition-colors disabled:opacity-50"
          >
            <div className="w-8 h-8 rounded-lg bg-[#FCEBEB] flex items-center justify-center text-sm flex-shrink-0">🗑️</div>
            <span className="flex-1 text-sm text-red-500 text-left font-medium">
              {resetting ? 'Resetting...' : 'Reset all data'}
            </span>
            <span className="text-red-400 text-lg">›</span>
          </button>
        </div>
      </div>

      {/* Sign out */}
      <button
        onClick={onSignOut}
        className="w-full py-2.5 text-sm text-gray-400 hover:text-red-400 transition-colors border border-gray-100 rounded-xl bg-white"
      >
        Sign out
      </button>
    </div>
  )
}
