import { motion } from 'framer-motion'

interface Props {
  checked: boolean
  onChange: () => void
  ariaLabel?: string
}

/** A checkbox with a satisfying drawn-tick animation, backed by a real (visually-hidden) input for accessibility. */
function AnimatedCheckbox({ checked, onChange, ariaLabel }: Props) {
  return (
    <label style={{ position: 'relative', width: 20, height: 20, display: 'inline-flex', cursor: 'pointer', flexShrink: 0 }}>
      <input
        type="checkbox"
        checked={checked}
        onChange={onChange}
        aria-label={ariaLabel}
        style={{ position: 'absolute', inset: 0, opacity: 0, margin: 0, cursor: 'pointer' }}
      />
      <motion.span
        initial={false}
        animate={{
          backgroundColor: checked ? 'var(--cherry)' : 'var(--card-bg)',
          borderColor: checked ? 'var(--cherry)' : 'var(--pink-pale)',
          scale: checked ? [1, 1.15, 1] : 1,
        }}
        transition={{ duration: 0.2, ease: 'easeOut' }}
        style={{
          width: 20,
          height: 20,
          borderRadius: 6,
          border: '2px solid var(--pink-pale)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          pointerEvents: 'none',
        }}
      >
        <svg width="12" height="10" viewBox="0 0 12 10" fill="none">
          <motion.path
            d="M1 5L4.5 8.5L11 1.5"
            stroke="white"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
            initial={false}
            animate={{ pathLength: checked ? 1 : 0, opacity: checked ? 1 : 0 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
          />
        </svg>
      </motion.span>
    </label>
  )
}

export default AnimatedCheckbox
