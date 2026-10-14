import { useState, type FormEvent } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { useAuth } from '../../context/AuthContext'
import AuthLayout from './AuthLayout'
import Pills from '../../components/ui/Pills'
import Button from '../../components/ui/Button'
import Input from '../../components/ui/Input'
import PasswordField from '../../components/auth/PasswordField'
import UsernameField, { USERNAME_RE } from '../../components/auth/UsernameField'

type Tab = 'login' | 'register'

const TAB_OPTIONS = [
  { value: 'login', label: 'Log In' },
  { value: 'register', label: 'Register' },
]

const FORM_VARIANTS = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -8 },
}

interface Props {
  initialTab: Tab
}

/** One elegant auth experience — animated Log In | Register pills that morph the form in place, no full page navigation between them. */
function AuthPage({ initialTab }: Props) {
  const [tab, setTab] = useState<Tab>(initialTab)

  return (
    <AuthLayout>
      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 26 }}>
        <Pills options={TAB_OPTIONS} value={tab} onChange={(v) => setTab(v as Tab)} layoutId="auth-tab" />
      </div>
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={tab}
          variants={FORM_VARIANTS}
          initial="initial"
          animate="animate"
          exit="exit"
          transition={{ duration: 0.25, ease: [0.2, 0.8, 0.2, 1] }}
        >
          {tab === 'login' ? <LoginForm onSwitchToRegister={() => setTab('register')} /> : <RegisterForm onSwitchToLogin={() => setTab('login')} />}
        </motion.div>
      </AnimatePresence>
    </AuthLayout>
  )
}

function LoginForm({ onSwitchToRegister }: { onSwitchToRegister: () => void }) {
  const { signIn, resendConfirmationEmail, configured } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const redirectTo = (location.state as { from?: string } | null)?.from ?? '/roadmap'

  const [identifier, setIdentifier] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [errorCode, setErrorCode] = useState<string | undefined>(undefined)
  const [unconfirmedEmail, setUnconfirmedEmail] = useState<string | undefined>(undefined)
  const [submitting, setSubmitting] = useState(false)
  const [resending, setResending] = useState(false)
  const [resendSent, setResendSent] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setErrorCode(undefined)
    setResendSent(false)
    setSubmitting(true)
    const { error, code, resolvedEmail } = await signIn(identifier, password)
    setSubmitting(false)
    if (error) {
      setError(error)
      setErrorCode(code)
      setUnconfirmedEmail(code === 'email_not_confirmed' ? resolvedEmail : undefined)
      return
    }
    navigate(redirectTo, { replace: true })
  }

  async function handleResend() {
    if (!unconfirmedEmail || resending) return
    setResending(true)
    const { error } = await resendConfirmationEmail(unconfirmedEmail)
    setResending(false)
    if (error) {
      setError(error)
      return
    }
    setResendSent(true)
  }

  return (
    <div>
      <p style={{ fontSize: 13.5, color: 'var(--mute)', textAlign: 'center', marginBottom: 24 }}>
        Log in to pick up your roadmaps and habits where you left off.
      </p>
      {!configured && (
        <div className="auth-notice auth-notice-error">
          Supabase isn't configured yet. Set <code>VITE_SUPABASE_URL</code> and{' '}
          <code>VITE_SUPABASE_ANON_KEY</code> — see <code>supabase/SETUP.md</code>.
        </div>
      )}
      {error && (
        <div className="auth-notice auth-notice-error">
          {error}
          {errorCode === 'email_not_confirmed' && unconfirmedEmail && (
            <div style={{ marginTop: 10 }}>
              <button
                type="button"
                onClick={handleResend}
                disabled={resending || resendSent}
                style={{ background: 'none', border: 'none', color: 'var(--gold)', fontWeight: 700, cursor: 'pointer', padding: 0, fontSize: 13 }}
              >
                {resendSent ? 'Confirmation email sent — check your inbox' : resending ? 'Sending…' : 'Resend confirmation email'}
              </button>
            </div>
          )}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <Input
          label="Email or username"
          id="login-email"
          type="text"
          autoComplete="username"
          required
          value={identifier}
          onChange={(e) => setIdentifier(e.target.value)}
          disabled={!configured}
        />
        <PasswordField
          id="login-password"
          label="Password"
          value={password}
          onChange={setPassword}
          autoComplete="current-password"
          disabled={!configured}
        />
        <Button type="submit" style={{ width: '100%' }} size="md" disabled={!configured} loading={submitting}>
          Log In
        </Button>
      </form>

      <div style={{ marginTop: 22, textAlign: 'center', fontSize: 13.5 }}>
        <Link to="/forgot-password" style={{ color: 'var(--gold)', fontWeight: 600 }}>
          Forgot your password?
        </Link>
        <div style={{ marginTop: 10, color: 'var(--mute)' }}>
          New here?{' '}
          <button
            type="button"
            onClick={onSwitchToRegister}
            style={{ background: 'none', border: 'none', color: 'var(--gold)', fontWeight: 600, cursor: 'pointer', padding: 0 }}
          >
            Create an account
          </button>
        </div>
      </div>
    </div>
  )
}

function RegisterForm({ onSwitchToLogin }: { onSwitchToLogin: () => void }) {
  const { signUp, configured } = useAuth()

  const [username, setUsername] = useState('')
  const [usernameValid, setUsernameValid] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [confirmTouched, setConfirmTouched] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [confirmationSent, setConfirmationSent] = useState(false)

  const confirmError = confirmTouched && password !== confirmPassword ? "Passwords don't match." : undefined

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)

    if (!USERNAME_RE.test(username)) {
      setError('Choose a valid username first.')
      return
    }
    if (!usernameValid) {
      setError('That username is not available.')
      return
    }
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
    const { error } = await signUp(email, password, username)
    setSubmitting(false)

    if (error) {
      setError(error)
      return
    }
    setConfirmationSent(true)
  }

  if (confirmationSent) {
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }}>
        <h2 style={{ fontSize: 21, textAlign: 'center', marginBottom: 16 }}>Check your email</h2>
        <div className="auth-notice auth-notice-success">
          We've sent a confirmation link to <strong>{email}</strong>. Click it to activate your account, then
          log in as <strong>{username}</strong>.
        </div>
        <Button onClick={onSwitchToLogin} style={{ width: '100%' }}>
          Go to Log In
        </Button>
      </motion.div>
    )
  }

  return (
    <div>
      <p style={{ fontSize: 13.5, color: 'var(--mute)', textAlign: 'center', marginBottom: 24 }}>
        Your roadmaps and habits, saved to your account and private to you.
      </p>
      {!configured && (
        <div className="auth-notice auth-notice-error">
          Supabase isn't configured yet. Set <code>VITE_SUPABASE_URL</code> and{' '}
          <code>VITE_SUPABASE_ANON_KEY</code> — see <code>supabase/SETUP.md</code>.
        </div>
      )}
      {error && <div className="auth-notice auth-notice-error">{error}</div>}

      <form onSubmit={handleSubmit}>
        <UsernameField value={username} onChange={setUsername} onValidityChange={setUsernameValid} disabled={!configured} />
        <Input
          label="Email"
          id="signup-email"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={!configured}
        />
        <PasswordField
          id="signup-password"
          label="Password"
          value={password}
          onChange={setPassword}
          autoComplete="new-password"
          disabled={!configured}
          showStrength
        />
        <PasswordField
          id="signup-confirm"
          label="Confirm Password"
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
          Create Account
        </Button>
      </form>

      <div style={{ marginTop: 22, textAlign: 'center', fontSize: 13.5, color: 'var(--mute)' }}>
        Already have an account?{' '}
        <button
          type="button"
          onClick={onSwitchToLogin}
          style={{ background: 'none', border: 'none', color: 'var(--gold)', fontWeight: 600, cursor: 'pointer', padding: 0 }}
        >
          Log in
        </button>
      </div>
    </div>
  )
}

export default AuthPage
