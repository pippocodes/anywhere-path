import { useEffect, useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { supabase } from '../../lib/supabaseClient'
import { useToast } from '../ui/Toast'
import Card from '../ui/Card'
import Button from '../ui/Button'
import Switch from '../ui/Switch'
import Avatar from '../ui/Avatar'
import UsernameField, { USERNAME_RE } from '../auth/UsernameField'

const ABOUT_MAX_LENGTH = 160
const USERNAME_COOLDOWN_PREFIX = 'USERNAME_COOLDOWN'

interface ProfileRow {
  username: string
  about: string
  is_public: boolean
}

function parseCooldownMessage(message: string): string {
  // "USERNAME_COOLDOWN: you can next change your username on 2026-11-22"
  const idx = message.indexOf(USERNAME_COOLDOWN_PREFIX)
  return idx === -1 ? message : message.slice(idx + USERNAME_COOLDOWN_PREFIX.length + 1).trim()
}

/** Settings' Profile card: username (with live-availability + 30-day cooldown), About me, and the Public/Private switch that controls Friends discovery. */
function ProfileCard() {
  const { user, username, refreshUsername } = useAuth()
  const { show } = useToast()

  const [loading, setLoading] = useState(true)
  const [original, setOriginal] = useState<ProfileRow | null>(null)

  const [usernameDraft, setUsernameDraft] = useState('')
  const [usernameValid, setUsernameValid] = useState(false)
  const [savingUsername, setSavingUsername] = useState(false)
  const [usernameError, setUsernameError] = useState<string | null>(null)

  const [aboutDraft, setAboutDraft] = useState('')
  const [savingAbout, setSavingAbout] = useState(false)
  const [aboutError, setAboutError] = useState<string | null>(null)

  const [isPublic, setIsPublic] = useState(false)
  const [togglingPublic, setTogglingPublic] = useState(false)

  useEffect(() => {
    if (!supabase || !user) return
    let cancelled = false
    supabase
      .from('profiles')
      .select('username, about, is_public')
      .eq('id', user.id)
      .single()
      .then(({ data }) => {
        if (cancelled || !data) return
        const row = data as ProfileRow
        setOriginal(row)
        setUsernameDraft(row.username)
        setAboutDraft(row.about)
        setIsPublic(row.is_public)
        setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [user])

  async function handleSaveUsername() {
    if (!supabase || !user || !original) return
    setUsernameError(null)
    setSavingUsername(true)
    const { error } = await supabase.from('profiles').update({ username: usernameDraft }).eq('id', user.id)
    setSavingUsername(false)
    if (error) {
      setUsernameError(error.message.includes(USERNAME_COOLDOWN_PREFIX) ? parseCooldownMessage(error.message) : error.message)
      return
    }
    setOriginal({ ...original, username: usernameDraft })
    await refreshUsername()
    show('Username updated.', 'success')
  }

  async function handleSaveAbout() {
    if (!supabase || !user || !original) return
    setAboutError(null)
    setSavingAbout(true)
    const { error } = await supabase.from('profiles').update({ about: aboutDraft }).eq('id', user.id)
    setSavingAbout(false)
    if (error) {
      setAboutError(error.message)
      return
    }
    setOriginal({ ...original, about: aboutDraft })
    show('About me updated.', 'success')
  }

  async function handleTogglePublic(next: boolean) {
    if (!supabase || !user) return
    setIsPublic(next) // optimistic
    setTogglingPublic(true)
    const { error } = await supabase.from('profiles').update({ is_public: next }).eq('id', user.id)
    setTogglingPublic(false)
    if (error) {
      setIsPublic(!next) // revert
      show('Could not update visibility — try again.', 'error')
      return
    }
    setOriginal((prev) => (prev ? { ...prev, is_public: next } : prev))
  }

  const usernameChanged = original !== null && usernameDraft.trim() !== original.username
  // A pure case change ("Alex" -> "alex") can't collide with anyone — UsernameField
  // reports it as 'unchanged' (case-insensitive match) rather than running the
  // availability check, so it's allowed through here without requiring usernameValid.
  const canSaveUsername =
    usernameChanged && (usernameValid || usernameDraft.trim().toLowerCase() === original?.username.toLowerCase())
  const aboutChanged = original !== null && aboutDraft !== original.about

  return (
    <Card style={{ marginBottom: 24 }}>
      <h3 style={{ fontSize: 17, marginBottom: 6 }}>Profile</h3>
      <p style={{ fontSize: 13, color: 'var(--mute)', marginBottom: 18 }}>
        Your username, a short About me, and who can find you on Friends.
      </p>

      <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 22 }}>
        <Avatar label={username ?? user?.email ?? '?'} size={56} />
        <div style={{ fontSize: 13, color: 'var(--mute)' }}>
          Avatars are generated from your username's first letter — there's no upload yet.
        </div>
      </div>

      {loading ? (
        <p style={{ fontSize: 13, color: 'var(--mute)' }}>Loading…</p>
      ) : (
        <>
          <div style={{ marginBottom: 20 }}>
            {usernameError && <div className="auth-notice auth-notice-error" style={{ marginBottom: 10 }}>{usernameError}</div>}
            <UsernameField
              value={usernameDraft}
              onChange={(v) => setUsernameDraft(v)}
              onValidityChange={setUsernameValid}
              currentValue={original?.username}
            />
            <Button size="sm" variant="secondary" onClick={handleSaveUsername} disabled={!canSaveUsername} loading={savingUsername}>
              Save username
            </Button>
            <p style={{ fontSize: 11.5, color: 'var(--mute)', marginTop: 8 }}>
              You can change your username once every 30 days.
            </p>
          </div>

          <div style={{ marginBottom: 22 }}>
            <label htmlFor="about-me" style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 8 }}>
              About me
            </label>
            {aboutError && <div className="auth-notice auth-notice-error" style={{ marginBottom: 10 }}>{aboutError}</div>}
            <textarea
              id="about-me"
              value={aboutDraft}
              onChange={(e) => setAboutDraft(e.target.value.slice(0, ABOUT_MAX_LENGTH))}
              placeholder="A line or two about what you're working on (optional)."
              maxLength={ABOUT_MAX_LENGTH}
              rows={3}
              style={{
                width: '100%',
                padding: '10px 14px',
                borderRadius: 10,
                border: '1px solid var(--line)',
                fontSize: 13.5,
                fontFamily: 'var(--font-body)',
                resize: 'vertical',
                marginBottom: 6,
              }}
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 11.5, color: 'var(--mute)' }}>
                {aboutDraft.length}/{ABOUT_MAX_LENGTH}
              </span>
              <Button size="sm" variant="secondary" onClick={handleSaveAbout} disabled={!aboutChanged} loading={savingAbout}>
                Save about
              </Button>
            </div>
          </div>

          <div className="settings-row" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
            <div>
              <div style={{ fontSize: 13.5, fontWeight: 600, marginBottom: 2 }}>{isPublic ? 'Public' : 'Private'} profile</div>
              <div style={{ fontSize: 11.5, color: 'var(--mute)' }}>
                {isPublic
                  ? "Public profiles appear in Friends' discovery list and show up to anyone browsing usernames."
                  : "Private — only found by someone who already knows your exact username."}
              </div>
            </div>
            <Switch checked={isPublic} onChange={handleTogglePublic} disabled={togglingPublic} label="Public profile" />
          </div>
        </>
      )}
    </Card>
  )
}

export default ProfileCard
