import { NavLink } from 'react-router-dom'
import { motion, useReducedMotion } from 'framer-motion'
import { HomeIcon, CoursesIcon, HabitsIcon, FriendsIcon } from './tabIcons'
import Avatar from '../ui/Avatar'
import { useAuth } from '../../context/AuthContext'

const TABS = [
  { to: '/', label: 'Home', end: true, Icon: HomeIcon },
  { to: '/courses', label: 'Courses', end: false, Icon: CoursesIcon },
  { to: '/habits', label: 'Habits', end: false, Icon: HabitsIcon },
  { to: '/friends', label: 'Friends', end: false, Icon: FriendsIcon },
]

/**
 * Fixed bottom tab bar shown only on phones (<768px, gated via CSS in index.css — this
 * component always mounts, same approach already used for the desktop nav's hamburger
 * trigger). Hidden entirely so long as the user isn't signed in — the whole app is
 * gated behind auth for every one of these destinations except Home.
 */
function BottomTabBar() {
  const { user, username } = useAuth()
  const reduceMotion = useReducedMotion()

  if (!user) return null

  return (
    <nav
      className="bottom-tab-bar"
      aria-label="Primary"
      style={{
        display: 'none',
        position: 'fixed',
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 55,
        alignItems: 'stretch',
        justifyContent: 'space-around',
        background: 'var(--ink-2)',
        borderTop: '1px solid var(--line)',
        paddingBottom: 'env(safe-area-inset-bottom)',
      }}
    >
      {TABS.map((tab) => (
        <NavLink
          key={tab.to}
          to={tab.to}
          end={tab.end}
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 3,
            padding: '8px 4px 10px',
            minHeight: 56,
          }}
        >
          {({ isActive }) => (
            <>
              <span
                style={{
                  position: 'relative',
                  width: 34,
                  height: 24,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: isActive ? 'var(--ink)' : 'var(--mute)',
                }}
              >
                {isActive && (
                  <motion.span
                    layoutId="bottom-tab-indicator"
                    transition={reduceMotion ? { duration: 0 } : { type: 'spring', stiffness: 380, damping: 32 }}
                    style={{
                      position: 'absolute',
                      inset: 0,
                      borderRadius: 10,
                      background: 'var(--gradient-primary)',
                      zIndex: -1,
                    }}
                  />
                )}
                <tab.Icon />
              </span>
              <span
                style={{
                  fontSize: 10.5,
                  fontWeight: 600,
                  color: isActive ? 'var(--cream)' : 'var(--mute)',
                }}
              >
                {tab.label}
              </span>
            </>
          )}
        </NavLink>
      ))}
      <NavLink
        to="/profile"
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 3,
          padding: '8px 4px 10px',
          minHeight: 56,
        }}
      >
        {({ isActive }) => (
          <>
            <span style={{ opacity: isActive ? 1 : 0.65, transition: 'opacity 0.15s var(--ease)' }}>
              <Avatar label={username ?? '?'} size={22} />
            </span>
            <span style={{ fontSize: 10.5, fontWeight: 600, color: isActive ? 'var(--cream)' : 'var(--mute)' }}>
              Profile
            </span>
          </>
        )}
      </NavLink>
    </nav>
  )
}

export default BottomTabBar
