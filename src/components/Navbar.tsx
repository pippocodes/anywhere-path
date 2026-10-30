import { useEffect, useRef, useState } from 'react'
import { NavLink, useLocation, useNavigate } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { useAuth } from '../context/AuthContext'
import { useIsAdmin } from '../hooks/useIsAdmin'
import NotificationBell from './friends/NotificationBell'
import PhoneTopBar from './nav/PhoneTopBar'
import BottomTabBar from './nav/BottomTabBar'
import { isForcedActive } from './nav/navActive'
import LogoStarIcon from './ui/LogoStarIcon'

const NAV_ITEMS = [
  { to: '/', label: 'Home', end: true },
  { to: '/learning', label: 'My Learning', extraActiveOn: '/roadmap' },
  { to: '/habits', label: 'Habits' },
  { to: '/community', label: 'Community' },
  { to: '/about', label: 'About Us' },
  { to: '/help', label: 'Help' },
]

function Navbar() {
  const { user, username, signOut } = useAuth()
  const isAdmin = useIsAdmin()
  const navigate = useNavigate()
  const location = useLocation()
  const [scrolled, setScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleScroll() {
      setScrolled(window.scrollY > 8)
    }
    handleScroll()
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  async function handleSignOut() {
    setMenuOpen(false)
    setMobileOpen(false)
    await signOut()
    navigate('/')
  }

  const initial = (username ?? user?.email ?? '?').charAt(0).toUpperCase()

  const navStyle = {
    position: 'sticky' as const,
    top: 0,
    zIndex: 50,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 24,
    padding: '14px 48px',
    background: scrolled ? 'color-mix(in srgb, var(--bg) 72%, transparent)' : 'transparent',
    backdropFilter: scrolled ? 'blur(14px)' : 'none',
    borderBottom: `1px solid ${scrolled ? 'var(--line)' : 'transparent'}`,
    transition: 'background 0.3s var(--ease), border-color 0.3s var(--ease)',
  }

  const wordmarkStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    fontFamily: 'var(--font-display)',
    fontStyle: 'italic' as const,
    fontWeight: 600,
    fontSize: 22,
    color: 'var(--cream)',
    flexShrink: 0,
  }

  if (!user) {
    return (
      <nav className="navbar-root" style={navStyle}>
        <NavLink to="/" style={wordmarkStyle}>
          <LogoStarIcon size={22} color="currentColor" />
          Anywhere Path
        </NavLink>
        <NavLink to="/login" className="btn-outline" style={{ fontSize: 13.5, height: 40, display: 'inline-flex', alignItems: 'center' }}>
          Log in
        </NavLink>
      </nav>
    )
  }

  return (
    <>
      <nav className="navbar-root navbar-root-phone-app" style={navStyle}>
        <NavLink to="/" style={wordmarkStyle}>
          Anywhere Path
        </NavLink>

        <div className="navbar-links" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          {NAV_ITEMS.map((item) => {
            const forcedActive = isForcedActive(location.pathname, item.extraActiveOn)
            return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              style={({ isActive }) => ({
                position: 'relative',
                padding: '8px 14px',
                fontSize: 14,
                fontWeight: 500,
                color: isActive || forcedActive ? 'var(--cream)' : 'var(--mute)',
              })}
            >
              {({ isActive }) => (
                <>
                  {item.label}
                  {(isActive || forcedActive) && (
                    <motion.span
                      layoutId="navbar-active-pill"
                      transition={{ type: 'spring', stiffness: 380, damping: 32 }}
                      style={{
                        position: 'absolute',
                        left: 6,
                        right: 6,
                        bottom: 0,
                        height: 2,
                        borderRadius: 2,
                        background: 'var(--gradient-primary)',
                      }}
                    />
                  )}
                </>
              )}
            </NavLink>
            )
          })}
        </div>

        <div className="navbar-actions" style={{ display: 'flex', alignItems: 'center', gap: 14, flexShrink: 0 }}>
          <NotificationBell />
          <div ref={menuRef} style={{ position: 'relative' }} className="navbar-account">
              <button
                onClick={() => setMenuOpen((v) => !v)}
                aria-haspopup="menu"
                aria-expanded={menuOpen}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  background: 'none',
                  border: 'none',
                  padding: '4px 6px 4px 4px',
                  borderRadius: 999,
                }}
              >
                <span
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: '50%',
                    padding: 2,
                    background: 'var(--gradient-primary)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  <span
                    style={{
                      width: '100%',
                      height: '100%',
                      borderRadius: '50%',
                      background: 'var(--ink-2)',
                      color: 'var(--gold)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontFamily: 'var(--font-display)',
                      fontStyle: 'italic',
                      fontWeight: 600,
                      fontSize: 15,
                    }}
                  >
                    {initial}
                  </span>
                </span>
                <span style={{ fontSize: 13.5, color: 'var(--cream)', fontWeight: 600 }}>
                  {username ?? user.email}
                </span>
              </button>
              <AnimatePresence>
                {menuOpen && (
                  <motion.div
                    role="menu"
                    initial={{ opacity: 0, y: -6, scale: 0.97 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -6, scale: 0.97 }}
                    transition={{ duration: 0.18, ease: [0.2, 0.8, 0.2, 1] }}
                    style={{
                      position: 'absolute',
                      right: 0,
                      top: 'calc(100% + 10px)',
                      minWidth: 180,
                      background: 'var(--ink-2)',
                      border: '1px solid var(--line)',
                      borderRadius: 12,
                      padding: 6,
                      boxShadow: '0 20px 50px var(--shadow)',
                    }}
                  >
                    <DropdownLink to="/profile" onClick={() => setMenuOpen(false)}>
                      Profile
                    </DropdownLink>
                    <DropdownLink to="/settings" onClick={() => setMenuOpen(false)}>
                      Settings
                    </DropdownLink>
                    {isAdmin && (
                      <DropdownLink to="/admin" onClick={() => setMenuOpen(false)}>
                        Admin
                      </DropdownLink>
                    )}
                    <button
                      role="menuitem"
                      onClick={handleSignOut}
                      style={{
                        display: 'block',
                        width: '100%',
                        textAlign: 'left',
                        padding: '9px 12px',
                        borderRadius: 8,
                        background: 'none',
                        border: 'none',
                        color: 'var(--rose)',
                        fontSize: 13.5,
                        fontWeight: 600,
                      }}
                    >
                      Log out
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

          <button
            className="navbar-hamburger"
            onClick={() => setMobileOpen(true)}
            aria-label="Open menu"
            aria-expanded={mobileOpen}
            style={{
              display: 'none',
              flexDirection: 'column',
              justifyContent: 'center',
              gap: 5,
              width: 36,
              height: 36,
              background: 'none',
              border: 'none',
            }}
          >
            <span style={{ display: 'block', width: 20, height: 2, background: 'var(--cream)', borderRadius: 2 }} />
            <span style={{ display: 'block', width: 20, height: 2, background: 'var(--cream)', borderRadius: 2 }} />
          </button>
        </div>
      </nav>

      <PhoneTopBar />
      <BottomTabBar />

      <MobileSheet
        open={mobileOpen}
        onClose={() => setMobileOpen(false)}
        username={username}
        userEmail={user?.email ?? null}
        isAdmin={isAdmin}
        onSignOut={handleSignOut}
      />
    </>
  )
}

function DropdownLink({ to, onClick, children }: { to: string; onClick: () => void; children: string }) {
  return (
    <NavLink
      to={to}
      role="menuitem"
      onClick={onClick}
      style={{
        display: 'block',
        padding: '9px 12px',
        borderRadius: 8,
        fontSize: 13.5,
        fontWeight: 600,
        color: 'var(--cream)',
      }}
    >
      {children}
    </NavLink>
  )
}

interface MobileSheetProps {
  open: boolean
  onClose: () => void
  username: string | null
  userEmail: string | null
  isAdmin: boolean
  onSignOut: () => void
}

function MobileSheet({ open, onClose, username, userEmail, isAdmin, onSignOut }: MobileSheetProps) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 90,
            background: 'var(--ink)',
            display: 'flex',
            flexDirection: 'column',
            paddingTop: 'max(20px, env(safe-area-inset-top))',
            paddingBottom: 'max(20px, env(safe-area-inset-bottom))',
            paddingLeft: 'max(24px, env(safe-area-inset-left))',
            paddingRight: 'max(24px, env(safe-area-inset-right))',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 36 }}>
            <span
              style={{
                fontFamily: 'var(--font-display)',
                fontStyle: 'italic',
                fontWeight: 600,
                fontSize: 22,
                color: 'var(--cream)',
              }}
            >
              Anywhere Path
            </span>
            <button
              onClick={onClose}
              aria-label="Close menu"
              style={{
                background: 'none',
                border: '1px solid var(--line)',
                borderRadius: 10,
                width: 40,
                height: 40,
                color: 'var(--cream)',
                fontSize: 18,
              }}
            >
              ✕
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {NAV_ITEMS.map((item, i) => (
              <motion.div
                key={item.to}
                initial={{ opacity: 0, x: 16 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.04, duration: 0.3, ease: [0.2, 0.8, 0.2, 1] }}
              >
                <NavLink
                  to={item.to}
                  end={item.end}
                  onClick={onClose}
                  style={({ isActive }) => ({
                    display: 'block',
                    padding: '16px 4px',
                    fontSize: 20,
                    fontFamily: 'var(--font-display)',
                    fontStyle: 'italic',
                    fontWeight: 600,
                    color: isActive ? 'var(--gold)' : 'var(--cream)',
                    borderBottom: '1px solid var(--line)',
                  })}
                >
                  {item.label}
                </NavLink>
              </motion.div>
            ))}
          </div>

          <div style={{ marginTop: 'auto', paddingTop: 28 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div style={{ fontSize: 14, color: 'var(--mute)' }}>
                Signed in as <strong style={{ color: 'var(--cream)' }}>{username ?? userEmail}</strong>
              </div>
              <NavLink to="/profile" onClick={onClose} className="btn btn-secondary" style={{ textAlign: 'center', minHeight: 48 }}>
                Profile
              </NavLink>
              {isAdmin && (
                <NavLink to="/admin" onClick={onClose} className="btn btn-secondary" style={{ textAlign: 'center', minHeight: 48 }}>
                  Admin
                </NavLink>
              )}
              <button onClick={onSignOut} className="btn-danger" style={{ padding: '14px 22px', borderRadius: 10, minHeight: 48 }}>
                Log out
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export default Navbar
