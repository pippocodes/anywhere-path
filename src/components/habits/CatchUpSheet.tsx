import { useNavigate } from 'react-router-dom'
import Modal from '../ui/Modal'
import type { TodayItem } from '../../hooks/useTodayItems'

interface Props {
  open: boolean
  items: TodayItem[]
  welcomeBack?: boolean
  onClose: () => void
}

const KIND_LABEL: Record<TodayItem['kind'], string> = {
  habit: 'Habit',
  planStep: 'Plan step',
  courseTopic: 'Course lesson',
  roadmapStep: 'Roadmap step',
  sharedItem: 'Shared tracker',
}

/** Once-a-day "here's what's still pending today" nudge — a bottom sheet on phones (automatic via Modal's variant="sheet"), a centered-feeling side sheet on desktop. Purely in-app; no push, no service worker. */
function CatchUpSheet({ open, items, welcomeBack, onClose }: Props) {
  const navigate = useNavigate()

  function goTo(href: string) {
    onClose()
    navigate(href)
  }

  const title = welcomeBack
    ? 'Welcome back. Your bad days still count.'
    : `You still have ${items.length} ${items.length === 1 ? 'thing' : 'things'} today`

  return (
    <Modal open={open} onClose={onClose} variant="sheet" title={title}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 20, maxHeight: '45vh', overflowY: 'auto' }}>
        {items.map((item) => (
          <button
            key={`${item.kind}-${item.id}`}
            type="button"
            onClick={() => goTo(item.href)}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'flex-start',
              gap: 2,
              padding: '10px 12px',
              borderRadius: 10,
              border: '1px solid var(--line)',
              background: 'none',
              textAlign: 'left',
            }}
          >
            <span style={{ fontSize: 10.5, color: 'var(--mute)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.3 }}>
              {KIND_LABEL[item.kind]}
            </span>
            <span style={{ fontSize: 14, fontWeight: 600 }}>{item.title}</span>
          </button>
        ))}
      </div>

      <div style={{ display: 'flex', gap: 10 }}>
        <button type="button" className="btn" style={{ flex: 1 }} onClick={() => goTo(items[0]?.href ?? '/')}>
          Take me there
        </button>
        <button type="button" className="btn-outline" style={{ flex: 1 }} onClick={onClose}>
          Later
        </button>
      </div>
    </Modal>
  )
}

export default CatchUpSheet
