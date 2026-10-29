import { NavLink, useLocation } from 'react-router-dom'
import { motion, useReducedMotion } from 'framer-motion'
import { HomeIcon, CoursesIcon, HabitsIcon, FriendsIcon } from './tabIcons'
import { isForcedActive } from './navActive'
import { useAuth } from '../../context/AuthContext'

const TABS = [
  { to: '/', label: 'Home', end: true, Icon: HomeIcon, extraActiveOn: undefined as string | undefined },
  { to: '/learning', label: 'My Learning', end: false, Icon: CoursesIcon, extraActiveOn: '/roadmap' },
  { to: '/habits', label: 'Habits', end: false, Icon: HabitsIcon, extraActiveOn: undefined as string | undefined },
  { to: '/community', label: 'Community', end: false, Icon: FriendsIcon, extraActiveOn: undefined as string | undefined },
]

/**
 * Fixed bottom tab bar shown only on phones (<768px, gated via CSS in index.css — this
 * component always mounts, same approach already used for the desktop nav's hamburger
 * trigger). Hidden entirely so long as the user isn't signed in — the whole app is
 * gated behind auth for every one of these destinations except Home. Profile isn't a
 * tab here — it stays reachable through the avatar in PhoneTopBar.tsx.
 */
function BottomTabBar() {
  const { user } = useAuth()
  const reduceMotion = useReducedMotion()
  const location = useLocation()

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
        height: 'calc(60px + env(safe-area-inset-bottom, 0px))',
        zIndex: 55,
        alignItems: 'stretch',
        justifyContent: 'space-around',
        background: 'var(--ink-2)',
        borderTop: '1px solid var(--line)',
        paddingBottom: 'env(safe-area-inset-bottom, 0px)',
      }}
    >
      {TABS.map((tab) => {
        const forcedActive = isForcedActive(location.pathname, tab.extraActiveOn)
        return (
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
            minHeight: 60,
          }}
        >
          {({ isActive: linkActive }) => {
            const isActive = linkActive || forcedActive
            return (
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
            )
          }}
        </NavLink>
        )
      })}
    </nav>
  )
}

export default BottomTabBar
