import { createClient, type SupabaseClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const isSupabaseConfigured = Boolean(url && anonKey)

// `supabase` is null when the env vars aren't set, rather than throwing at
// import time — this lets the app boot and show a friendly setup notice on
// the auth screens instead of a blank white page (see supabase/SETUP.md).
export const supabase: SupabaseClient | null = isSupabaseConfigured
  ? createClient(url, anonKey, {
      auth: {
        // Explicit, even though these are supabase-js's defaults: a
        // dropped session or a silently-expired token reads to a user as
        // "I got logged out for no reason" / "I can't log in" — exactly
        // the symptom this was all investigated for, so this is pinned
        // rather than left implicit.
        persistSession: true,
        autoRefreshToken: true,
        // Required for both the email-confirmation and password-recovery
        // redirect links to actually log the user in: Supabase redirects
        // back with the session in the URL (hash or ?code=), and this is
        // what makes supabase-js notice it on load and fire
        // onAuthStateChange instead of just sitting on a signed-out state.
        detectSessionInUrl: true,
      },
    })
  : null

if (!isSupabaseConfigured) {
  console.warn(
    'Supabase is not configured — VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY are missing. ' +
      'Accounts and cloud sync are disabled until these are set. See supabase/SETUP.md.'
  )
}
