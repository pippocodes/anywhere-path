import { motion, useReducedMotion } from 'framer-motion'

interface Props {
  checked: boolean
  onChange: (checked: boolean) => void
  disabled?: boolean
  label?: string
}

/** A themed on/off toggle — used for instant-apply booleans like Public/Private, not multi-step forms. */
function Switch({ checked, onChange, disabled, label }: Props) {
  const reduceMotion = useReducedMotion()

  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      style={{
        position: 'relative',
        width: 42,
        height: 24,
        borderRadius: 999,
        border: 'none',
        padding: 2,
        cursor: disabled ? 'default' : 'pointer',
        opacity: disabled ? 0.5 : 1,
        background: checked ? 'var(--gradient-primary)' : 'var(--surface-2)',
        boxShadow: checked ? 'none' : 'inset 0 0 0 1px var(--line)',
        transition: 'background 0.2s var(--ease)',
        flexShrink: 0,
      }}
    >
      <motion.span
        aria-hidden
        animate={{ x: checked ? 18 : 0 }}
        transition={reduceMotion ? { duration: 0 } : { type: 'spring', stiffness: 500, damping: 32 }}
        style={{
          display: 'block',
          width: 20,
          height: 20,
          borderRadius: '50%',
          background: checked ? 'var(--ink)' : 'var(--mute)',
        }}
      />
    </button>
  )
}

export default Switch
