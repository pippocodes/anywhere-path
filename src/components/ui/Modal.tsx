import { useEffect, type ReactNode } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { createPortal } from 'react-dom'

interface Props {
  open: boolean
  onClose: () => void
  children: ReactNode
  variant?: 'center' | 'sheet'
  title?: string
  width?: number
}

/** Centered glass dialog (variant="center") or a right-hand side sheet (variant="sheet") — used for confirmations, the auth modal, and habit/category management. */
function Modal({ open, onClose, children, variant = 'center', title, width = 440 }: Props) {
  const reduceMotion = useReducedMotion()

  useEffect(() => {
    if (!open) return
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [open, onClose])

  const panelInitial =
    variant === 'sheet' ? { x: '100%', opacity: 1 } : { opacity: 0, scale: 0.96, y: 12 }
  const panelAnimate = variant === 'sheet' ? { x: 0, opacity: 1 } : { opacity: 1, scale: 1, y: 0 }
  const panelExit = variant === 'sheet' ? { x: '100%', opacity: 1 } : { opacity: 0, scale: 0.96, y: 12 }

  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          onClick={onClose}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 200,
            background: 'rgba(14,9,18,0.65)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            justifyContent: variant === 'sheet' ? 'flex-end' : 'center',
            alignItems: variant === 'sheet' ? 'stretch' : 'center',
            padding: variant === 'sheet' ? 0 : 20,
          }}
        >
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label={title}
            onClick={(e) => e.stopPropagation()}
            initial={reduceMotion ? { opacity: 1 } : panelInitial}
            animate={panelAnimate}
            exit={reduceMotion ? { opacity: 1 } : panelExit}
            transition={{ duration: reduceMotion ? 0 : 0.35, ease: [0.2, 0.8, 0.2, 1] }}
            style={{
              background: 'var(--ink-2)',
              border: '1px solid var(--line)',
              boxShadow: 'var(--shadow-soft)',
              width: variant === 'sheet' ? Math.min(width, 440) : '100%',
              maxWidth: variant === 'sheet' ? 440 : width,
              height: variant === 'sheet' ? '100%' : undefined,
              maxHeight: variant === 'sheet' ? undefined : '85vh',
              overflowY: 'auto',
              borderRadius: variant === 'sheet' ? 0 : 16,
              padding: '28px 28px',
            }}
          >
            {title && (
              <h3 style={{ fontSize: 22, marginBottom: 20 }}>{title}</h3>
            )}
            {children}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  )
}

export default Modal
