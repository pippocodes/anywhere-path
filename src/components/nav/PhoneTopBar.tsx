import { NavLink } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import Avatar from '../ui/Avatar'
import NotificationBell from '../friends/NotificationBell'

/**
 * Replaces the hamburger top bar on phones (<768px, CSS-gated in index.css) once signed
 * in — logo, the existing NotificationBell (unmodified), and an avatar linking to
 * /profile. Signed-out visitors keep today's hamburger + full-screen sheet, which already
 * covers their much smaller nav surface (Home/About/Help/Login/Signup).
 */
function PhoneTopBar() {
  const { user, username } = useAuth()

  if (!user) return null

  return (
    <div
      className="phone-top-bar"
      style={{
        display: 'none',
        position: 'sticky',
        top: 0,
        zIndex: 50,
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 16,
        padding: '14px 20px',
        paddingTop: 'max(14px, env(safe-area-inset-top))',
        background: 'var(--ink-2)',
        borderBottom: '1px solid var(--line)',
      }}
    >
      <NavLink
        to="/"
        style={{
          fontFamily: 'var(--font-display)',
          fontStyle: 'italic',
          fontWeight: 600,
          fontSize: 19,
          color: 'var(--cream)',
        }}
      >
        Anywhere Path
      </NavLink>

      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <NotificationBell />
        <NavLink to="/profile" aria-label="Profile">
          <Avatar label={username ?? user.email ?? '?'} size={32} />
        </NavLink>
      </div>
    </div>
  )
}

export default PhoneTopBar
