import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import AuthLayout from './AuthLayout'

function ForgotPassword() {
  const { sendPasswordReset, configured } = useAuth()

  const [email, setEmail] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [sent, setSent] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setSubmitting(true)
    const { error } = await sendPasswordReset(email)
    setSubmitting(false)
    if (error) {
      setError(error)
      return
    }
    setSent(true)
  }

  if (sent) {
    return (
      <AuthLayout title="Check your email">
        <div className="auth-notice auth-notice-success">
          If an account exists for <strong>{email}</strong>, we've sent a link to reset your password.
        </div>
        <Link to="/login" className="btn" style={{ width: '100%', padding: 14, display: 'block', textAlign: 'center' }}>
          Back to Login
        </Link>
      </AuthLayout>
    )
  }

  return (
    <AuthLayout
      title="Reset your password"
      subtitle="Enter your email and we'll send you a link to set a new password."
      footer={
        <div style={{ color: 'var(--mute)' }}>
          <Link to="/login" style={{ color: 'var(--gold)', fontWeight: 600 }}>
            Back to Login
          </Link>
        </div>
      }
    >
      {!configured && (
        <div className="auth-notice auth-notice-error">
          Supabase isn't configured yet. Set <code>VITE_SUPABASE_URL</code> and{' '}
          <code>VITE_SUPABASE_ANON_KEY</code> — see <code>supabase/SETUP.md</code>.
        </div>
      )}
      {error && <div className="auth-notice auth-notice-error">{error}</div>}

      <form onSubmit={handleSubmit}>
        <div className="field">
          <label htmlFor="forgot-email">Email</label>
          <input
            id="forgot-email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={!configured}
          />
        </div>
        <button className="btn" type="submit" style={{ width: '100%', padding: 14 }} disabled={!configured || submitting}>
          {submitting ? 'Sending…' : 'Send Reset Link'}
        </button>
      </form>
    </AuthLayout>
  )
}

export default ForgotPassword
