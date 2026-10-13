import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const NAV_ITEMS = [
  { to: '/', label: 'Home', end: true },
  { to: '/courses', label: 'Courses' },
  { to: '/roadmap', label: 'Roadmap Builder' },
  { to: '/habits', label: 'Habit Tracker' },
  { to: '/about', label: 'About Us' },
  { to: '/help', label: 'Help' },
]

function Navbar() {
  const { user, signOut } = useAuth()
  const navigate = useNavigate()

  async function handleSignOut() {
    await signOut()
    navigate('/')
  }

  return (
    <nav
      style={{
        display: 'flex',
        justifyContent: 'flex-end',
        alignItems: 'center',
        gap: 28,
        padding: '18px 48px',
        background: 'var(--bg)',
        position: 'sticky',
        top: 0,
        zIndex: 50,
        borderBottom: '1px solid var(--pink-pale)',
        flexWrap: 'wrap',
      }}
    >
      {NAV_ITEMS.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          end={item.end}
          className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}
        >
          {item.label}
        </NavLink>
      ))}
      {user ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <span style={{ fontSize: 13, color: 'var(--mute)' }}>{user.email}</span>
          <button className="btn-outline" onClick={handleSignOut}>
            Log Out
          </button>
        </div>
      ) : (
        <NavLink to="/login" className="btn-outline">
          Log In
        </NavLink>
      )}
    </nav>
  )
}

export default Navbar
