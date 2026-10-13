import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { supabase } from '../../lib/supabaseClient'
import AuthLayout from './AuthLayout'

function ResetPassword() {
  const { updatePassword, configured } = useAuth()
  const navigate = useNavigate()

  const [ready, setReady] = useState(false) // true once Supabase has processed the recovery link
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [done, setDone] = useState(false)

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

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (password.length < 6) {
      setError('Password must be at least 6 characters.')
      return
    }
    if (password !== confirmPassword) {
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
    setTimeout(() => navigate('/courses', { replace: true }), 1500)
  }

  if (done) {
    return (
      <AuthLayout title="Password updated">
        <div className="auth-notice auth-notice-success">You're all set — taking you to your courses…</div>
      </AuthLayout>
    )
  }

  if (configured && !ready) {
    return (
      <AuthLayout title="Reset your password">
        <div className="auth-notice auth-notice-error">
          This link looks invalid or has expired. Request a new one from{' '}
          <Link to="/forgot-password" style={{ color: 'var(--plum)', fontWeight: 700 }}>
            the password reset page
          </Link>
          .
        </div>
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
        <div className="field">
          <label htmlFor="reset-password">New Password</label>
          <input
            id="reset-password"
            type="password"
            autoComplete="new-password"
            required
            minLength={6}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={!configured}
          />
        </div>
        <div className="field">
          <label htmlFor="reset-confirm">Confirm New Password</label>
          <input
            id="reset-confirm"
            type="password"
            autoComplete="new-password"
            required
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            disabled={!configured}
          />
        </div>
        <button className="btn" type="submit" style={{ width: '100%', padding: 14 }} disabled={!configured || submitting}>
          {submitting ? 'Updating…' : 'Update Password'}
        </button>
      </form>
    </AuthLayout>
  )
}

export default ResetPassword
