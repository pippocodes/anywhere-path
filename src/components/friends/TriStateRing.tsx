import { motion } from 'framer-motion'
import type { HabitMark } from '../../types'

interface Props {
  state: HabitMark
  onClick?: () => void
  size?: number
  label?: string
  disabled?: boolean
}

/** Tap once = partial (half-filled gold ring), twice = full (✦-filled), again = cleared — the shared-tracking equivalent of the personal habit tracker's tri-state tap, as its own ring-shaped control per spec. */
function TriStateRing({ state, onClick, size = 36, label, disabled }: Props) {
  const strokeWidth = size * 0.12
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const fraction = state === 2 ? 1 : state === 1 ? 0.5 : 0

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled || !onClick}
      aria-label={label ?? (state === 2 ? 'Full' : state === 1 ? 'Partial' : 'Not done')}
      style={{
        width: size,
        height: size,
        position: 'relative',
        background: 'none',
        border: 'none',
        padding: 0,
        cursor: onClick ? 'pointer' : 'default',
        flexShrink: 0,
      }}
    >
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="var(--line)" strokeWidth={strokeWidth} />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="var(--gold)"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={false}
          animate={{ strokeDashoffset: circumference - fraction * circumference }}
          transition={{ type: 'spring', stiffness: 300, damping: 24 }}
        />
      </svg>
      {state === 2 && (
        <motion.span
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: 'spring', stiffness: 400, damping: 16 }}
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--gold)',
            fontSize: size * 0.4,
          }}
        >
          ✦
        </motion.span>
      )}
    </button>
  )
}

export default TriStateRing
