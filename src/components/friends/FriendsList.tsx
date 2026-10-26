import { useState } from 'react'
import { Link } from 'react-router-dom'
import type { FriendEntry } from '../../types/friends'
import Avatar from '../ui/Avatar'

interface Props {
  friends: FriendEntry[]
  onRemove: (friendshipId: string) => void
  onBlock: (friendshipId: string) => void
}

type Confirming = { id: string; action: 'remove' | 'block' } | null

/** Accepted friends as rows in one full-width card (matching FriendSearch), each with avatar + @username and Remove/Block — both confirmed before firing. Sharing now happens from the Habit Tracker page (Step 2), not here. */
function FriendsList({ friends, onRemove, onBlock }: Props) {
  const [confirming, setConfirming] = useState<Confirming>(null)

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
      <div className="card" style={{ padding: '18px 20px' }}>
        {friends.map((e, i) => (
          <div
            key={e.friendship.id}
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: 8,
              padding: '10px 4px',
              borderBottom: i < friends.length - 1 ? '1px solid var(--line)' : 'none',
            }}
          >
            <Link
              to={`/friends/${e.otherUsername}`}
              style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0, color: 'inherit' }}
            >
              <Avatar label={e.otherUsername} size={40} colorIndex={i} />
              <span style={{ fontSize: 14, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                @{e.otherUsername}
              </span>
            </Link>

            {confirming?.id === e.friendship.id ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                <span style={{ fontSize: 11.5, color: 'var(--mute)' }}>
                  {confirming.action === 'remove' ? 'Remove this friend?' : 'Block this friend?'}
                </span>
                <button
                  type="button"
                  className="btn-outline"
                  style={{ color: 'var(--danger)', fontSize: 11.5 }}
                  onClick={() => {
                    if (confirming.action === 'remove') onRemove(e.friendship.id)
                    else onBlock(e.friendship.id)
                    setConfirming(null)
                  }}
                >
                  {confirming.action === 'remove' ? 'Yes, remove' : 'Yes, block'}
                </button>
                <button type="button" className="btn-outline" style={{ fontSize: 11.5 }} onClick={() => setConfirming(null)}>
                  Cancel
                </button>
              </div>
            ) : (
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <button type="button" className="btn-outline" style={{ fontSize: 12 }} onClick={() => setConfirming({ id: e.friendship.id, action: 'remove' })}>
                  Remove
                </button>
                <button
                  type="button"
                  className="btn-outline"
                  style={{ fontSize: 12, opacity: 0.75 }}
                  onClick={() => setConfirming({ id: e.friendship.id, action: 'block' })}
                >
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
