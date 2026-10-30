import { useEffect, useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { useApp } from '../../hooks/useApp'
import { usePushSubscription } from '../../hooks/usePushSubscription'
import { supabase } from '../../lib/supabaseClient'
import {
  fetchNotificationSettings,
  saveNotificationSettings,
  fetchHabitReminders,
  saveHabitReminder,
} from '../../lib/notificationsApi'
import type { NotificationSettings, HabitReminder } from '../../types/notifications'
import { useToast } from '../../components/ui/Toast'
import Switch from '../../components/ui/Switch'
import Button from '../../components/ui/Button'
import SettingsSectionHeader from '../../components/settings/SettingsSectionHeader'

const DEFAULT_SETTINGS: NotificationSettings = {
  enabled: true,
  timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC',
  quietHoursStart: null,
  quietHoursEnd: null,
}

function NotificationsSettings() {
  const { user } = useAuth()
  const { show } = useToast()

  // --- Existing daily catch-up popup toggle (unrelated to push) ---
  const [loading, setLoading] = useState(true)
  const [enabled, setEnabled] = useState(true)
  const [toggling, setToggling] = useState(false)

  useEffect(() => {
    if (!supabase || !user) return
    let cancelled = false
    supabase
      .from('profiles')
      .select('catchup_reminder_enabled')
      .eq('id', user.id)
      .single()
      .then(({ data }) => {
        if (cancelled || !data) return
        setEnabled((data as { catchup_reminder_enabled: boolean }).catchup_reminder_enabled)
        setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [user])

  async function handleToggle(next: boolean) {
    if (!supabase || !user) return
    setEnabled(next) // optimistic
    setToggling(true)
    const { error } = await supabase.from('profiles').update({ catchup_reminder_enabled: next }).eq('id', user.id)
    setToggling(false)
    if (error) {
      setEnabled(!next) // revert
      show('Could not update notification settings — try again.', 'error')
    }
  }

  // --- Push reminders ---
  const push = usePushSubscription()
  const [settings, setSettings] = useState<NotificationSettings>(DEFAULT_SETTINGS)
  const [settingsLoaded, setSettingsLoaded] = useState(false)
  const [savingSettings, setSavingSettings] = useState(false)
  const [sendingTest, setSendingTest] = useState(false)

  useEffect(() => {
    if (!user || !push.subscribed) return
    let cancelled = false
    fetchNotificationSettings(user.id).then((s) => {
      if (!cancelled) {
        setSettings(s)
        setSettingsLoaded(true)
      }
    })
    return () => {
      cancelled = true
    }
  }, [user, push.subscribed])

  async function updateSettings(patch: Partial<NotificationSettings>) {
    if (!user) return
    const next = { ...settings, ...patch }
    setSettings(next) // optimistic
    setSavingSettings(true)
    try {
      await saveNotificationSettings(user.id, next)
    } catch {
      setSettings(settings) // revert
      show('Could not save that setting — try again.', 'error')
    } finally {
      setSavingSettings(false)
    }
  }

  async function handleSendTest() {
    setSendingTest(true)
    try {
      const { sent, failed } = await push.sendTest()
      if (sent > 0) show('Test notification sent — check your device.', 'success')
      else show(failed > 0 ? 'Could not deliver the test notification — try again.' : 'No devices to send to yet.', 'error')
    } catch (err) {
      show(err instanceof Error ? err.message : 'Could not send a test notification.', 'error')
    } finally {
      setSendingTest(false)
    }
  }

  // --- Per-habit reminder times ---
  const { data } = useApp()
  const activeHabits = data.habits.filter((h) => !h.archived).sort((a, b) => a.order - b.order)
  const [reminders, setReminders] = useState<Map<string, HabitReminder>>(new Map())

  useEffect(() => {
    if (!user || !push.subscribed) return
    let cancelled = false
    fetchHabitReminders(user.id).then((map) => {
      if (!cancelled) setReminders(map)
    })
    return () => {
      cancelled = true
    }
  }, [user, push.subscribed])

  async function updateHabitReminder(habitId: string, patch: Partial<HabitReminder>) {
    if (!user) return
    const current = reminders.get(habitId) ?? { habitId, remindAt: '09:00', enabled: false }
    const next = { ...current, ...patch }
    const nextMap = new Map(reminders)
    nextMap.set(habitId, next) // optimistic
    setReminders(nextMap)
    try {
      await saveHabitReminder(user.id, habitId, next.remindAt, next.enabled)
    } catch {
      setReminders(reminders) // revert
      show('Could not save that reminder — try again.', 'error')
    }
  }

  return (
    <div className="page" style={{ maxWidth: 680 }}>
      <SettingsSectionHeader title="Notifications" />

      <div className="card" style={{ padding: '20px 22px', marginBottom: 16 }}>
        {loading ? (
          <p style={{ fontSize: 13, color: 'var(--mute)', margin: 0 }}>Loading…</p>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
            <div>
              <div style={{ fontSize: 13.5, fontWeight: 600, marginBottom: 2 }}>Daily catch-up reminder</div>
              <div style={{ fontSize: 11.5, color: 'var(--mute)' }}>
                Shows a summary of anything still pending today — habits, roadmap steps, course lessons — the
                first time you open the app each day.
              </div>
            </div>
            <Switch checked={enabled} onChange={handleToggle} disabled={toggling} label="Daily catch-up reminder" />
          </div>
        )}
      </div>

      <div className="card" style={{ padding: '20px 22px', marginBottom: 16 }}>
        <div style={{ fontSize: 13.5, fontWeight: 600, marginBottom: 2 }}>Push reminders</div>
        <div style={{ fontSize: 11.5, color: 'var(--mute)', marginBottom: 14 }}>
          A gentle nudge at the time you choose for each habit — even when the app isn't open. On iPhone, add
          Anywhere Path to your Home Screen first (Settings → Install app); push only works from the installed
          app, not a regular Safari tab.
        </div>

        {!push.supported ? (
          <p style={{ fontSize: 12.5, color: 'var(--mute)', margin: 0 }}>
            Push notifications aren't available in this browser.
          </p>
        ) : !push.subscribed ? (
          <div>
            {push.permission === 'denied' && (
              <p style={{ fontSize: 12.5, color: 'var(--danger)', marginTop: 0, marginBottom: 10 }}>
                Notifications are blocked for this site — allow them in your browser's site settings, then try
                again.
              </p>
            )}
            {push.error && <p style={{ fontSize: 12.5, color: 'var(--danger)', marginTop: 0, marginBottom: 10 }}>{push.error}</p>}
            <Button size="sm" onClick={push.subscribe} loading={push.loading}>
              Turn on push reminders
            </Button>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
              <div style={{ fontSize: 13, fontWeight: 600 }}>Reminders on</div>
              <Switch
                checked={settings.enabled}
                onChange={(next) => updateSettings({ enabled: next })}
                disabled={!settingsLoaded || savingSettings}
                label="Push reminders on"
              />
            </div>

            <div>
              <div style={{ fontSize: 12.5, fontWeight: 600, marginBottom: 6 }}>Quiet hours (optional)</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 12.5, color: 'var(--mute)' }}>
                <input
                  type="time"
                  value={settings.quietHoursStart ?? ''}
                  disabled={!settingsLoaded}
                  onChange={(e) => updateSettings({ quietHoursStart: e.target.value || null })}
                  style={{ width: 110 }}
                />
                <span>to</span>
                <input
                  type="time"
                  value={settings.quietHoursEnd ?? ''}
                  disabled={!settingsLoaded}
                  onChange={(e) => updateSettings({ quietHoursEnd: e.target.value || null })}
                  style={{ width: 110 }}
                />
                {(settings.quietHoursStart || settings.quietHoursEnd) && (
                  <Button
                    variant="ghost"
                    onClick={() => updateSettings({ quietHoursStart: null, quietHoursEnd: null })}
                    style={{ fontSize: 12 }}
                  >
                    Clear
                  </Button>
                )}
              </div>
            </div>

            <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
              <Button size="sm" variant="secondary" onClick={handleSendTest} loading={sendingTest}>
                Send me a test notification
              </Button>
              <Button variant="ghost" onClick={push.unsubscribe} style={{ fontSize: 12 }}>
                Turn off on this device
              </Button>
            </div>
          </div>
        )}
      </div>

      {push.subscribed && activeHabits.length > 0 && (
        <div className="card" style={{ padding: '20px 22px' }}>
          <div style={{ fontSize: 13.5, fontWeight: 600, marginBottom: 2 }}>Habit reminders</div>
          <div style={{ fontSize: 11.5, color: 'var(--mute)', marginBottom: 14 }}>
            Pick a time for any habit you want a nudge for. Nothing before its course or plan actually starts, and
            at most one reminder a day per habit.
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {activeHabits.map((habit) => {
              const reminder = reminders.get(habit.id)
              const habitEnabled = reminder?.enabled ?? false
              const remindAt = reminder?.remindAt ?? '09:00'
              return (
                <div
                  key={habit.id}
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}
                >
                  <div style={{ fontSize: 13, flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {habit.name}
                  </div>
                  <input
                    type="time"
                    value={remindAt}
                    disabled={!habitEnabled}
                    onChange={(e) => updateHabitReminder(habit.id, { remindAt: e.target.value })}
                    style={{ width: 110, opacity: habitEnabled ? 1 : 0.5 }}
                  />
                  <Switch
                    checked={habitEnabled}
                    onChange={(next) => updateHabitReminder(habit.id, { enabled: next })}
                    label={`Reminder for ${habit.name}`}
                  />
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

export default NotificationsSettings
