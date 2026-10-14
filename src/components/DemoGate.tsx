import type { ReactNode } from 'react'
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
 */
function DemoGate({ children, heading = 'Create a free account to unlock the full experience', body }: Props) {
  const navigate = useNavigate()

  return (
    <div className="page" style={{ position: 'relative', maxWidth: 1080 }}>
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
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.2, 0.8, 0.2, 1] }}
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: 'min(420px, calc(100% - 32px))',
          background: 'var(--ink-2)',
          border: '1px solid var(--line)',
          borderRadius: 16,
          padding: '32px 28px',
          textAlign: 'center',
          boxShadow: '0 30px 80px rgba(0,0,0,0.55)',
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
    </div>
  )
}

export default DemoGate
