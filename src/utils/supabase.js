import { createClient } from '@supabase/supabase-js'

export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
)

// Load all user data from Supabase
export async function loadUserData(userId) {
  const { data, error } = await supabase
    .from('user_data')
    .select('tasks, mood, routines')
    .eq('user_id', userId)
    .single()

  if (error && error.code !== 'PGRST116') throw error // PGRST116 = no rows
  return data || { tasks: {}, mood: {}, routines: [] }
}

// Save all user data to Supabase (upsert)
export async function saveUserData(userId, patch) {
  const { error } = await supabase
    .from('user_data')
    .upsert({ user_id: userId, ...patch, updated_at: new Date().toISOString() })

  if (error) throw error
}
