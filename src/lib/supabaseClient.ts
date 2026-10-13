import { createClient, type SupabaseClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const isSupabaseConfigured = Boolean(url && anonKey)

// `supabase` is null when the env vars aren't set, rather than throwing at
// import time — this lets the app boot and show a friendly setup notice on
// the auth screens instead of a blank white page (see supabase/SETUP.md).
export const supabase: SupabaseClient | null = isSupabaseConfigured ? createClient(url, anonKey) : null

if (!isSupabaseConfigured) {
  console.warn(
    'Supabase is not configured — VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY are missing. ' +
      'Accounts and cloud sync are disabled until these are set. See supabase/SETUP.md.'
  )
}
