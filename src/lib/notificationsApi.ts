import { supabase } from './supabaseClient'
import type { HabitReminder, NotificationSettings } from '../types/notifications'

function requireClient() {
  if (!supabase) throw new Error('Supabase is not configured.')
  return supabase
}

type SettingsRow = {
  enabled: boolean
  timezone: string
  quiet_hours_start: string | null
  quiet_hours_end: string | null
}

function mapSettings(r: SettingsRow): NotificationSettings {
  return {
    enabled: r.enabled,
    timezone: r.timezone,
    quietHoursStart: r.quiet_hours_start?.slice(0, 5) ?? null,
    quietHoursEnd: r.quiet_hours_end?.slice(0, 5) ?? null,
  }
}

/** The user's own notification settings, or sensible defaults if no row exists yet (first visit to the page). */
export async function fetchNotificationSettings(userId: string): Promise<NotificationSettings> {
  const client = requireClient()
  const { data, error } = await client
    .from('notification_settings')
    .select('enabled, timezone, quiet_hours_start, quiet_hours_end')
    .eq('user_id', userId)
    .maybeSingle()
  if (error) throw error
  if (!data) {
    return {
      enabled: true,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC',
      quietHoursStart: null,
      quietHoursEnd: null,
    }
  }
  return mapSettings(data as SettingsRow)
}

export async function saveNotificationSettings(userId: string, settings: NotificationSettings): Promise<void> {
  const client = requireClient()
  const { error } = await client.from('notification_settings').upsert({
    user_id: userId,
    enabled: settings.enabled,
    timezone: settings.timezone,
    quiet_hours_start: settings.quietHoursStart,
    quiet_hours_end: settings.quietHoursEnd,
    updated_at: new Date().toISOString(),
  })
  if (error) throw error
}

type ReminderRow = { habit_id: string; remind_at: string; enabled: boolean }

/** Every habit reminder the user has ever set, keyed by habit id — a habit with no entry has no reminder set. */
export async function fetchHabitReminders(userId: string): Promise<Map<string, HabitReminder>> {
  const client = requireClient()
  const { data, error } = await client.from('habit_reminders').select('habit_id, remind_at, enabled').eq('user_id', userId)
  if (error) throw error
  const map = new Map<string, HabitReminder>()
  for (const r of (data ?? []) as ReminderRow[]) {
    map.set(r.habit_id, { habitId: r.habit_id, remindAt: r.remind_at.slice(0, 5), enabled: r.enabled })
  }
  return map
}

export async function saveHabitReminder(userId: string, habitId: string, remindAt: string, enabled: boolean): Promise<void> {
  const client = requireClient()
  const { error } = await client
    .from('habit_reminders')
    .upsert({ habit_id: habitId, user_id: userId, remind_at: remindAt, enabled, updated_at: new Date().toISOString() })
  if (error) throw error
}

export async function deleteHabitReminder(habitId: string): Promise<void> {
  const client = requireClient()
  const { error } = await client.from('habit_reminders').delete().eq('habit_id', habitId)
  if (error) throw error
}

async function authedFetch(path: string, accessToken: string | undefined, body?: object) {
  const res = await fetch(path, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
    },
    body: JSON.stringify(body ?? {}),
  })
  const data = await res.json().catch(() => null)
  if (!res.ok) throw new Error(data?.message || 'Something went wrong — try again.')
  return data
}

export async function savePushSubscription(
  accessToken: string | undefined,
  subscription: { endpoint: string; p256dh: string; auth: string }
): Promise<void> {
  await authedFetch('/api/save-push-subscription', accessToken, subscription)
}

export async function deletePushSubscription(accessToken: string | undefined, endpoint: string): Promise<void> {
  await authedFetch('/api/delete-push-subscription', accessToken, { endpoint })
}

export async function sendTestNotification(accessToken: string | undefined): Promise<{ sent: number; failed: number }> {
  return authedFetch('/api/send-test-notification', accessToken)
}
