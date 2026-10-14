import { useEffect, useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { supabase } from '../../lib/supabaseClient'
import AuthLayout from './AuthLayout'
import Button from '../../components/ui/Button'
import PasswordField from '../../components/auth/PasswordField'

function ResetPassword() {
  const { updatePassword, configured } = useAuth()
  const navigate = useNavigate()

  const [ready, setReady] = useState(false) // true once Supabase has processed the recovery link
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [confirmTouched, setConfirmTouched] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [done, setDone] = useState(false)

  const confirmError = confirmTouched && password !== confirmPassword ? "Passwords don't match." : undefined

  // The reset-password email link lands here with a recovery token in the
  // URL; supabase-js exchanges it for a session and fires this event.
  useEffect(() => {
    if (!supabase) return
    const { data: subscription } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') setReady(true)
    })
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) setReady(true)
    })
    return () => subscription.subscription.unsubscribe()
  }, [])

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)

    if (password.length < 6) {
      setError('Password must be at least 6 characters.')
      return
    }
    if (password !== confirmPassword) {
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
    setDone(true)
    setTimeout(() => navigate('/roadmap', { replace: true }), 1500)
  }

  if (done) {
    return (
      <AuthLayout title="Password updated">
        <div className="auth-notice auth-notice-success">You're all set — taking you to your roadmap…</div>
      </AuthLayout>
    )
  }

  if (configured && !ready) {
    return (
      <AuthLayout title="That link didn't work">
        <div className="auth-notice auth-notice-error">
          This password reset link is invalid or has expired. Links only work once, and only for a little
          while after they're sent.
        </div>
        <Link to="/forgot-password" className="btn" style={{ width: '100%', padding: 14, display: 'block', textAlign: 'center' }}>
          Request a new link
        </Link>
      </AuthLayout>
    )
  }

  return (
    <AuthLayout title="Set a new password">
      {!configured && (
        <div className="auth-notice auth-notice-error">
          Supabase isn't configured yet. Set <code>VITE_SUPABASE_URL</code> and{' '}
          <code>VITE_SUPABASE_ANON_KEY</code> — see <code>supabase/SETUP.md</code>.
        </div>
      )}
      {error && <div className="auth-notice auth-notice-error">{error}</div>}

      <form onSubmit={handleSubmit}>
        <PasswordField
          id="reset-password"
          label="New password"
          value={password}
          onChange={setPassword}
          autoComplete="new-password"
          disabled={!configured}
          showStrength
        />
        <PasswordField
          id="reset-confirm"
          label="Confirm new password"
          value={confirmPassword}
          onChange={(v) => {
            setConfirmPassword(v)
            setConfirmTouched(true)
          }}
          autoComplete="new-password"
          disabled={!configured}
          error={confirmError}
        />
        <Button type="submit" style={{ width: '100%' }} disabled={!configured} loading={submitting}>
          Update password
        </Button>
      </form>
    </AuthLayout>
  )
}

export default ResetPassword
