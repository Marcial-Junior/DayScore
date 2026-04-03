import { useState, useEffect, useRef } from 'react'
import { supabase, loadUserData, saveUserData } from './utils/supabase'
import { set, KEYS } from './utils/storage'
import { todayStr } from './utils/dates'
import { calcStreak } from './utils/streak'
import { BADGES } from './utils/achievements'
import AuthScreen from './components/AuthScreen'
import Layout from './components/Layout'
import Today from './components/tabs/Today'
import Routine from './components/tabs/Routine'
import History from './components/tabs/History'
import Achievements from './components/tabs/Achievements'
import Settings from './components/tabs/Settings'
import Todos from './components/tabs/Todos'
import AchievementToast from './components/ui/AchievementToast'

const SEEN_KEY = 'ds_seen_achievements'

const ACCENT_COLORS = [
  { value: '#534AB7', rgb: '83 74 183' },
  { value: '#1D9E75', rgb: '29 158 117' },
  { value: '#E24B4A', rgb: '226 75 74' },
  { value: '#EF9F27', rgb: '239 159 39' },
]

// Apply saved accent color before first render
const savedAccent = localStorage.getItem('ds_accent')
if (savedAccent) {
  const found = ACCENT_COLORS.find((c) => c.value === savedAccent)
  if (found) {
    document.documentElement.style.setProperty('--primary-rgb', found.rgb)
    const meta = document.querySelector('meta[name="theme-color"]')
    if (meta) meta.setAttribute('content', found.value)
  }
}

// Apply saved dark mode before first render
if (localStorage.getItem('ds_dark') === 'true') {
  document.documentElement.classList.add('dark')
}

function App() {
  const [session, setSession] = useState(undefined) // undefined = loading
  const [activeTab, setActiveTab] = useState('today')
  const [tasks, setTasks] = useState({})
  const [mood, setMood] = useState({})
  const [routines, setRoutines] = useState([])
  const [toast, setToast] = useState(null)
  const [lang, setLang] = useState(() => localStorage.getItem('ds_lang') || 'en')
  const [todos, setTodos] = useState(() => {
    try { return JSON.parse(localStorage.getItem('ds_todos') || '[]') } catch { return [] }
  })
  const saveTimer = useRef(null)

  const updateTodos = (newTodos) => {
    setTodos(newTodos)
    localStorage.setItem('ds_todos', JSON.stringify(newTodos))
  }

  const handleLangChange = (l) => {
    setLang(l)
    localStorage.setItem('ds_lang', l)
  }

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

  const moveTaskToTodos = (task, storageDate) => {
    const newTasks = {
      ...tasks,
      [storageDate]: (tasks[storageDate] || []).filter((t) => t.id !== task.id),
    }
    updateTasks(newTasks)
    updateTodos([...todos, {
      id: crypto.randomUUID(),
      title: task.text,
      category: task.category,
      dueDate: task.dueDate,
      priority: 'medium',
      done: task.done,
      createdAt: new Date().toISOString(),
    }])
  }

  const moveTodoToTask = (todo) => {
    const today = todayStr()
    updateTodos(todos.filter((td) => td.id !== todo.id))
    updateTasks({
      ...tasks,
      [today]: [...(tasks[today] || []), {
        id: crypto.randomUUID(),
        text: todo.title,
        done: todo.done,
        isRoutine: false,
        category: todo.category,
        dueDate: todo.dueDate,
        time: null,
      }],
    })
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
            lang={lang}
            todos={todos}
            updateTodos={updateTodos}
            onMoveToTodos={moveTaskToTodos}
          />
        )
      case 'todos':
        return <Todos todos={todos} updateTodos={updateTodos} onMoveToTask={moveTodoToTask} />
      case 'routine':
        return <Routine routines={routines} updateRoutines={updateRoutines} lang={lang} />
      case 'history':
        return <History tasks={tasks} routines={routines} mood={mood} streak={streak} lang={lang} />
      case 'awards':
        return (
          <Achievements
            tasks={tasks}
            routines={routines}
            streak={streak}
            lang={lang}
          />
        )
      case 'settings':
        return (
          <Settings
            session={session}
            tasks={tasks}
            mood={mood}
            routines={routines}
            lang={lang}
            onLangChange={handleLangChange}
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
