import { motion, useReducedMotion } from 'framer-motion'
import Button from './Button'

interface Props {
  title: string
  description: string
  actionLabel: string
  onAction: () => void
}

/** Centred "Get started" panel for a brand-new, genuinely empty account — courses, roadmaps, habits, friends all use this one. */
function EmptyState({ title, description, actionLabel, onAction }: Props) {
  const reduceMotion = useReducedMotion()

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.2, 0.8, 0.2, 1] }}
      className="card"
      style={{
        textAlign: 'center',
        padding: '64px 32px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 18,
      }}
    >
      <motion.span
        aria-hidden
        animate={reduceMotion ? undefined : { y: [0, -6, 0] }}
        transition={reduceMotion ? undefined : { duration: 2.6, repeat: Infinity, ease: 'easeInOut' }}
        style={{
          fontSize: 30,
          color: 'var(--gold)',
          width: 56,
          height: 56,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: '50%',
          border: '1px solid var(--line)',
          background: 'var(--surface)',
        }}
      >
        ✦
      </motion.span>
      <div>
        <h2 style={{ fontSize: 20, marginBottom: 8 }}>{title}</h2>
        <p style={{ color: 'var(--mute)', fontSize: 14, maxWidth: 360, margin: '0 auto' }}>{description}</p>
      </div>
      <Button onClick={onAction}>{actionLabel}</Button>
    </motion.div>
  )
}

export default EmptyState
