import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { useFriends } from '../hooks/useFriends'
import FriendSearch from '../components/friends/FriendSearch'
import FriendRequestsPanel from '../components/friends/FriendRequestsPanel'
import FriendsList from '../components/friends/FriendsList'
import PeopleYouCanAdd from '../components/friends/PeopleYouCanAdd'
import Feed from '../components/community/Feed'
import RevealHeading from '../components/ui/RevealHeading'
import Pills from '../components/ui/Pills'

type CommunityTab = 'friends' | 'feed'

const TAB_OPTIONS = [
  { value: 'friends', label: 'Friends' },
  { value: 'feed', label: 'Feed' },
]

function Friends() {
  const { user } = useAuth()
  const friendsState = useFriends()
  const [tab, setTab] = useState<CommunityTab>('friends')

  if (!user) return null

  const knownUserIds = new Set([
    ...friendsState.friends.map((f) => f.otherUserId),
    ...friendsState.incomingRequests.map((f) => f.otherUserId),
    ...friendsState.outgoingRequests.map((f) => f.otherUserId),
    ...friendsState.blocked.map((f) => f.otherUserId),
  ])

  return (
    <div className="page" style={{ maxWidth: 760 }}>
      <RevealHeading as="h1" className="page-title">
        {tab === 'friends' ? 'Friends' : 'Feed'}
      </RevealHeading>
      <p className="page-subtitle" style={{ marginBottom: 20 }}>
        {tab === 'friends'
          ? "Add friends by username — share a habit together from the Habit Tracker once you're connected."
          : 'Share an update, cheer on a friend, or see what the community is up to.'}
      </p>

      <div style={{ marginBottom: 20 }}>
        <Pills options={TAB_OPTIONS} value={tab} onChange={(v) => setTab(v as CommunityTab)} layoutId="community-tab" />
      </div>

      {tab === 'feed' ? (
        <Feed />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <FriendSearch knownUserIds={knownUserIds} onAdd={friendsState.sendRequest} />

          <FriendRequestsPanel
            incoming={friendsState.incomingRequests}
            outgoing={friendsState.outgoingRequests}
            onAccept={friendsState.accept}
            onDecline={friendsState.decline}
            onCancel={friendsState.cancel}
          />

          <PeopleYouCanAdd onAdd={friendsState.sendRequest} />

          <FriendsList friends={friendsState.friends} onRemove={friendsState.remove} onBlock={friendsState.block} />

          {friendsState.blocked.length > 0 && (
            <div className="card" style={{ padding: '18px 20px' }}>
              <div className="micro-label" style={{ marginBottom: 10 }}>
                Blocked ({friendsState.blocked.length})
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {friendsState.blocked.map((e) => (
                  <div key={e.friendship.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
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
        </div>
      )}
    </div>
  )
}

export default Friends
