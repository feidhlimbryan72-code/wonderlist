import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://placeholder-project.supabase.co'
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'placeholder-key'

export const isSupabaseConfigured = 
  Boolean(import.meta.env.VITE_SUPABASE_URL) && 
  Boolean(import.meta.env.VITE_SUPABASE_ANON_KEY) && 
  import.meta.env.VITE_SUPABASE_URL !== 'https://placeholder-project.supabase.co'

if (!isSupabaseConfigured) {
  console.warn(
    'Supabase URL and/or Anon Key are missing or using placeholder values. ' +
    'Please create a `.env` file in the project root with VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.'
  )
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
