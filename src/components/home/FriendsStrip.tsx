import { useNavigate } from 'react-router-dom'
import { computeSharedStreak, stateFor } from '../../utils/sharedTracking'
import TriDot from './TriDot'
import type { SharedItemWithDetail } from '../../types/friends'

interface Props {
  items: SharedItemWithDetail[]
  today: string
}

/** A quiet horizontal strip, one chip per shared tracker the user's actually part of — participant dots for today plus the shared streak, both in the house tri-state/no-gold language. Renders nothing when there's nothing shared yet. */
function FriendsStrip({ items, today }: Props) {
  const navigate = useNavigate()
  const visible = items.filter((d) => d.myStatus === 'owner' || d.myStatus === 'accepted')

  if (visible.length === 0) return null

  return (
    <div>
      <div className="micro-label" style={{ color: 'var(--mute)', marginBottom: 12 }}>
        Shared with friends
      </div>
      <div style={{ display: 'flex', gap: 12, overflowX: 'auto', paddingBottom: 4 }}>
        {visible.map((detail) => {
          const participants = [
            { userId: detail.item.ownerId, username: detail.ownerUsername },
            ...detail.members.filter((m) => m.status === 'accepted').map((m) => ({ userId: m.userId, username: m.username })),
          ]
          const streak = computeSharedStreak(detail.logs, participants.map((p) => p.userId))
          return (
            <button
              key={detail.item.id}
              type="button"
              onClick={() => navigate('/habits#shared-trackers')}
              className="card"
              style={{ flexShrink: 0, minWidth: 180, padding: '14px 16px', textAlign: 'left', cursor: 'pointer' }}
            >
              <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--cream)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {detail.item.title}
              </div>
              <div style={{ display: 'flex', gap: 6, marginTop: 10 }}>
                {participants.map((p) => (
                  <TriDot key={p.userId} mark={stateFor(detail.logs, p.userId, today)} size={14} label={p.username} />
                ))}
              </div>
              {streak > 0 && (
                <div style={{ fontSize: 11, color: 'var(--mute)', marginTop: 8 }}>{streak} day streak</div>
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}

export default FriendsStrip
