import { NavLink } from 'react-router-dom'
import RevealHeading from '../components/ui/RevealHeading'

interface Section {
  path: string
  title: string
  description: string
}

const SECTIONS: Section[] = [
  { path: '/settings/appearance', title: 'Appearance', description: 'Theme and light/dark mode.' },
  { path: '/settings/profile', title: 'Profile', description: 'Username, about me, and public visibility.' },
  { path: '/settings/account', title: 'Account', description: 'Email, log out, and delete account.' },
  { path: '/settings/security', title: 'Security', description: 'Change your password.' },
  { path: '/settings/notifications', title: 'Notifications', description: 'The daily catch-up reminder.' },
  { path: '/settings/ai-privacy', title: 'AI & Privacy', description: 'What the AI features send and when.' },
  { path: '/settings/help', title: 'Help', description: 'Search the FAQ.' },
  { path: '/settings/about', title: 'About', description: 'Why Anywhere Path exists.' },
]

function Settings() {
  return (
    <div className="page" style={{ maxWidth: 680 }}>
      <RevealHeading as="h1" className="page-title">
        Settings
      </RevealHeading>
      <p className="page-subtitle" style={{ marginBottom: 28 }}>
        Manage your account and how Anywhere Path looks.
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {SECTIONS.map((s) => (
          <NavLink
            key={s.path}
            to={s.path}
            className="card"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 16,
              padding: '18px 20px',
              textDecoration: 'none',
              color: 'inherit',
            }}
          >
            <div>
              <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 2 }}>{s.title}</div>
              <div style={{ fontSize: 12.5, color: 'var(--mute)' }}>{s.description}</div>
            </div>
            <span style={{ color: 'var(--mute)', fontSize: 18, flexShrink: 0 }}>›</span>
          </NavLink>
        ))}
      </div>
    </div>
  )
}

export default Settings
