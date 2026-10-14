import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { useToast } from '../../components/ui/Toast'
import AuthLayout from './AuthLayout'

/**
 * Supabase appends `error`/`error_description` to the redirect URL (in the
 * hash for an implicit-flow link, or the query string for PKCE) instead of
 * a session when a confirmation link is invalid or has expired — this is
 * the one case detectSessionInUrl won't resolve into a signed-in user.
 */
function parseErrorFromUrl(): { description: string } | null {
  const hash = new URLSearchParams(window.location.hash.replace(/^#/, ''))
  const search = new URLSearchParams(window.location.search)
  const error = hash.get('error') || search.get('error')
  if (!error) return null
  const rawDescription = hash.get('error_description') || search.get('error_description') || ''
  return { description: rawDescription.replace(/\+/g, ' ') }
}

/** Landing page for the email-confirmation redirect link — waits for supabase-js to pick up the session from the URL, then sends the now-confirmed, signed-in user into the app. */
function AuthCallback() {
  const { user, loading, configured } = useAuth()
  const navigate = useNavigate()
  const { show } = useToast()
  const [urlError] = useState(() => parseErrorFromUrl())
  const [announced, setAnnounced] = useState(false)
  const [timedOut, setTimedOut] = useState(false)

  useEffect(() => {
    if (urlError) return
    const t = setTimeout(() => setTimedOut(true), 6000)
    return () => clearTimeout(t)
  }, [urlError])

  useEffect(() => {
    if (urlError || loading || !user || announced) return
    setAnnounced(true)
    show("You're confirmed and signed in — welcome!", 'success')
    navigate('/roadmap', { replace: true })
  }, [urlError, loading, user, announced, navigate, show])

  if (urlError) {
    return (
      <AuthLayout title="That link didn't work">
        <div className="auth-notice auth-notice-error">
          {urlError.description || 'This confirmation link is invalid or has expired.'}
        </div>
        <Link to="/signup" className="btn" style={{ width: '100%', padding: 14, display: 'block', textAlign: 'center' }}>
          Create a new account
        </Link>
      </AuthLayout>
    )
  }

  if (!configured) {
    return (
      <AuthLayout title="Setup needed">
        <div className="auth-notice auth-notice-error">
          Supabase isn't configured yet. See <code>supabase/SETUP.md</code>.
        </div>
      </AuthLayout>
    )
  }

  if (timedOut && !user) {
    return (
      <AuthLayout title="Nothing to confirm">
        <p style={{ fontSize: 13.5, color: 'var(--mute)', textAlign: 'center', marginBottom: 20 }}>
          We couldn't find a confirmation in progress. If you followed a link from an email, it may have expired.
        </p>
        <Link to="/login" className="btn" style={{ width: '100%', padding: 14, display: 'block', textAlign: 'center' }}>
          Go to Log In
        </Link>
      </AuthLayout>
    )
  }

  return (
    <AuthLayout title="Confirming…">
      <p style={{ fontSize: 13.5, color: 'var(--mute)', textAlign: 'center' }}>One moment — confirming your account…</p>
    </AuthLayout>
  )
}

export default AuthCallback
