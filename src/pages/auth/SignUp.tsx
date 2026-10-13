import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import AuthLayout from './AuthLayout'

function SignUp() {
  const { signUp, configured } = useAuth()
  const navigate = useNavigate()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [confirmationSent, setConfirmationSent] = useState(false)

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
    const { error } = await signUp(email, password)
    setSubmitting(false)

    if (error) {
      setError(error)
      return
    }
    setConfirmationSent(true)
  }

  if (confirmationSent) {
    return (
      <AuthLayout title="Check your email">
        <div className="auth-notice auth-notice-success">
          We've sent a confirmation link to <strong>{email}</strong>. Click it to activate your account, then come
          back and log in.
        </div>
        <Link to="/login" className="btn" style={{ width: '100%', padding: 14, display: 'block', textAlign: 'center' }}>
          Go to Login
        </Link>
      </AuthLayout>
    )
  }

  return (
    <AuthLayout
      title="Create your account"
      subtitle="Your roadmaps and habits, saved to your account and private to you."
      footer={
        <div style={{ color: 'var(--plum)' }}>
          Already have an account?{' '}
          <Link to="/login" style={{ color: 'var(--cherry)', fontWeight: 600 }}>
            Log in
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
          <label htmlFor="signup-email">Email</label>
          <input
            id="signup-email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={!configured}
          />
        </div>
        <div className="field">
          <label htmlFor="signup-password">Password</label>
          <input
            id="signup-password"
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
          <label htmlFor="signup-confirm">Confirm Password</label>
          <input
            id="signup-confirm"
            type="password"
            autoComplete="new-password"
            required
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            disabled={!configured}
          />
        </div>
        <button className="btn" type="submit" style={{ width: '100%', padding: 14 }} disabled={!configured || submitting}>
          {submitting ? 'Creating account…' : 'Create Account'}
        </button>
      </form>
    </AuthLayout>
  )
}

export default SignUp
