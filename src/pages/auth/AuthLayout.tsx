import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'

interface Props {
  title: string
  subtitle?: string
  children: ReactNode
  footer?: ReactNode
}

function AuthLayout({ title, subtitle, children, footer }: Props) {
  return (
    <div className="auth-page">
      <div className="auth-card">
        <Link
          to="/"
          style={{
            display: 'block',
            fontFamily: "'Poppins', sans-serif",
            fontWeight: 800,
            fontSize: 22,
            color: 'var(--cream)',
            marginBottom: 28,
            textAlign: 'center',
          }}
        >
          Anywhere Path
        </Link>
        <h1 style={{ fontSize: 24, marginBottom: subtitle ? 6 : 24, textAlign: 'center' }}>{title}</h1>
        {subtitle && (
          <p style={{ fontSize: 13.5, color: 'var(--mute)', textAlign: 'center', marginBottom: 24 }}>{subtitle}</p>
        )}
        {children}
        {footer && <div style={{ marginTop: 22, textAlign: 'center', fontSize: 13.5 }}>{footer}</div>}
      </div>
    </div>
  )
}

export default AuthLayout
