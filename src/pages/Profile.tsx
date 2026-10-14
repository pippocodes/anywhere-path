import { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabaseClient'
import Card from '../components/ui/Card'
import Skeleton from '../components/ui/Skeleton'
import RevealHeading from '../components/ui/RevealHeading'

function formatDate(iso: string | null) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })
}

function Profile() {
  const { user, username } = useAuth()
  const [createdAt, setCreatedAt] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!supabase || !user) return
    let cancelled = false
    supabase
      .from('profiles')
      .select('created_at')
      .eq('id', user.id)
      .single()
      .then(({ data }) => {
        if (!cancelled) {
          setCreatedAt(data?.created_at ?? null)
          setLoading(false)
        }
      })
    return () => {
      cancelled = true
    }
  }, [user])

  const initial = (username ?? user?.email ?? '?').charAt(0).toUpperCase()

  return (
    <div className="page" style={{ maxWidth: 640 }}>
      <RevealHeading as="h1" className="page-title">
        Profile
      </RevealHeading>
      <p className="page-subtitle">Your account, at a glance.</p>

      <Card>
        <div style={{ display: 'flex', alignItems: 'center', gap: 20, marginBottom: 28 }}>
          <span
            style={{
              width: 64,
              height: 64,
              borderRadius: '50%',
              padding: 3,
              background: 'var(--gradient-primary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <span
              style={{
                width: '100%',
                height: '100%',
                borderRadius: '50%',
                background: 'var(--ink-2)',
                color: 'var(--gold)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontFamily: 'var(--font-display)',
                fontStyle: 'italic',
                fontWeight: 600,
                fontSize: 28,
              }}
            >
              {initial}
            </span>
          </span>
          <div>
            <div style={{ fontSize: 22, fontFamily: 'var(--font-display)', fontStyle: 'italic', fontWeight: 600 }}>
              {username ?? 'Unnamed'}
            </div>
            <div style={{ fontSize: 13.5, color: 'var(--mute)' }}>{user?.email}</div>
          </div>
        </div>

        <dl style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 16, margin: 0 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--line)', paddingBottom: 14 }}>
            <dt style={{ fontSize: 13, color: 'var(--mute)' }}>Username</dt>
            <dd style={{ margin: 0, fontSize: 13.5, fontWeight: 600 }}>{username ?? '—'}</dd>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--line)', paddingBottom: 14 }}>
            <dt style={{ fontSize: 13, color: 'var(--mute)' }}>Email</dt>
            <dd style={{ margin: 0, fontSize: 13.5, fontWeight: 600 }}>{user?.email}</dd>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <dt style={{ fontSize: 13, color: 'var(--mute)' }}>Member since</dt>
            <dd style={{ margin: 0, fontSize: 13.5, fontWeight: 600 }}>
              {loading ? <Skeleton width={110} height={14} /> : formatDate(createdAt)}
            </dd>
          </div>
        </dl>
      </Card>
    </div>
  )
}

export default Profile
