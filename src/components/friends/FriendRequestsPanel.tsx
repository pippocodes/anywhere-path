import type { FriendEntry } from '../../types/friends'
import Avatar from '../ui/Avatar'

interface Props {
  incoming: FriendEntry[]
  outgoing: FriendEntry[]
  onAccept: (friendshipId: string) => void
  onDecline: (friendshipId: string) => void
  onCancel: (friendshipId: string) => void
}

/** Pending friend requests, split into received (accept/decline) and sent (cancel). */
function FriendRequestsPanel({ incoming, outgoing, onAccept, onDecline, onCancel }: Props) {
  if (incoming.length === 0 && outgoing.length === 0) return null

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      {incoming.length > 0 && (
        <div className="card" style={{ padding: '18px 20px' }}>
          <div className="micro-label" style={{ marginBottom: 10 }}>
            Requests received ({incoming.length})
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {incoming.map((e, i) => (
              <div key={e.friendship.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8, padding: '10px 4px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <Avatar label={e.otherUsername} size={36} colorIndex={i} />
                  <span style={{ fontSize: 13.5, fontWeight: 600 }}>{e.otherUsername}</span>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button type="button" className="btn" style={{ padding: '6px 14px', fontSize: 12 }} onClick={() => onAccept(e.friendship.id)}>
                    Accept
                  </button>
                  <button type="button" className="btn-outline" style={{ fontSize: 12 }} onClick={() => onDecline(e.friendship.id)}>
                    Decline
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {outgoing.length > 0 && (
        <div className="card" style={{ padding: '18px 20px' }}>
          <div className="micro-label" style={{ marginBottom: 10 }}>
            Requests sent ({outgoing.length})
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {outgoing.map((e, i) => (
              <div key={e.friendship.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8, padding: '10px 4px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <Avatar label={e.otherUsername} size={36} colorIndex={i} />
                  <span style={{ fontSize: 13.5, fontWeight: 600 }}>{e.otherUsername}</span>
                </div>
                <button type="button" className="btn-outline" style={{ fontSize: 12 }} onClick={() => onCancel(e.friendship.id)}>
                  Cancel
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default FriendRequestsPanel
