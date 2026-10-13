import { forwardRef, useId, type InputHTMLAttributes } from 'react'

interface Props extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  hint?: string
}

/** Shared text input — dark surface, gold focus ring, inline error text. Covers the register/login/outline-settings fields. */
const Input = forwardRef<HTMLInputElement, Props>(function Input({ label, error, hint, id, ...rest }, ref) {
  const autoId = useId()
  const inputId = id ?? autoId

  return (
    <div className="field" style={{ marginBottom: error ? 6 : 18 }}>
      {label && <label htmlFor={inputId}>{label}</label>}
      <input
        ref={ref}
        id={inputId}
        aria-invalid={!!error}
        aria-describedby={error ? `${inputId}-error` : hint ? `${inputId}-hint` : undefined}
        style={{ borderColor: error ? 'rgba(232,121,155,0.6)' : undefined }}
        {...rest}
      />
      {error ? (
        <p id={`${inputId}-error`} className="auth-field-error" style={{ marginTop: 6, marginBottom: 0 }}>
          {error}
        </p>
      ) : hint ? (
        <p id={`${inputId}-hint`} style={{ fontSize: 12, color: 'var(--mute)', marginTop: 6, marginBottom: 0 }}>
          {hint}
        </p>
      ) : null}
    </div>
  )
})

export default Input
