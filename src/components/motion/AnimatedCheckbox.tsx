import { AnimatePresence, motion } from 'framer-motion'

interface Props {
  checked: boolean
  onChange: () => void
  ariaLabel?: string
}

/** A round, gold-bordered checkbox that fills with the gold→rose gradient on check, with a small ✦ overshoot-spring pop — backed by a real (visually-hidden) input for accessibility. */
function AnimatedCheckbox({ checked, onChange, ariaLabel }: Props) {
  return (
    <label style={{ position: 'relative', width: 22, height: 22, display: 'inline-flex', cursor: 'pointer', flexShrink: 0 }}>
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
          background: checked ? 'var(--gradient-primary)' : 'transparent',
          borderColor: checked ? 'transparent' : 'var(--gold)',
        }}
        transition={{ duration: 0.2, ease: 'easeOut' }}
        style={{
          width: 22,
          height: 22,
          borderRadius: '50%',
          border: '2px solid var(--gold)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          pointerEvents: 'none',
        }}
      >
        <svg width="12" height="10" viewBox="0 0 12 10" fill="none">
          <motion.path
            d="M1 5L4.5 8.5L11 1.5"
            stroke="var(--ink)"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
            initial={false}
            animate={{ pathLength: checked ? 1 : 0, opacity: checked ? 1 : 0 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
          />
        </svg>
      </motion.span>
      <AnimatePresence>
        {checked && (
          <motion.span
            key="sparkle"
            aria-hidden
            initial={{ opacity: 0, scale: 0.3, rotate: -20 }}
            animate={{ opacity: [0, 1, 0], scale: [0.3, 1.3, 0.9], rotate: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5, ease: [0.3, 1.6, 0.5, 1] }}
            style={{
              position: 'absolute',
              top: -8,
              right: -8,
              fontSize: 12,
              color: 'var(--gold)',
              pointerEvents: 'none',
            }}
          >
            ✦
          </motion.span>
        )}
      </AnimatePresence>
    </label>
  )
}

export default AnimatedCheckbox
