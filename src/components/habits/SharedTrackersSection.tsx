import { useNavigate } from 'react-router-dom'
import type { UseSharedItemsResult } from '../../hooks/useSharedItems'
import SharedItemCard from '../friends/SharedItemCard'
import EmptyState from '../ui/EmptyState'

interface Props {
  currentUserId: string
  hasFriends: boolean
  sharedState: UseSharedItemsResult
  onOpenShare: (friendId: string | null) => void
}

/** The compact "Shared trackers" section — moved here from the Friends page (Step 2). Each card shows every participant's tri-state for today, a shared streak, and a cheer button; see SharedItemCard. */
function SharedTrackersSection({ currentUserId, hasFriends, sharedState, onOpenShare }: Props) {
  const navigate = useNavigate()

  return (
    <div id="shared-trackers" style={{ marginTop: 8, scrollMarginTop: 90 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14, flexWrap: 'wrap', gap: 10 }}>
        <h2 style={{ fontSize: 18 }}>Shared trackers</h2>
        {sharedState.items.length > 0 && (
          <button type="button" className="btn" onClick={() => onOpenShare(null)}>
            Share a habit
          </button>
        )}
      </div>

      {sharedState.items.length === 0 ? (
        <EmptyState
          title="Nothing shared yet"
          description="Share a habit with a friend to track it together."
          actionLabel={hasFriends ? 'Share a habit' : 'Add a friend first'}
          onAction={() => (hasFriends ? onOpenShare(null) : navigate('/friends'))}
        />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {sharedState.items.map((detail) => (
            <SharedItemCard
              key={detail.item.id}
              detail={detail}
              currentUserId={currentUserId}
              onSetMyState={sharedState.setMyState}
              onCheer={sharedState.sendCheerTo}
              onAcceptInvite={sharedState.acceptInvite}
              onDeclineInvite={sharedState.declineInvite}
              onLeave={sharedState.leave}
              onRemoveMember={sharedState.removeMember}
              onDelete={sharedState.deleteItem}
            />
          ))}
        </div>
      )}
    </div>
  )
}

export default SharedTrackersSection
