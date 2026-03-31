import { useState, useEffect } from 'react'
import { get, set, KEYS } from './utils/storage'
import { calcStreak } from './utils/streak'
import { BADGES } from './utils/achievements'
import NameModal from './components/NameModal'
import Layout from './components/Layout'
import Today from './components/tabs/Today'
import Routine from './components/tabs/Routine'
import History from './components/tabs/History'
import Achievements from './components/tabs/Achievements'
import AchievementToast from './components/ui/AchievementToast'

const SEEN_KEY = 'ds_seen_achievements'

function App() {
  const [activeTab, setActiveTab] = useState('today')
  const [userName, setUserName] = useState(() => get(KEYS.NAME, ''))
  const [tasks, setTasks] = useState(() => get(KEYS.TASKS, {}))
  const [mood, setMood] = useState(() => get(KEYS.MOOD, {}))
  const [routines, setRoutines] = useState(() => get(KEYS.ROUTINES, []))
  const [toast, setToast] = useState(null)

  const streak = calcStreak(tasks, routines)

  // Detect newly unlocked achievements and show toast
  useEffect(() => {
    const seen = get(SEEN_KEY, [])
    const ctx = { tasks, routines, streak }
    const unlocked = BADGES.filter((b) => b.check(ctx)).map((b) => b.id)
    const newOnes = unlocked.filter((id) => !seen.includes(id))

    if (newOnes.length > 0) {
      const badge = BADGES.find((b) => b.id === newOnes[0])
      if (badge) {
        setToast(badge)
        set(SEEN_KEY, [...seen, ...newOnes])
      }
    }
  }, [streak, tasks, routines])

  const handleNameSave = (name) => {
    set(KEYS.NAME, name)
    setUserName(name)
  }

  const updateTasks = (newTasks) => {
    set(KEYS.TASKS, newTasks)
    setTasks(newTasks)
  }

  const updateMood = (newMood) => {
    set(KEYS.MOOD, newMood)
    setMood(newMood)
  }

  const updateRoutines = (newRoutines) => {
    set(KEYS.ROUTINES, newRoutines)
    setRoutines(newRoutines)
  }

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
        return <Achievements tasks={tasks} routines={routines} streak={streak} />
      default:
        return null
    }
  }

  return (
    <>
      {!userName && <NameModal onSave={handleNameSave} />}
      <AchievementToast achievement={toast} onDismiss={() => setToast(null)} />
      <Layout activeTab={activeTab} setActiveTab={setActiveTab}>
        {renderTab()}
      </Layout>
    </>
  )
}

export default App
