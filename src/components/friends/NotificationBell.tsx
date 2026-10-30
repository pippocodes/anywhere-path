import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { useFriends } from '../../hooks/useFriends'
import { useSharedItems } from '../../hooks/useSharedItems'
import { useTodayItems } from '../../hooks/useTodayItems'

/**
 * Bell icon with a live badge for incoming friend requests, share invites,
 * and now "Today" reminders (habits/plan steps/course topics/roadmap steps/
 * shared trackers due today, computed from data already loaded — see
 * useTodayItems). Kept as one bell with distinct sections rather than a
 * second icon or a banner: the phone top bar only has room for one bell,
 * and friend requests (social invites) and Today items (personal reminders)
 * read as different categories even sharing one panel.
 */
function NotificationBell() {
  const { incomingRequests, accept, decline } = useFriends()
  const { items, acceptInvite, declineInvite } = useSharedItems()
  const todayItems = useTodayItems()
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)

  const invites = items.filter((i) => i.myStatus === 'invited')
  const count = incomingRequests.length + invites.length + todayItems.length

  function handleTodayItemClick(href: string) {
    setOpen(false)
    navigate(href)
  }

  function handleAcceptInvite(sharedItemId: string) {
    acceptInvite(sharedItemId)
    setOpen(false)
    navigate('/habits#shared-trackers')
  }

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  return (
    <div ref={rootRef} style={{ position: 'relative' }}>
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label={`Notifications${count > 0 ? ` (${count} unread)` : ''}`}
        aria-expanded={open}
        style={{
          position: 'relative',
          width: 36,
          height: 36,
          borderRadius: '50%',
          background: 'none',
          border: '1px solid var(--line)',
          color: 'var(--cream)',
          fontSize: 15,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
          <path d="M13.73 21a2 2 0 0 1-3.46 0" />
        </svg>
        {count > 0 && (
          <span
            style={{
              position: 'absolute',
              top: -4,
              right: -4,
              minWidth: 16,
              height: 16,
              padding: '0 4px',
              borderRadius: 999,
              background: 'var(--rose)',
              color: 'var(--ink)',
              fontSize: 10,
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {count}
          </span>
        )}
      </button>

      <AnimatePresence>
        {open && (
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
              width: 'min(300px, calc(100vw - 32px))',
              maxHeight: 360,
              overflowY: 'auto',
              background: 'var(--ink-2)',
              border: '1px solid var(--line)',
              borderRadius: 12,
              padding: 10,
              boxShadow: '0 20px 50px var(--shadow)',
              zIndex: 60,
            }}
          >
            {count === 0 ? (
              <p style={{ fontSize: 12.5, color: 'var(--mute)', padding: '10px 6px', margin: 0 }}>Nothing new.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {incomingRequests.map((e) => (
                  <div key={e.friendship.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '4px 6px' }}>
                    <span style={{ fontSize: 13, fontWeight: 600 }}>{e.otherUsername} wants to be friends</span>
                    <div style={{ display: 'flex', gap: 6, flexShrink: 0, marginLeft: 8 }}>
                      <button className="btn-outline" style={{ fontSize: 10.5, padding: '3px 8px' }} onClick={() => accept(e.friendship.id)}>
                        Accept
                      </button>
                      <button className="btn-outline" style={{ fontSize: 10.5, padding: '3px 8px' }} onClick={() => decline(e.friendship.id)}>
                        Decline
                      </button>
                    </div>
                  </div>
                ))}
                {invites.map((i) => (
                  <div key={i.item.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '4px 6px' }}>
                    <span style={{ fontSize: 13, fontWeight: 600 }}>
                      {i.ownerUsername} shared "{i.item.title}"
                    </span>
                    <div style={{ display: 'flex', gap: 6, flexShrink: 0, marginLeft: 8 }}>
                      <button className="btn-outline" style={{ fontSize: 10.5, padding: '3px 8px' }} onClick={() => handleAcceptInvite(i.item.id)}>
                        Accept
                      </button>
                      <button className="btn-outline" style={{ fontSize: 10.5, padding: '3px 8px' }} onClick={() => declineInvite(i.item.id)}>
                        Decline
                      </button>
                    </div>
                  </div>
                ))}
                {todayItems.length > 0 && (
                  <div style={{ borderTop: '1px solid var(--line)', paddingTop: 10, marginTop: (incomingRequests.length + invites.length) > 0 ? 2 : 0 }}>
                    <div style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: 0.4, textTransform: 'uppercase', color: 'var(--mute)', padding: '0 6px 6px' }}>
                      Today
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                      {todayItems.map((t) => (
                        <button
                          key={t.id}
                          onClick={() => handleTodayItemClick(t.href)}
                          style={{
                            display: 'block',
                            width: '100%',
                            textAlign: 'left',
                            background: 'none',
                            border: 'none',
                            padding: '6px 6px',
                            borderRadius: 8,
                            fontSize: 13,
                            fontWeight: 600,
                            color: 'var(--cream)',
                          }}
                        >
                          {t.title}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
            <button
              className="btn-outline"
              style={{ width: '100%', marginTop: 10, fontSize: 12 }}
              onClick={() => {
                setOpen(false)
                navigate('/community')
              }}
            >
              View Friends
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default NotificationBell
