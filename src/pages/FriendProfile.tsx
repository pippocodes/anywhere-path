import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useFriends } from '../hooks/useFriends'
import { useSharedItems } from '../hooks/useSharedItems'
import { useIsPhone } from '../hooks/useIsPhone'
import { fetchFriendProfile, getErrorMessage } from '../lib/friendsApi'
import { monthTogetherPercent } from '../utils/sharedTracking'
import type { FriendProfile as FriendProfileData } from '../types/friends'
import Card from '../components/ui/Card'
import Avatar from '../components/ui/Avatar'
import Skeleton from '../components/ui/Skeleton'
import NotFound from './NotFound'

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })
}

/**
 * /friends/:username — avatar, @username, member since, About, and shared
 * trackers in common. Backed by get_friend_profile() (schema.sql), which
 * enforces visibility (owner, public, or accepted friend) and never
 * selects email server-side — a null result here means "not visible",
 * deliberately indistinguishable from "doesn't exist".
 */
function FriendProfile() {
  const { username } = useParams<{ username: string }>()
  const navigate = useNavigate()
  const isPhone = useIsPhone()
  const { user } = useAuth()
  const friendsState = useFriends()
  const sharedState = useSharedItems()

  const [profile, setProfile] = useState<FriendProfileData | null>(null)
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [confirming, setConfirming] = useState<'remove' | 'block' | null>(null)

  useEffect(() => {
    if (!username) return
    let cancelled = false
    setLoading(true)
    fetchFriendProfile(username)
      .then((data) => {
        if (!cancelled) {
          setProfile(data)
          setLoadError(null)
        }
      })
      .catch((err) => {
        if (!cancelled) setLoadError(getErrorMessage(err, 'Could not load this profile.'))
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [username])

  const friendEntry = useMemo(
    () => (profile ? friendsState.friends.find((f) => f.otherUserId === profile.id) : undefined),
    [friendsState.friends, profile]
  )

  const now = useMemo(() => new Date(), [])
  // Shared items where BOTH the viewer and this profile are the owner or
  // an accepted member — there's no per-item "who I share it with" filter
  // server-side, so this is computed from the same bundle the Habit
  // Tracker's own Shared trackers section already fetches.
  const togetherItems = useMemo(() => {
    if (!profile || !user) return []
    return sharedState.items
      .filter((d) => d.myStatus !== 'invited')
      .map((d) => {
        const participantIds = [d.item.ownerId, ...d.members.filter((m) => m.status === 'accepted').map((m) => m.userId)]
        return { d, participantIds }
      })
      .filter(({ participantIds }) => participantIds.includes(profile.id) && participantIds.includes(user.id))
      .map(({ d, participantIds }) => ({
        detail: d,
        percent: monthTogetherPercent(d.logs, participantIds, now.getMonth(), now.getFullYear()),
      }))
  }, [sharedState.items, profile, user, now])

  function openShareWithFriend() {
    if (!profile) return
    navigate('/habits', { state: { shareWithFriendId: profile.id } })
  }

  if (loading) {
    return (
      <div className="page" style={{ maxWidth: 640 }}>
        <Skeleton width={120} height={20} style={{ marginBottom: 24 }} />
        <Skeleton height={140} />
      </div>
    )
  }

  if (loadError || !profile) return <NotFound />

  return (
    <div className="page" style={{ maxWidth: 640 }}>
      {isPhone && (
        <button
          type="button"
          className="btn-outline"
          style={{ marginBottom: 16 }}
          onClick={() => navigate('/friends')}
          aria-label="Back to Friends"
        >
          ← Back
        </button>
      )}

      <Card>
        <div style={{ display: 'flex', alignItems: 'center', gap: 18, marginBottom: 18 }}>
          <Avatar label={profile.username} size={64} />
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 21, fontFamily: 'var(--font-display)', fontStyle: 'italic', fontWeight: 600 }}>
              @{profile.username}
            </div>
            <div style={{ fontSize: 12.5, color: 'var(--mute)' }}>Member since {formatDate(profile.createdAt)}</div>
          </div>
        </div>
        <p style={{ fontSize: 13.5, color: profile.about ? 'var(--cream)' : 'var(--mute)', margin: 0 }}>
          {profile.about || 'No about yet'}
        </p>
      </Card>

      <div style={{ marginTop: 24 }}>
        <div className="micro-label" style={{ marginBottom: 10 }}>
          Tracking together
        </div>
        {togetherItems.length === 0 ? (
          <div className="card" style={{ padding: '18px 20px' }}>
            <p style={{ fontSize: 13, color: 'var(--mute)', marginBottom: 14 }}>
              You're not tracking anything with @{profile.username} yet
            </p>
            <button type="button" className="btn" onClick={openShareWithFriend}>
              Share a tracker
            </button>
          </div>
        ) : (
          <div className="card" style={{ padding: '4px 20px' }}>
            {togetherItems.map(({ detail, percent }, i) => (
              <button
                key={detail.item.id}
                type="button"
                onClick={() => navigate('/habits#shared-trackers')}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  width: '100%',
                  background: 'none',
                  border: 'none',
                  padding: '14px 0',
                  borderBottom: i < togetherItems.length - 1 ? '1px solid var(--line)' : 'none',
                  cursor: 'pointer',
                  textAlign: 'left',
                  color: 'inherit',
                  font: 'inherit',
                }}
              >
                <span style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
                  <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--accent)', flexShrink: 0 }} />
                  <span style={{ fontSize: 13.5, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {detail.item.title}
                  </span>
                </span>
                <span style={{ fontSize: 12.5, color: 'var(--mute)', flexShrink: 0 }}>{percent}% this month</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {friendEntry && (
        <div style={{ marginTop: 24, display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          {confirming ? (
            <>
              <span style={{ fontSize: 12, color: 'var(--mute)' }}>
                {confirming === 'remove' ? 'Remove this friend?' : 'Block this friend?'}
              </span>
              <button
                type="button"
                className="btn-outline"
                style={{ color: 'var(--danger)', fontSize: 12.5 }}
                onClick={() => {
                  if (confirming === 'remove') friendsState.remove(friendEntry.friendship.id)
                  else friendsState.block(friendEntry.friendship.id)
                  setConfirming(null)
                  navigate('/friends')
                }}
              >
                {confirming === 'remove' ? 'Yes, remove' : 'Yes, block'}
              </button>
              <button type="button" className="btn-outline" style={{ fontSize: 12.5 }} onClick={() => setConfirming(null)}>
                Cancel
              </button>
            </>
          ) : (
            <>
              <button type="button" className="btn-outline" style={{ fontSize: 12.5 }} onClick={() => setConfirming('remove')}>
                Remove
              </button>
              <button
                type="button"
                className="btn-outline"
                style={{ fontSize: 12.5, opacity: 0.75 }}
                onClick={() => setConfirming('block')}
              >
                Block
              </button>
            </>
          )}
        </div>
      )}
    </div>
  )
}

export default FriendProfile
