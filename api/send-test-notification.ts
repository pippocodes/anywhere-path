import type { VercelRequest, VercelResponse } from '@vercel/node'
import { createClient } from '@supabase/supabase-js'
import { sendPush, isSubscriptionGone, type PushSubscriptionRow } from './_lib/webPush.js'

/**
 * POST /api/send-test-notification  ->  { sent: number, failed: number }
 *
 * Requires `Authorization: Bearer <supabase access token>`. Sends one test
 * push to every subscription the caller has (phone + laptop both get it).
 * Low-risk and always targets only the caller's own subscriptions, so no
 * extra rate limiting beyond the client disabling the button while it runs.
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    return await handleSendTest(req, res)
  } catch (err) {
    console.error('Unhandled error in /api/send-test-notification', err)
    if (!res.headersSent) {
      return res.status(500).json({ error: 'server_error', message: 'Something went wrong on our end — try again shortly.' })
    }
  }
}

async function handleSendTest(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST')
    return res.status(405).json({ error: 'method_not_allowed', message: 'Use POST.' })
  }

  const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL
  const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  const vapidPublicKey = process.env.VAPID_PUBLIC_KEY
  const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY
  const vapidSubject = process.env.VAPID_SUBJECT

  if (!supabaseUrl || !supabaseAnonKey || !serviceRoleKey || !vapidPublicKey || !vapidPrivateKey || !vapidSubject) {
    const missing = [
      !supabaseUrl && 'SUPABASE_URL',
      !supabaseAnonKey && 'SUPABASE_ANON_KEY',
      !serviceRoleKey && 'SUPABASE_SERVICE_ROLE_KEY',
      !vapidPublicKey && 'VAPID_PUBLIC_KEY',
      !vapidPrivateKey && 'VAPID_PRIVATE_KEY',
      !vapidSubject && 'VAPID_SUBJECT',
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

  const adminClient = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })

  const { data: subRows, error: subError } = await adminClient
    .from('push_subscriptions')
    .select('endpoint, p256dh, auth')
    .eq('user_id', userId)
  if (subError) {
    console.error('Failed to load push subscriptions', subError)
    return res.status(500).json({ error: 'server_error', message: 'Could not load your subscriptions — try again shortly.' })
  }
  const subscriptions = (subRows ?? []) as PushSubscriptionRow[]
  if (subscriptions.length === 0) {
    return res.status(400).json({
      error: 'no_subscription',
      message: 'Turn on push reminders on this device first, then try the test again.',
    })
  }

  const vapid = { publicKey: vapidPublicKey, privateKey: vapidPrivateKey, subject: vapidSubject }
  const payload = { title: 'Anywhere Path', body: "This is what a reminder looks like. You're all set." }

  let sent = 0
  let failed = 0
  for (const sub of subscriptions) {
    try {
      await sendPush(sub, payload, vapid)
      sent++
    } catch (err) {
      failed++
      if (isSubscriptionGone(err)) {
        await adminClient.from('push_subscriptions').delete().eq('endpoint', sub.endpoint)
      } else {
        console.error('Test push failed', err)
      }
    }
  }

  return res.status(200).json({ sent, failed })
}
