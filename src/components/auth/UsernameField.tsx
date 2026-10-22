import { useEffect, useId, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '../../context/AuthContext'

interface Props {
  value: string
  onChange: (value: string) => void
  onValidityChange?: (valid: boolean) => void
  disabled?: boolean
}

const USERNAME_RE = /^[a-zA-Z0-9_]{3,20}$/

type Status = 'idle' | 'invalid' | 'checking' | 'available' | 'taken' | 'error'

/** Username field for the register form — live debounced availability check with an animated status indicator. */
function UsernameField({ value, onChange, onValidityChange, disabled }: Props) {
  const { checkUsernameAvailable } = useAuth()
  const id = useId()
  const [status, setStatus] = useState<Status>('idle')
  const [touched, setTouched] = useState(false)
  const debounceRef = useRef<ReturnType<typeof setTimeout>>()
  const requestId = useRef(0)

  useEffect(() => {
    clearTimeout(debounceRef.current)

    if (!value) {
      setStatus('idle')
      return
    }
    if (!USERNAME_RE.test(value)) {
      setStatus('invalid')
      return
    }

    setStatus('checking')
    const thisRequest = ++requestId.current
    debounceRef.current = setTimeout(async () => {
      const available = await checkUsernameAvailable(value)
      if (requestId.current !== thisRequest) return // a newer keystroke superseded this check
      if (available === null) setStatus('error')
      else setStatus(available ? 'available' : 'taken')
    }, 450)

    return () => clearTimeout(debounceRef.current)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value])

  useEffect(() => {
    onValidityChange?.(status === 'available')
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status])

  const showError = touched && (status === 'invalid' || status === 'taken')
  const errorText =
    status === 'invalid'
      ? value.length < 3
        ? 'At least 3 characters.'
        : 'Only letters, numbers, and underscores.'
      : status === 'taken'
        ? 'That username is already taken.'
        : undefined

  return (
    <div className="field" style={{ marginBottom: showError ? 6 : 18 }}>
      <label htmlFor={id}>Username</label>
      <div style={{ position: 'relative' }}>
        <input
          id={id}
          type="text"
          autoComplete="username"
          required
          minLength={3}
          maxLength={20}
          value={value}
          disabled={disabled}
          onChange={(e) => onChange(e.target.value.trim())}
          onBlur={() => setTouched(true)}
          aria-invalid={showError}
          style={{ paddingRight: 36, borderColor: showError ? 'color-mix(in srgb, var(--danger) 60%, transparent)' : undefined }}
        />
        <div style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)' }}>
          <AnimatePresence mode="wait">
            {status === 'checking' && (
              <motion.span
                key="checking"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                aria-hidden
                style={{
                  display: 'block',
                  width: 13,
                  height: 13,
                  borderRadius: '50%',
                  border: '2px solid var(--line)',
                  borderTopColor: 'var(--gold)',
                  animation: 'btn-spin 0.7s linear infinite',
                }}
              />
            )}
            {status === 'available' && (
              <motion.span
                key="available"
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.5 }}
                transition={{ ease: [0.3, 1.6, 0.5, 1], duration: 0.35 }}
                aria-hidden
                style={{ color: 'var(--gold)', fontSize: 15, fontWeight: 700 }}
              >
                ✓
              </motion.span>
            )}
            {status === 'taken' && (
              <motion.span
                key="taken"
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.5 }}
                aria-hidden
                style={{ color: 'var(--rose)', fontSize: 15, fontWeight: 700 }}
              >
                ✕
              </motion.span>
            )}
          </AnimatePresence>
        </div>
      </div>
      {showError ? (
        <p className="auth-field-error" style={{ marginTop: 6, marginBottom: 0 }}>
          {errorText}
        </p>
      ) : (
        <p style={{ fontSize: 12, color: 'var(--mute)', marginTop: 6, marginBottom: 0 }}>
          3–20 characters: letters, numbers, underscores.
        </p>
      )}
    </div>
  )
}

export default UsernameField
export { USERNAME_RE }
