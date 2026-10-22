import { createContext, useCallback, useContext, useRef, useState, type ReactNode } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { createPortal } from 'react-dom'

type ToastKind = 'success' | 'error' | 'info'

interface ToastItem {
  id: number
  kind: ToastKind
  message: string
}

interface ToastContextValue {
  show: (message: string, kind?: ToastKind) => void
}

const ToastContext = createContext<ToastContextValue | null>(null)

const KIND_ACCENT: Record<ToastKind, string> = {
  success: 'var(--success)',
  error: 'var(--danger)',
  info: 'var(--info)',
}

/** App-wide toast host — call `useToast().show(message, kind)` from anywhere beneath <ToastProvider>. Replaces ad hoc inline success/error banners. */
export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([])
  const nextId = useRef(0)

  const show = useCallback((message: string, kind: ToastKind = 'info') => {
    const id = nextId.current++
    setToasts((prev) => [...prev, { id, kind, message }])
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id))
    }, 3800)
  }, [])

  return (
    <ToastContext.Provider value={{ show }}>
      {children}
      {createPortal(
        <div
          style={{
            position: 'fixed',
            top: 20,
            right: 20,
            zIndex: 300,
            display: 'flex',
            flexDirection: 'column',
            gap: 10,
            maxWidth: 'calc(100vw - 40px)',
          }}
        >
          <AnimatePresence>
            {toasts.map((t) => (
              <motion.div
                key={t.id}
                role="status"
                initial={{ opacity: 0, x: 40, scale: 0.95 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                exit={{ opacity: 0, x: 40, scale: 0.95 }}
                transition={{ duration: 0.3, ease: [0.2, 0.8, 0.2, 1] }}
                style={{
                  background: 'var(--ink-2)',
                  border: '1px solid var(--line)',
                  borderLeft: `3px solid ${KIND_ACCENT[t.kind]}`,
                  borderRadius: 10,
                  padding: '12px 18px',
                  fontSize: 13.5,
                  color: 'var(--cream)',
                  boxShadow: '0 12px 32px var(--shadow)',
                  minWidth: 220,
                }}
              >
                {t.message}
              </motion.div>
            ))}
          </AnimatePresence>
        </div>,
        document.body
      )}
    </ToastContext.Provider>
  )
}

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used within a ToastProvider')
  return ctx
}
