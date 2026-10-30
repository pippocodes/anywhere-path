import { useEffect, useState } from 'react'
import { fetchActiveAnnouncement } from '../../lib/adminApi'
import { MegaphoneIcon } from './icons'
import type { Announcement } from '../../types/admin'

/** The one active announcement (if any), shown at the top of the feed. Silently shows nothing on a fetch failure or when there's nothing active — this is a nice-to-have banner, not something worth an error state of its own. */
function AnnouncementBanner() {
  const [announcement, setAnnouncement] = useState<Announcement | null>(null)

  useEffect(() => {
    let cancelled = false
    fetchActiveAnnouncement()
      .then((a) => {
        if (!cancelled) setAnnouncement(a)
      })
      .catch(() => {
        // ignore — just don't show a banner
      })
    return () => {
      cancelled = true
    }
  }, [])

  if (!announcement) return null

  return (
    <div
      className="card"
      style={{
        padding: '12px 16px',
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        border: '1px solid var(--gold)',
      }}
    >
      <span style={{ color: 'var(--gold)', display: 'flex', flexShrink: 0 }}>
        <MegaphoneIcon size={16} />
      </span>
      <p style={{ fontSize: 13.5, color: 'var(--cream)', margin: 0 }}>{announcement.body}</p>
    </div>
  )
}

export default AnnouncementBanner
