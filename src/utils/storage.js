export const KEYS = {
  NAME: 'ds_name',
  TASKS: 'ds_tasks',
  MOOD: 'ds_mood',
  ROUTINES: 'ds_routines',
}

export const get = (key, fallback = null) => {
  try {
    const val = localStorage.getItem(key)
    return val !== null ? JSON.parse(val) : fallback
  } catch {
    return fallback
  }
}

export const set = (key, value) => {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch (e) {
    console.error('Storage error:', e)
  }
}
