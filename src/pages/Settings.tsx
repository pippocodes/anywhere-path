import { useState, type FormEvent } from 'react'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../components/ui/Toast'
import Card from '../components/ui/Card'
import Button from '../components/ui/Button'
import PasswordField from '../components/auth/PasswordField'

function Settings() {
  const { updatePassword } = useAuth()
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
    <div className="page" style={{ maxWidth: 560 }}>
      <h1 className="page-title">Settings</h1>
      <p className="page-subtitle">Manage your account security.</p>

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
