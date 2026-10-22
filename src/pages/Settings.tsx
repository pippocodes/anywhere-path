import { useState, type FormEvent } from 'react'
import { useAuth } from '../context/AuthContext'
import { useTheme, THEME_KEYS, THEME_CATALOGUE, type ColorMode } from '../context/ThemeContext'
import { useToast } from '../components/ui/Toast'
import Card from '../components/ui/Card'
import Button from '../components/ui/Button'
import Pills from '../components/ui/Pills'
import PasswordField from '../components/auth/PasswordField'
import RevealHeading from '../components/ui/RevealHeading'
import ThemeCard from '../components/settings/ThemeCard'

const MODE_OPTIONS: { value: ColorMode; label: string }[] = [
  { value: 'system', label: 'System' },
  { value: 'light', label: 'Light' },
  { value: 'dark', label: 'Dark' },
]

function Settings() {
  const { username, user, updatePassword } = useAuth()
  const { theme, colorMode, resolvedMode, setTheme, setColorMode } = useTheme()
  const { show } = useToast()

  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [confirmTouched, setConfirmTouched] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const confirmError = confirmTouched && password !== confirm ? "Passwords don't match." : undefined

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)

    if (password.length < 6) {
      setError('Password must be at least 6 characters.')
      return
    }
    if (password !== confirm) {
      setConfirmTouched(true)
      setError("Passwords don't match.")
      return
    }

    setSubmitting(true)
    const { error } = await updatePassword(password)
    setSubmitting(false)

    if (error) {
      setError(error)
      return
    }
    setPassword('')
    setConfirm('')
    setConfirmTouched(false)
    show('Password updated.', 'success')
  }

  return (
    <div className="page" style={{ maxWidth: 680 }}>
      <RevealHeading as="h1" className="page-title">
        Settings
      </RevealHeading>
      <p className="page-subtitle">Manage your account and how Anywhere Path looks.</p>

      <div style={{ marginBottom: 32 }}>
        <h3 style={{ fontSize: 17, marginBottom: 6 }}>Appearance</h3>
        <p style={{ fontSize: 13, color: 'var(--mute)', marginBottom: 18 }}>
          Pick a theme and whether it should follow your system, or stay light or dark.
        </p>

        <div style={{ marginBottom: 20 }}>
          <div className="micro-label" style={{ marginBottom: 10 }}>
            Mode
          </div>
          <Pills
            options={MODE_OPTIONS}
            value={colorMode}
            onChange={(v) => setColorMode(v as ColorMode)}
            layoutId="settings-mode-pills"
          />
        </div>

        <div className="micro-label" style={{ marginBottom: 10 }}>
          Theme
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 14 }}>
          {THEME_KEYS.map((key) => (
            <ThemeCard
              key={key}
              themeKey={key}
              name={THEME_CATALOGUE[key].name}
              swatches={THEME_CATALOGUE[key].swatches}
              previewMode={resolvedMode}
              selected={theme === key}
              onSelect={() => setTheme(key)}
            />
          ))}
        </div>
      </div>

      <Card style={{ marginBottom: 24 }}>
        <h3 style={{ fontSize: 17, marginBottom: 14 }}>Account</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, fontSize: 13.5 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
            <span style={{ color: 'var(--mute)' }}>Username</span>
            <span style={{ fontWeight: 600 }}>{username ?? '—'}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
            <span style={{ color: 'var(--mute)' }}>Email</span>
            <span style={{ fontWeight: 600, overflowWrap: 'anywhere' }}>{user?.email ?? '—'}</span>
          </div>
        </div>
      </Card>

      <Card>
        <h3 style={{ fontSize: 17, marginBottom: 18 }}>Change password</h3>
        {error && <div className="auth-notice auth-notice-error">{error}</div>}
        <form onSubmit={handleSubmit}>
          <PasswordField label="New password" value={password} onChange={setPassword} autoComplete="new-password" showStrength />
          <PasswordField
            label="Confirm new password"
            value={confirm}
            onChange={(v) => {
              setConfirm(v)
              setConfirmTouched(true)
            }}
            autoComplete="new-password"
            error={confirmError}
          />
          <Button type="submit" loading={submitting}>
            Update password
          </Button>
        </form>
      </Card>
    </div>
  )
}

export default Settings
