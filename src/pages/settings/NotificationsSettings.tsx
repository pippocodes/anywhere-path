import { useEffect, useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { supabase } from '../../lib/supabaseClient'
import { useToast } from '../../components/ui/Toast'
import Switch from '../../components/ui/Switch'
import SettingsSectionHeader from '../../components/settings/SettingsSectionHeader'

function NotificationsSettings() {
  const { user } = useAuth()
  const { show } = useToast()

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

  return (
    <div className="page" style={{ maxWidth: 680 }}>
      <SettingsSectionHeader title="Notifications" />
      <div className="card" style={{ padding: '20px 22px' }}>
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
    </div>
  )
}

export default NotificationsSettings
