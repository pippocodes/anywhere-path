import { useState } from 'react'
import type { FriendEntry } from '../../types/friends'

interface Props {
  friends: FriendEntry[]
  onRemove: (friendshipId: string) => void
  onBlock: (friendshipId: string) => void
  onShare: (friendId: string, friendUsername: string) => void
}

/** Accepted friends, each with Share/Remove/Block actions. */
function FriendsList({ friends, onRemove, onBlock, onShare }: Props) {
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
    <div className="card" style={{ padding: '18px 20px' }}>
      <div className="micro-label" style={{ marginBottom: 10 }}>
        Friends ({friends.length})
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {friends.map((e) => (
          <div key={e.friendship.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 13.5, fontWeight: 600 }}>{e.otherUsername}</span>
            {confirmingId === e.friendship.id ? (
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <span style={{ fontSize: 11.5, color: 'var(--mute)' }}>Remove this friend?</span>
                <button
                  type="button"
                  className="btn-outline"
                  style={{ color: 'var(--rose)', fontSize: 11.5 }}
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
            ) : (
              <div style={{ display: 'flex', gap: 8 }}>
                <button type="button" className="btn-outline" style={{ fontSize: 12 }} onClick={() => onShare(e.otherUserId, e.otherUsername)}>
                  Share…
                </button>
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
