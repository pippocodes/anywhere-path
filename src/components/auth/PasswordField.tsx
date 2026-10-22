import { useId, useState } from 'react'
import { motion } from 'framer-motion'

interface Props {
  label: string
  value: string
  onChange: (value: string) => void
  autoComplete: 'new-password' | 'current-password'
  disabled?: boolean
  error?: string
  showStrength?: boolean
  id?: string
}

const STRENGTH_LABELS = ['Too short', 'Weak', 'Fair', 'Good', 'Strong']
const STRENGTH_COLORS = ['var(--rose)', 'var(--rose)', 'var(--gold)', 'var(--gold)', 'var(--gold)']

function scorePassword(pw: string): number {
  if (pw.length === 0) return 0
  if (pw.length < 6) return 1
  let score = 1
  if (pw.length >= 10) score++
  if (/[A-Z]/.test(pw) && /[a-z]/.test(pw)) score++
  if (/\d/.test(pw)) score++
  if (/[^A-Za-z0-9]/.test(pw)) score++
  return Math.min(score, 4)
}

/** Password input with a show/hide toggle and, optionally, an animated strength meter — used on register and reset-password. */
function PasswordField({ label, value, onChange, autoComplete, disabled, error, showStrength, id: idProp }: Props) {
  const autoId = useId()
  const id = idProp ?? autoId
  const [visible, setVisible] = useState(false)
  const score = scorePassword(value)

  return (
    <div className="field" style={{ marginBottom: error ? 6 : 18 }}>
      <label htmlFor={id}>{label}</label>
      <div style={{ position: 'relative' }}>
        <input
          id={id}
          type={visible ? 'text' : 'password'}
          autoComplete={autoComplete}
          required
          minLength={6}
          value={value}
          disabled={disabled}
          onChange={(e) => onChange(e.target.value)}
          aria-invalid={!!error}
          style={{ paddingRight: 56, borderColor: error ? 'color-mix(in srgb, var(--danger) 60%, transparent)' : undefined }}
        />
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          tabIndex={0}
          style={{
            position: 'absolute',
            right: 10,
            top: '50%',
            transform: 'translateY(-50%)',
            background: 'none',
            border: 'none',
            color: 'var(--gold)',
            fontSize: 11.5,
            fontWeight: 700,
            letterSpacing: '0.04em',
            textTransform: 'uppercase',
            padding: '4px 6px',
          }}
        >
          {visible ? 'Hide' : 'Show'}
        </button>
      </div>
      {showStrength && value.length > 0 && (
        <div style={{ marginTop: 8 }}>
          <div style={{ display: 'flex', gap: 4 }}>
            {[0, 1, 2, 3].map((i) => (
              <div key={i} style={{ flex: 1, height: 3, borderRadius: 2, background: 'var(--line)', overflow: 'hidden' }}>
                <motion.div
                  initial={false}
                  animate={{ scaleX: score > i ? 1 : 0 }}
                  transition={{ duration: 0.25, ease: [0.2, 0.8, 0.2, 1] }}
                  style={{
                    height: '100%',
                    transformOrigin: 'left',
                    background: STRENGTH_COLORS[score],
                  }}
                />
              </div>
            ))}
          </div>
          <div style={{ fontSize: 11.5, color: STRENGTH_COLORS[score], marginTop: 5, fontWeight: 600 }}>
            {STRENGTH_LABELS[score]}
          </div>
        </div>
      )}
      {error && (
        <p className="auth-field-error" style={{ marginTop: 6, marginBottom: 0 }}>
          {error}
        </p>
      )}
    </div>
  )
}

export default PasswordField
