import { useState, useEffect, useRef } from 'react'
import { supabase, loadUserData, saveUserData } from './utils/supabase'
import { set, KEYS } from './utils/storage'
import { calcStreak } from './utils/streak'
import { BADGES } from './utils/achievements'
import AuthScreen from './components/AuthScreen'
import Layout from './components/Layout'
import Today from './components/tabs/Today'
import Routine from './components/tabs/Routine'
import History from './components/tabs/History'
import Achievements from './components/tabs/Achievements'
import AchievementToast from './components/ui/AchievementToast'

const SEEN_KEY = 'ds_seen_achievements'

function App() {
  const [session, setSession] = useState(undefined) // undefined = loading
  const [activeTab, setActiveTab] = useState('today')
  const [tasks, setTasks] = useState({})
  const [mood, setMood] = useState({})
  const [routines, setRoutines] = useState([])
  const [toast, setToast] = useState(null)
  const saveTimer = useRef(null)

  const userName = session?.user?.user_metadata?.name || session?.user?.email?.split('@')[0] || ''
  const streak = calcStreak(tasks, routines)

  // Auth listener
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => setSession(session))
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
    })
    return () => subscription.unsubscribe()
  }, [])

  // Load data when session starts
  useEffect(() => {
    if (!session) return
    loadUserData(session.user.id).then((data) => {
      setTasks(data.tasks || {})
      setMood(data.mood || {})
      setRoutines(data.routines || [])
    })
  }, [session?.user?.id])

  // Debounced save to Supabase
  const scheduleSave = (patch) => {
    if (saveTimer.current) clearTimeout(saveTimer.current)
    saveTimer.current = setTimeout(() => {
      if (session) saveUserData(session.user.id, patch)
    }, 800)
  }

  const updateTasks = (newTasks) => {
    setTasks(newTasks)
    scheduleSave({ tasks: newTasks })
  }
  const updateMood = (newMood) => {
    setMood(newMood)
    scheduleSave({ mood: newMood })
  }
  const updateRoutines = (newRoutines) => {
    setRoutines(newRoutines)
    scheduleSave({ routines: newRoutines })
  }

  // Achievement detection
  useEffect(() => {
    if (!session) return
    const seen = JSON.parse(localStorage.getItem(SEEN_KEY) || '[]')
    const ctx = { tasks, routines, streak }
    const unlocked = BADGES.filter((b) => b.check(ctx)).map((b) => b.id)
    const newOnes = unlocked.filter((id) => !seen.includes(id))
    if (newOnes.length > 0) {
      const badge = BADGES.find((b) => b.id === newOnes[0])
      if (badge) {
        setToast(badge)
        localStorage.setItem(SEEN_KEY, JSON.stringify([...seen, ...newOnes]))
      }
    }
  }, [streak, tasks, routines, session])

  // Loading state
  if (session === undefined) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-4xl animate-pulse">⚡</div>
      </div>
    )
  }

  if (!session) return <AuthScreen />

  const renderTab = () => {
    switch (activeTab) {
      case 'today':
        return (
          <Today
            tasks={tasks}
            updateTasks={updateTasks}
            mood={mood}
            updateMood={updateMood}
            routines={routines}
            streak={streak}
            userName={userName}
          />
        )
      case 'routine':
        return <Routine routines={routines} updateRoutines={updateRoutines} />
      case 'history':
        return <History tasks={tasks} routines={routines} />
      case 'achievements':
        return (
          <Achievements
            tasks={tasks}
            routines={routines}
            streak={streak}
            onSignOut={() => supabase.auth.signOut()}
          />
        )
      default:
        return null
    }
  }

  return (
    <>
      <AchievementToast achievement={toast} onDismiss={() => setToast(null)} />
      <Layout activeTab={activeTab} setActiveTab={setActiveTab}>
        {renderTab()}
      </Layout>
    </>
  )
}

export default App
