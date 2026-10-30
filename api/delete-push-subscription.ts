import type { VercelRequest, VercelResponse } from '@vercel/node'
import { createClient } from '@supabase/supabase-js'

/**
 * POST /api/delete-push-subscription  { endpoint }  ->  { ok: true }
 *
 * Requires `Authorization: Bearer <supabase access token>`. Scoped to the
 * caller's own endpoint (user_id match) even though the service-role key
 * bypasses RLS, so this can never be used to remove someone else's row.
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    return await handleDelete(req, res)
  } catch (err) {
    console.error('Unhandled error in /api/delete-push-subscription', err)
    if (!res.headersSent) {
      return res.status(500).json({ error: 'server_error', message: 'Something went wrong on our end — try again shortly.' })
    }
  }
}

async function handleDelete(req: VercelRequest, res: VercelResponse) {
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
    return res.status(503).json({ error: 'not_configured', message: `Push notifications aren't set up yet (missing: ${missing}).` })
  }

  const authHeader = req.headers.authorization
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null
  if (!token) {
    return res.status(401).json({ error: 'unauthorized', message: 'Log in first.' })
  }

  const authClient = createClient(supabaseUrl, supabaseAnonKey)
  const { data: userData, error: userError } = await authClient.auth.getUser(token)
  if (userError || !userData?.user) {
    return res.status(401).json({ error: 'unauthorized', message: 'Your session has expired — log in again.' })
  }
  const userId = userData.user.id

  const { endpoint } = req.body ?? {}
  if (typeof endpoint !== 'string') {
    return res.status(400).json({ error: 'invalid_request', message: 'Missing endpoint.' })
  }

  const adminClient = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })

  const { error } = await adminClient.from('push_subscriptions').delete().eq('endpoint', endpoint).eq('user_id', userId)
  if (error) {
    console.error('Failed to delete push subscription', error)
    return res.status(500).json({ error: 'server_error', message: 'Could not turn off push reminders — try again shortly.' })
  }

  return res.status(200).json({ ok: true })
}
