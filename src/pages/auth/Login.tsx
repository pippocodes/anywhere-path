import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import AuthLayout from './AuthLayout'

function Login() {
  const { signIn, configured } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const redirectTo = (location.state as { from?: string } | null)?.from ?? '/courses'

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setSubmitting(true)
    const { error } = await signIn(email, password)
    setSubmitting(false)
    if (error) {
      setError(error)
      return
    }
    navigate(redirectTo, { replace: true })
  }

  return (
    <AuthLayout
      title="Welcome back"
      subtitle="Log in to pick up your roadmaps and habits where you left off."
      footer={
        <>
          <Link to="/forgot-password" style={{ color: 'var(--cherry)', fontWeight: 600 }}>
            Forgot your password?
          </Link>
          <div style={{ marginTop: 10, color: 'var(--plum)' }}>
            New here?{' '}
            <Link to="/signup" style={{ color: 'var(--cherry)', fontWeight: 600 }}>
              Create an account
            </Link>
          </div>
        </>
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
          <label htmlFor="login-email">Email</label>
          <input
            id="login-email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={!configured}
          />
        </div>
        <div className="field">
          <label htmlFor="login-password">Password</label>
          <input
            id="login-password"
            type="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={!configured}
          />
        </div>
        <button className="btn" type="submit" style={{ width: '100%', padding: 14 }} disabled={!configured || submitting}>
          {submitting ? 'Logging in…' : 'Log In'}
        </button>
      </form>
    </AuthLayout>
  )
}

export default Login
