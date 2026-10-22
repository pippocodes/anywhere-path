import { useEffect, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import Button from './ui/Button'

interface Props {
  children: ReactNode
  heading?: string
  body?: string
}

/**
 * Shown instead of the real page when a signed-out visitor hits a route
 * that needs an account — renders a representative read-only preview
 * (blurred, inert) behind a glass unlock card, instead of redirecting
 * straight to /login or showing a blank/error screen.
 *
 * The unlock card is centered by a flex container that covers the full
 * viewport, not by absolute + translate(-50%,-50%) — Framer Motion owns
 * the `transform` property on whatever element it animates (here, the
 * card's entrance y/opacity), so a manually-set translate on that same
 * element gets silently clobbered the instant the animation starts.
 * Centering therefore lives on a separate, non-animated parent; the
 * portal to document.body also means position:fixed is always relative
 * to the real viewport, not to some animated ancestor (the route-level
 * page-transition wrapper in App.tsx animates `y`, which would otherwise
 * make it the fixed-position containing block).
 */
function DemoGate({ children, heading = 'Create a free account to unlock the full experience', body }: Props) {
  const navigate = useNavigate()

  useEffect(() => {
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = previous
    }
  }, [])

  return (
    <div className="page" style={{ maxWidth: 1080 }}>
      <div
        aria-hidden
        style={{
          filter: 'blur(5px)',
          pointerEvents: 'none',
          userSelect: 'none',
          opacity: 0.8,
        }}
      >
        {children}
      </div>

      {createPortal(
        <div
          data-testid="demo-gate-backdrop"
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 200,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 16,
            background: 'rgba(0, 0, 0, 0.45)',
            backdropFilter: 'blur(2px)',
          }}
        >
          <motion.div
            data-testid="demo-gate-card"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.2, 0.8, 0.2, 1] }}
            style={{
              width: '100%',
              maxWidth: 420,
              maxHeight: '90dvh',
              overflowY: 'auto',
              background: 'var(--ink-2)',
              border: '1px solid var(--line)',
              borderRadius: 16,
              padding: '32px 28px',
              textAlign: 'center',
              boxShadow: '0 30px 80px rgba(0, 0, 0, 0.55)',
              backdropFilter: 'blur(4px)',
            }}
          >
            <div className="micro-label" style={{ marginBottom: 14 }}>
              Members only
            </div>
            <h2 style={{ fontSize: 22, marginBottom: 10 }}>{heading}</h2>
            {body && <p style={{ fontSize: 13.5, color: 'var(--mute)', marginBottom: 22 }}>{body}</p>}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: body ? 0 : 22 }}>
              <Button style={{ width: '100%' }} onClick={() => navigate('/signup')}>
                Create account
              </Button>
              <Button variant="secondary" style={{ width: '100%' }} onClick={() => navigate('/login')}>
                Log in
              </Button>
            </div>
          </motion.div>
        </div>,
        document.body
      )}
    </div>
  )
}

export default DemoGate
