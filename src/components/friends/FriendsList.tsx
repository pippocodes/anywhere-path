import { useState } from 'react'
import type { FriendEntry } from '../../types/friends'
import Avatar from '../ui/Avatar'

interface Props {
  friends: FriendEntry[]
  onRemove: (friendshipId: string) => void
  onBlock: (friendshipId: string) => void
}

/** Accepted friends as a grid of small profile cards — avatar initial, username, Remove/Block. Sharing now happens from the Habit Tracker page (Step 2), not here. */
function FriendsList({ friends, onRemove, onBlock }: Props) {
  const [confirmingId, setConfirmingId] = useState<string | null>(null)

  if (friends.length === 0) {
    return (
      <div className="card" style={{ padding: '18px 20px' }}>
        <p style={{ fontSize: 13, color: 'var(--mute)', margin: 0 }}>
          No friends yet — search for a username above to send your first request.
        </p>
      </div>
    )
  }

  return (
    <div>
      <div className="micro-label" style={{ marginBottom: 10 }}>
        Friends ({friends.length})
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 280px))', gap: 12 }}>
        {friends.map((e, i) => (
          <div key={e.friendship.id} className="card" style={{ padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <Avatar label={e.otherUsername} size={40} colorIndex={i} />
              <span style={{ fontSize: 14, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {e.otherUsername}
              </span>
            </div>

            {confirmingId === e.friendship.id ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <span style={{ fontSize: 11.5, color: 'var(--mute)' }}>Remove this friend?</span>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button
                    type="button"
                    className="btn-outline"
                    style={{ color: 'var(--danger)', fontSize: 11.5 }}
                    onClick={() => {
                      onRemove(e.friendship.id)
                      setConfirmingId(null)
                    }}
                  >
                    Yes, remove
                  </button>
                  <button type="button" className="btn-outline" style={{ fontSize: 11.5 }} onClick={() => setConfirmingId(null)}>
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <button type="button" className="btn-outline" style={{ fontSize: 12 }} onClick={() => setConfirmingId(e.friendship.id)}>
                  Remove
                </button>
                <button type="button" className="btn-outline" style={{ fontSize: 12, opacity: 0.75 }} onClick={() => onBlock(e.friendship.id)}>
                  Block
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

export default FriendsList
