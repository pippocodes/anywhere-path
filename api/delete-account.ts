import type { VercelRequest, VercelResponse } from '@vercel/node'
import { createClient } from '@supabase/supabase-js'
import { validateConfirmUsername } from './_lib/deleteAccount.js'

/**
 * POST /api/delete-account  { confirmUsername: string }  ->  { ok: true }
 *
 * Requires `Authorization: Bearer <supabase access token>`. Deletes the
 * signed-in user's own `auth.users` row via the Admin API using the
 * service-role key — every other table (courses, habits, friendships,
 * shared_items, shared_item_members, profiles, …) references
 * `auth.users(id) on delete cascade`, so this one call cascades all of
 * the user's own data and removes their shared-tracker memberships with
 * no additional cleanup needed. Irreversible, so the client's
 * type-username-to-confirm modal is re-verified here rather than trusted.
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST')
    return res.status(405).json({ error: 'method_not_allowed', message: 'Use POST.' })
  }

  const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL
  const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !supabaseAnonKey || !serviceRoleKey) {
    const missing = [
      !supabaseUrl && 'SUPABASE_URL',
      !supabaseAnonKey && 'SUPABASE_ANON_KEY',
      !serviceRoleKey && 'SUPABASE_SERVICE_ROLE_KEY',
    ]
      .filter(Boolean)
      .join(', ')
    return res.status(503).json({
      error: 'not_configured',
      message: `Account deletion isn't set up on this deployment yet (missing: ${missing}). See supabase/SETUP.md.`,
    })
  }

  const authHeader = req.headers.authorization
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null
  if (!token) {
    return res.status(401).json({ error: 'unauthorized', message: 'Log in to delete your account.' })
  }

  const authClient = createClient(supabaseUrl, supabaseAnonKey)
  const { data: userData, error: userError } = await authClient.auth.getUser(token)
  if (userError || !userData?.user) {
    return res.status(401).json({ error: 'unauthorized', message: 'Your session has expired — log in again.' })
  }
  const userId = userData.user.id

  const adminClient = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })

  const { data: profile, error: profileError } = await adminClient
    .from('profiles')
    .select('username')
    .eq('id', userId)
    .single()
  if (profileError || !profile) {
    console.error('Could not load profile for account deletion', profileError)
    return res.status(500).json({ error: 'server_error', message: 'Could not verify your account — try again shortly.' })
  }

  const validation = validateConfirmUsername(req.body?.confirmUsername, profile.username)
  if (!validation.valid) {
    return res.status(400).json({ error: 'invalid_request', message: validation.error })
  }

  const { error: deleteError } = await adminClient.auth.admin.deleteUser(userId)
  if (deleteError) {
    console.error('Account deletion failed', deleteError)
    return res.status(500).json({ error: 'server_error', message: 'Could not delete your account — try again shortly.' })
  }

  return res.status(200).json({ ok: true })
}
