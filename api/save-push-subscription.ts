import type { VercelRequest, VercelResponse } from '@vercel/node'
import { createClient } from '@supabase/supabase-js'

/**
 * POST /api/save-push-subscription  { endpoint, p256dh, auth }  ->  { ok: true }
 *
 * Requires `Authorization: Bearer <supabase access token>`. Writes with the
 * service-role key because push_subscriptions deliberately has no update
 * policy (see supabase/schema.sql) — a re-subscribe is a delete of the old
 * endpoint (if any) plus an insert of the new one, same as the browser's
 * own "subscribing again replaces the old subscription" behavior.
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    return await handleSave(req, res)
  } catch (err) {
    console.error('Unhandled error in /api/save-push-subscription', err)
    if (!res.headersSent) {
      return res.status(500).json({ error: 'server_error', message: 'Something went wrong on our end — try again shortly.' })
    }
  }
}

async function handleSave(req: VercelRequest, res: VercelResponse) {
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
    return res.status(401).json({ error: 'unauthorized', message: 'Log in to enable reminders.' })
  }

  const authClient = createClient(supabaseUrl, supabaseAnonKey)
  const { data: userData, error: userError } = await authClient.auth.getUser(token)
  if (userError || !userData?.user) {
    return res.status(401).json({ error: 'unauthorized', message: 'Your session has expired — log in again.' })
  }
  const userId = userData.user.id

  const { endpoint, p256dh, auth } = req.body ?? {}
  if (typeof endpoint !== 'string' || typeof p256dh !== 'string' || typeof auth !== 'string') {
    return res.status(400).json({ error: 'invalid_request', message: 'Missing or invalid subscription fields.' })
  }

  const adminClient = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })

  const { error: deleteError } = await adminClient.from('push_subscriptions').delete().eq('endpoint', endpoint)
  if (deleteError) {
    console.error('Failed to clear old push subscription', deleteError)
    return res.status(500).json({ error: 'server_error', message: 'Could not save your subscription — try again shortly.' })
  }

  const { error: insertError } = await adminClient
    .from('push_subscriptions')
    .insert({ user_id: userId, endpoint, p256dh, auth })
  if (insertError) {
    console.error('Failed to save push subscription', insertError)
    return res.status(500).json({ error: 'server_error', message: 'Could not save your subscription — try again shortly.' })
  }

  return res.status(200).json({ ok: true })
}
