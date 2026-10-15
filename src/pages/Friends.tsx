import { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { useApp } from '../hooks/useApp'
import { useFriends } from '../hooks/useFriends'
import { useSharedItems } from '../hooks/useSharedItems'
import { useToast } from '../components/ui/Toast'
import FriendSearch from '../components/friends/FriendSearch'
import FriendRequestsPanel from '../components/friends/FriendRequestsPanel'
import FriendsList from '../components/friends/FriendsList'
import ShareItemModal from '../components/friends/ShareItemModal'
import SharedItemCard from '../components/friends/SharedItemCard'
import EmptyState from '../components/ui/EmptyState'
import RevealHeading from '../components/ui/RevealHeading'

function Friends() {
  const { user } = useAuth()
  const { data } = useApp()
  const { show: showToast } = useToast()
  const friendsState = useFriends()
  const sharedState = useSharedItems()

  const [shareOpen, setShareOpen] = useState(false)
  const [preselectedFriendId, setPreselectedFriendId] = useState<string | null>(null)

  useEffect(() => {
    if (!sharedState.cheer) return
    showToast(`✦ ${sharedState.cheer.fromUsername} cheered you on!`, 'success')
    sharedState.dismissCheer()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sharedState.cheer])

  if (!user) return null

  const knownUserIds = new Set([
    ...friendsState.friends.map((f) => f.otherUserId),
    ...friendsState.incomingRequests.map((f) => f.otherUserId),
    ...friendsState.outgoingRequests.map((f) => f.otherUserId),
    ...friendsState.blocked.map((f) => f.otherUserId),
  ])

  const ownedSharedItemCount = sharedState.items.filter((i) => i.isOwner).length

  function openShare(friendId: string | null) {
    setPreselectedFriendId(friendId)
    setShareOpen(true)
  }

  return (
    <div className="page" style={{ maxWidth: 760 }}>
      <RevealHeading as="h1" className="page-title">
        Friends
      </RevealHeading>
      <p className="page-subtitle" style={{ marginBottom: 28 }}>
        Add friends by username and share a habit or course to track it together.
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        <FriendSearch knownUserIds={knownUserIds} onAdd={friendsState.sendRequest} />

        <FriendRequestsPanel
          incoming={friendsState.incomingRequests}
          outgoing={friendsState.outgoingRequests}
          onAccept={friendsState.accept}
          onDecline={friendsState.decline}
          onCancel={friendsState.cancel}
        />

        <FriendsList
          friends={friendsState.friends}
          onRemove={friendsState.remove}
          onBlock={friendsState.block}
          onShare={(friendId) => openShare(friendId)}
        />

        {friendsState.blocked.length > 0 && (
          <div className="card" style={{ padding: '18px 20px' }}>
            <div className="micro-label" style={{ marginBottom: 10 }}>
              Blocked ({friendsState.blocked.length})
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {friendsState.blocked.map((e) => (
                <div key={e.friendship.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: 13.5 }}>{e.otherUsername}</span>
                  {e.friendship.blockedBy === user.id ? (
                    <button type="button" className="btn-outline" style={{ fontSize: 12 }} onClick={() => friendsState.unblock(e.friendship.id)}>
                      Unblock
                    </button>
                  ) : (
                    <span style={{ fontSize: 11.5, color: 'var(--mute)' }}>Blocked you</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        <div style={{ marginTop: 12 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <h2 style={{ fontSize: 18 }}>Shared tracking</h2>
            {friendsState.friends.length > 0 && (
              <button type="button" className="btn" onClick={() => openShare(null)}>
                Share something
              </button>
            )}
          </div>

          {sharedState.items.length === 0 ? (
            <EmptyState
              title="Nothing shared yet"
              description="Share a habit or course with a friend and track it together — ticks, streaks, and a cheer button."
              actionLabel="Share something"
              onAction={() => openShare(null)}
            />
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {sharedState.items.map((detail) => (
                <SharedItemCard
                  key={detail.item.id}
                  detail={detail}
                  currentUserId={user.id}
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
      </div>

      <ShareItemModal
        open={shareOpen}
        onClose={() => setShareOpen(false)}
        courses={data.courses}
        habits={data.habits}
        friends={friendsState.friends}
        preselectedFriendId={preselectedFriendId}
        ownedSharedItemCount={ownedSharedItemCount}
        onShare={sharedState.share}
      />
    </div>
  )
}

export default Friends
