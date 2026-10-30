import type { VercelRequest, VercelResponse } from '@vercel/node'
import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import {
  matchDueRemindersForUser,
  buildReminderMessage,
  type NotificationSettingsRow,
  type HabitReminderRow,
  type ReminderHabit,
  type ReminderCourse,
  type ReminderPlan,
} from './_lib/reminderMatching.js'
import { sendPush, isSubscriptionGone, type PushSubscriptionRow } from './_lib/webPush.js'

/**
 * POST /api/send-reminders
 *
 * Triggered every minute by a Supabase `pg_cron` job calling this URL via
 * `pg_net` (see docs/SETUP — the one-time `cron.schedule(...)` SQL to run).
 * Not user-facing: authenticated with a shared secret header, not a
 * Supabase session, since the caller is Postgres, not a signed-in browser.
 * Sweeps every user's reminders with the service-role key (RLS exists to
 * protect the browser's own access; this is the one place that
 * deliberately reads across every user to do the matching in one pass
 * instead of once per user).
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    return await handleSendReminders(req, res)
  } catch (err) {
    console.error('Unhandled error in /api/send-reminders', err)
    if (!res.headersSent) {
      return res.status(500).json({ error: 'server_error', message: 'Something went wrong on our end.' })
    }
  }
}

function toHM(time: string | null): string | null {
  return time ? time.slice(0, 5) : null
}

async function handleSendReminders(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST')
    return res.status(405).json({ error: 'method_not_allowed', message: 'Use POST.' })
  }

  const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  const vapidPublicKey = process.env.VAPID_PUBLIC_KEY
  const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY
  const vapidSubject = process.env.VAPID_SUBJECT
  const cronSecret = process.env.CRON_SECRET

  if (!supabaseUrl || !serviceRoleKey || !vapidPublicKey || !vapidPrivateKey || !vapidSubject || !cronSecret) {
    const missing = [
      !supabaseUrl && 'SUPABASE_URL',
      !serviceRoleKey && 'SUPABASE_SERVICE_ROLE_KEY',
      !vapidPublicKey && 'VAPID_PUBLIC_KEY',
      !vapidPrivateKey && 'VAPID_PRIVATE_KEY',
      !vapidSubject && 'VAPID_SUBJECT',
      !cronSecret && 'CRON_SECRET',
    ]
      .filter(Boolean)
      .join(', ')
    return res.status(503).json({ error: 'not_configured', message: `Reminder sending isn't set up yet (missing: ${missing}).` })
  }

  const authHeader = req.headers.authorization
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null
  if (token !== cronSecret) {
    return res.status(401).json({ error: 'unauthorized', message: 'Invalid cron secret.' })
  }

  const db = createClient(supabaseUrl, serviceRoleKey, { auth: { autoRefreshToken: false, persistSession: false } })

  const [settingsRes, remindersRes, habitsRes, coursesRes, plansRes, subsRes] = await Promise.all([
    db.from('notification_settings').select('user_id, enabled, timezone, quiet_hours_start, quiet_hours_end').eq('enabled', true),
    db.from('habit_reminders').select('habit_id, user_id, remind_at, enabled, last_sent_date').eq('enabled', true),
    db.from('habits').select('id, user_id, name, course_id, plan_id, marks, archived').eq('archived', false),
    db.from('courses').select('id, start_date'),
    db.from('plans').select('id, start_date'),
    db.from('push_subscriptions').select('user_id, endpoint, p256dh, auth'),
  ])

  for (const r of [settingsRes, remindersRes, habitsRes, coursesRes, plansRes, subsRes]) {
    if (r.error) {
      console.error('Failed to load reminder data', r.error)
      return res.status(500).json({ error: 'server_error', message: 'Could not load reminder data.' })
    }
  }

  const courses: ReminderCourse[] = (coursesRes.data ?? []).map((c) => ({
    id: c.id as string,
    startDate: (c.start_date as string | null) ?? undefined,
  }))
  const plans: ReminderPlan[] = (plansRes.data ?? []).map((p) => ({ id: p.id as string, startDate: p.start_date as string }))

  const habitsByUser = new Map<string, ReminderHabit[]>()
  for (const h of habitsRes.data ?? []) {
    const userId = h.user_id as string
    const list = habitsByUser.get(userId) ?? []
    list.push({
      id: h.id as string,
      name: h.name as string,
      courseId: h.course_id as string | null,
      planId: h.plan_id as string | null,
      archived: h.archived as boolean,
      marks: (h.marks ?? {}) as Record<string, 0 | 1 | 2>,
    })
    habitsByUser.set(userId, list)
  }

  const remindersByUser = new Map<string, HabitReminderRow[]>()
  for (const r of remindersRes.data ?? []) {
    const userId = r.user_id as string
    const list = remindersByUser.get(userId) ?? []
    list.push({
      habitId: r.habit_id as string,
      userId,
      remindAt: toHM(r.remind_at as string) ?? '',
      enabled: r.enabled as boolean,
      lastSentDate: r.last_sent_date as string | null,
    })
    remindersByUser.set(userId, list)
  }

  const subsByUser = new Map<string, PushSubscriptionRow[]>()
  for (const s of subsRes.data ?? []) {
    const userId = s.user_id as string
    const list = subsByUser.get(userId) ?? []
    list.push({ endpoint: s.endpoint as string, p256dh: s.p256dh as string, auth: s.auth as string })
    subsByUser.set(userId, list)
  }

  const now = new Date()
  const vapid = { publicKey: vapidPublicKey, privateKey: vapidPrivateKey, subject: vapidSubject }
  let usersMatched = 0
  let sent = 0
  let failed = 0

  for (const row of settingsRes.data ?? []) {
    const settings: NotificationSettingsRow = {
      userId: row.user_id as string,
      enabled: row.enabled as boolean,
      timezone: row.timezone as string,
      quietHoursStart: toHM(row.quiet_hours_start as string | null),
      quietHoursEnd: toHM(row.quiet_hours_end as string | null),
    }

    const result = matchDueRemindersForUser(
      now,
      settings,
      remindersByUser.get(settings.userId) ?? [],
      habitsByUser.get(settings.userId) ?? [],
      courses,
      plans
    )
    if (result.due.length === 0) continue

    // Claim these habit reminders atomically before sending, so an
    // overlapping or retried invocation can never double-send the same
    // habit on the same local day — the update only touches rows still at
    // their old last_sent_date.
    const claimed = await claimReminders(db, result.due.map((d) => d.habitId), result.localDate)
    const due = result.due.filter((d) => claimed.has(d.habitId))
    if (due.length === 0) continue

    usersMatched++
    const subscriptions = subsByUser.get(settings.userId) ?? []
    if (subscriptions.length === 0) continue

    const payload = buildReminderMessage(due)
    for (const sub of subscriptions) {
      try {
        await sendPush(sub, payload, vapid)
        sent++
      } catch (err) {
        failed++
        if (isSubscriptionGone(err)) {
          await db.from('push_subscriptions').delete().eq('endpoint', sub.endpoint)
        } else {
          console.error('Reminder push failed', err)
        }
      }
    }
  }

  return res.status(200).json({ usersMatched, sent, failed })
}

/** Returns the subset of `habitIds` this call successfully claimed (still had an older last_sent_date). */
async function claimReminders(db: SupabaseClient, habitIds: string[], localDate: string): Promise<Set<string>> {
  const { data, error } = await db
    .from('habit_reminders')
    .update({ last_sent_date: localDate, updated_at: new Date().toISOString() })
    .in('habit_id', habitIds)
    .or(`last_sent_date.is.null,last_sent_date.neq.${localDate}`)
    .select('habit_id')
  if (error) {
    console.error('Failed to claim habit reminders', error)
    return new Set()
  }
  return new Set((data ?? []).map((r) => r.habit_id as string))
}
