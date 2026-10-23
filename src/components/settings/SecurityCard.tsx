import { useState, type FormEvent } from 'react'
import { useAuth } from '../../context/AuthContext'
import { useToast } from '../ui/Toast'
import Card from '../ui/Card'
import Button from '../ui/Button'
import PasswordField from '../auth/PasswordField'

/** Settings' Security card — change-password re-authenticates with the current password server-side before updating, plus a "forgot current password" reset-link fallback. */
function SecurityCard() {
  const { user, changePassword, sendPasswordReset } = useAuth()
  const { show } = useToast()

  const [currentPassword, setCurrentPassword] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [confirmTouched, setConfirmTouched] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [sendingReset, setSendingReset] = useState(false)

  const confirmError = confirmTouched && password !== confirm ? "Passwords don't match." : undefined

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)

    if (!currentPassword) {
      setError('Enter your current password.')
      return
    }
    if (password.length < 6) {
      setError('New password must be at least 6 characters.')
      return
    }
    if (password !== confirm) {
      setConfirmTouched(true)
      setError("Passwords don't match.")
      return
    }

    setSubmitting(true)
    const { error } = await changePassword(currentPassword, password)
    setSubmitting(false)

    if (error) {
      setError(error)
      return
    }
    setCurrentPassword('')
    setPassword('')
    setConfirm('')
    setConfirmTouched(false)
    show('Password updated.', 'success')
  }

  async function handleForgotCurrent() {
    if (!user?.email) return
    setSendingReset(true)
    const { error } = await sendPasswordReset(user.email)
    setSendingReset(false)
    show(error ?? `If that's a real account, we've sent a reset link to ${user.email}.`, error ? 'error' : 'success')
  }

  return (
    <Card style={{ marginBottom: 24 }}>
      <h3 style={{ fontSize: 17, marginBottom: 18 }}>Security</h3>
      {error && <div className="auth-notice auth-notice-error">{error}</div>}
      <form onSubmit={handleSubmit}>
        <PasswordField label="Current password" value={currentPassword} onChange={setCurrentPassword} autoComplete="current-password" />
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
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
          <Button type="submit" loading={submitting}>
            Update password
          </Button>
          <button type="button" className="btn-outline" style={{ fontSize: 12.5 }} onClick={handleForgotCurrent} disabled={sendingReset}>
            {sendingReset ? 'Sending…' : "Forgot your current password?"}
          </button>
        </div>
      </form>
    </Card>
  )
}

export default SecurityCard
