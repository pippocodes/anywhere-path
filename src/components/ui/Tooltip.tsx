import { useState, type ReactNode } from 'react'
import { AnimatePresence, motion } from 'framer-motion'

interface Props {
  content: ReactNode
  children: ReactNode
}

/** Small dark tooltip shown on hover/focus — used for chart data points and icon-only controls. */
function Tooltip({ content, children }: Props) {
  const [open, setOpen] = useState(false)

  return (
    <span
      style={{ position: 'relative', display: 'inline-flex' }}
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
      onFocus={() => setOpen(true)}
      onBlur={() => setOpen(false)}
    >
      {children}
      <AnimatePresence>
        {open && (
          <motion.span
            role="tooltip"
            initial={{ opacity: 0, y: 4, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 4, scale: 0.96 }}
            transition={{ duration: 0.15 }}
            style={{
              position: 'absolute',
              bottom: '100%',
              left: '50%',
              transform: 'translateX(-50%)',
              marginBottom: 8,
              padding: '6px 10px',
              borderRadius: 8,
              background: 'var(--ink-2)',
              border: '1px solid var(--line)',
              color: 'var(--cream)',
              fontSize: 12,
              whiteSpace: 'nowrap',
              boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
              zIndex: 60,
              pointerEvents: 'none',
            }}
          >
            {content}
          </motion.span>
        )}
      </AnimatePresence>
    </span>
  )
}

export default Tooltip
