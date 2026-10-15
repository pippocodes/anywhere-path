import { useCallback, useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import {
  fetchFriendEntries,
  sendFriendRequest,
  respondToFriendRequest,
  deleteFriendship,
  blockFriendship,
  subscribeToFriendships,
  getErrorMessage,
} from '../lib/friendsApi'
import type { FriendEntry } from '../types/friends'

export interface UseFriendsResult {
  loading: boolean
  error: string | null
  friends: FriendEntry[] // accepted
  incomingRequests: FriendEntry[] // pending, addressed to me
  outgoingRequests: FriendEntry[] // pending, sent by me
  blocked: FriendEntry[]
  sendRequest: (addresseeId: string) => Promise<void>
  accept: (friendshipId: string) => Promise<void>
  decline: (friendshipId: string) => Promise<void>
  cancel: (friendshipId: string) => Promise<void>
  remove: (friendshipId: string) => Promise<void>
  block: (friendshipId: string) => Promise<void>
  unblock: (friendshipId: string) => Promise<void>
  refresh: () => void
}

/** Every friend-relationship the signed-in user is party to, kept live via Realtime. */
export function useFriends(): UseFriendsResult {
  const { user } = useAuth()
  const [entries, setEntries] = useState<FriendEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [nonce, setNonce] = useState(0)

  const refresh = useCallback(() => setNonce((n) => n + 1), [])

  useEffect(() => {
    if (!user) {
      setEntries([])
      setLoading(false)
      return
    }
    let cancelled = false
    setLoading(true)
    fetchFriendEntries(user.id)
      .then((data) => {
        if (!cancelled) {
          setEntries(data)
          setError(null)
        }
      })
      .catch((err) => {
        if (!cancelled) setError(getErrorMessage(err, 'Could not load friends.'))
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [user, nonce])

  useEffect(() => {
    if (!user) return
    return subscribeToFriendships(user.id, refresh)
  }, [user, refresh])

  const friends = entries.filter((e) => e.friendship.status === 'accepted')
  const incomingRequests = entries.filter((e) => e.friendship.status === 'pending' && e.direction === 'incoming')
  const outgoingRequests = entries.filter((e) => e.friendship.status === 'pending' && e.direction === 'outgoing')
  const blocked = entries.filter((e) => e.friendship.status === 'blocked')

  async function sendRequest(addresseeId: string) {
    if (!user) return
    await sendFriendRequest(user.id, addresseeId)
    refresh()
  }
  async function accept(friendshipId: string) {
    await respondToFriendRequest(friendshipId, true)
    refresh()
  }
  async function decline(friendshipId: string) {
    await respondToFriendRequest(friendshipId, false)
    refresh()
  }
  async function cancel(friendshipId: string) {
    await deleteFriendship(friendshipId)
    refresh()
  }
  async function remove(friendshipId: string) {
    await deleteFriendship(friendshipId)
    refresh()
  }
  async function block(friendshipId: string) {
    await blockFriendship(friendshipId)
    refresh()
  }
  async function unblock(friendshipId: string) {
    await deleteFriendship(friendshipId)
    refresh()
  }

  return {
    loading,
    error,
    friends,
    incomingRequests,
    outgoingRequests,
    blocked,
    sendRequest,
    accept,
    decline,
    cancel,
    remove,
    block,
    unblock,
    refresh,
  }
}
