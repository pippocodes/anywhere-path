import { useEffect, useRef, type ReactNode } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { createPortal } from 'react-dom'
import { useIsPhone } from '../../hooks/useIsPhone'

interface Props {
  open: boolean
  onClose: () => void
  children: ReactNode
  variant?: 'center' | 'sheet'
  title?: string
  width?: number
}

const FOCUSABLE_SELECTOR =
  'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'

/**
 * Centered glass dialog (variant="center") or a right-hand side sheet (variant="sheet") —
 * used for confirmations, the auth modal, and habit/category management. On phones
 * (<768px), a "sheet" automatically renders as a bottom sheet instead of a side sheet —
 * handled internally here so every existing call site gets the phone-friendly layout
 * for free, with no prop changes needed anywhere else.
 */
function Modal({ open, onClose, children, variant = 'center', title, width = 440 }: Props) {
  const reduceMotion = useReducedMotion()
  const isPhone = useIsPhone()
  const isPhoneSheet = variant === 'sheet' && isPhone
  const panelRef = useRef<HTMLDivElement>(null)
  const previouslyFocused = useRef<HTMLElement | null>(null)

  useEffect(() => {
    if (!open) return
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        onClose()
        return
      }
      // Focus trap: Tab/Shift+Tab cycle within the dialog instead of escaping to the page behind it.
      if (e.key === 'Tab' && panelRef.current) {
        const focusable = Array.from(panelRef.current.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)).filter(
          (el) => el.offsetParent !== null
        )
        if (focusable.length === 0) return
        const first = focusable[0]
        const last = focusable[focusable.length - 1]
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault()
          last.focus()
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault()
          first.focus()
        }
      }
    }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [open, onClose])

  useEffect(() => {
    if (!open) return
    previouslyFocused.current = document.activeElement as HTMLElement | null
    const first = panelRef.current?.querySelector<HTMLElement>(FOCUSABLE_SELECTOR)
    ;(first ?? panelRef.current)?.focus()
    return () => {
      previouslyFocused.current?.focus?.()
    }
  }, [open])

  const panelInitial = isPhoneSheet
    ? { y: '100%', opacity: 1 }
    : variant === 'sheet'
      ? { x: '100%', opacity: 1 }
      : { opacity: 0, scale: 0.96, y: 12 }
  const panelAnimate = isPhoneSheet
    ? { y: 0, opacity: 1 }
    : variant === 'sheet'
      ? { x: 0, opacity: 1 }
      : { opacity: 1, scale: 1, y: 0 }
  const panelExit = isPhoneSheet
    ? { y: '100%', opacity: 1 }
    : variant === 'sheet'
      ? { x: '100%', opacity: 1 }
      : { opacity: 0, scale: 0.96, y: 12 }

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
            background: 'rgba(0, 0, 0, 0.6)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            justifyContent: isPhoneSheet ? 'center' : variant === 'sheet' ? 'flex-end' : 'center',
            alignItems: isPhoneSheet ? 'flex-end' : variant === 'sheet' ? 'stretch' : 'center',
            padding: variant === 'sheet' ? 0 : 20,
          }}
        >
          <motion.div
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-label={title}
            tabIndex={-1}
            onClick={(e) => e.stopPropagation()}
            initial={reduceMotion ? { opacity: 1 } : panelInitial}
            animate={panelAnimate}
            exit={reduceMotion ? { opacity: 1 } : panelExit}
            transition={{ duration: reduceMotion ? 0 : 0.35, ease: [0.2, 0.8, 0.2, 1] }}
            style={{
              background: 'var(--ink-2)',
              border: '1px solid var(--line)',
              boxShadow: 'var(--shadow-soft)',
              width: isPhoneSheet ? '100%' : variant === 'sheet' ? Math.min(width, 440) : '100%',
              maxWidth: isPhoneSheet ? '100%' : variant === 'sheet' ? 440 : width,
              height: isPhoneSheet ? 'auto' : variant === 'sheet' ? '100%' : undefined,
              maxHeight: isPhoneSheet ? '85vh' : variant === 'sheet' ? undefined : '85vh',
              overflowY: 'auto',
              borderRadius: isPhoneSheet ? '20px 20px 0 0' : variant === 'sheet' ? 0 : 16,
              padding: isPhoneSheet ? '24px 24px max(24px, env(safe-area-inset-bottom))' : '28px 28px',
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
