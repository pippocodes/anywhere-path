import { NavLink } from 'react-router-dom'

const NAV_ITEMS = [
  { to: '/', label: 'Home', end: true },
  { to: '/courses', label: 'Courses' },
  { to: '/roadmap', label: 'Roadmap Builder' },
  { to: '/habits', label: 'Habit Tracker' },
  { to: '/about', label: 'About Us' },
  { to: '/help', label: 'Help' },
]

function Navbar() {
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
    </nav>
  )
}

export default Navbar
