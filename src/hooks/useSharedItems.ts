import { useCallback, useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import {
  fetchSharedItemsBundle,
  createSharedItem,
  respondToShareInvite,
  leaveSharedItem,
  removeSharedMember,
  deleteSharedItem,
  setSharedLogState,
  subscribeToSharedItems,
  sendCheer as sendCheerApi,
  isFreePlanLimitError,
  getErrorMessage,
} from '../lib/friendsApi'
import type { SharedItemType, SharedItemWithDetail } from '../types/friends'
import type { HabitMark } from '../types'

export interface CheerEvent {
  fromUsername: string
  toUserId: string
  sharedItemId: string
}

export interface UseSharedItemsResult {
  loading: boolean
  error: string | null
  items: SharedItemWithDetail[]
  cheer: CheerEvent | null
  dismissCheer: () => void
  share: (itemType: SharedItemType, itemId: string, title: string, memberIds: string[]) => Promise<'ok' | 'limit'>
  acceptInvite: (sharedItemId: string) => Promise<void>
  declineInvite: (sharedItemId: string) => Promise<void>
  leave: (sharedItemId: string) => Promise<void>
  removeMember: (sharedItemId: string, userId: string) => Promise<void>
  deleteItem: (sharedItemId: string) => Promise<void>
  setMyState: (sharedItemId: string, date: string, state: HabitMark) => Promise<void>
  sendCheerTo: (sharedItemId: string, toUserId: string) => Promise<void>
  refresh: () => void
}

/** Every shared item the signed-in user owns or belongs to, with members + logs, kept live via Realtime. */
export function useSharedItems(): UseSharedItemsResult {
  const { user, username } = useAuth()
  const [items, setItems] = useState<SharedItemWithDetail[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [nonce, setNonce] = useState(0)
  const [cheer, setCheer] = useState<CheerEvent | null>(null)

  const refresh = useCallback(() => setNonce((n) => n + 1), [])

  useEffect(() => {
    if (!user) {
      setItems([])
      setLoading(false)
      return
    }
    let cancelled = false
    setLoading(true)
    fetchSharedItemsBundle(user.id)
      .then((bundle) => {
        if (cancelled) return
        const withDetail: SharedItemWithDetail[] = bundle.items.map((item) => {
          const members = bundle.membersByItem.get(item.id) ?? []
          const isOwner = item.ownerId === user.id
          const myMembership = members.find((m) => m.userId === user.id)
          return {
            item,
            ownerUsername: bundle.ownerUsernames.get(item.id) ?? '(unknown)',
            members,
            logs: bundle.logs.filter((l) => l.sharedItemId === item.id),
            isOwner,
            myStatus: isOwner ? 'owner' : myMembership?.status ?? 'invited',
          }
        })
        setItems(withDetail)
        setError(null)
      })
      .catch((err) => {
        if (!cancelled) setError(getErrorMessage(err, 'Could not load shared items.'))
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [user, nonce])

  // Resubscribes whenever the set of relevant shared-item ids changes
  // (e.g. a new invite just got accepted into `items`).
  const idsKey = items
    .map((i) => i.item.id)
    .slice()
    .sort()
    .join(',')
  useEffect(() => {
    if (!user || idsKey === '') return
    return subscribeToSharedItems(idsKey.split(','), refresh, (payload) => {
      if (payload.toUserId === user.id) setCheer(payload)
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, idsKey, refresh])

  async function share(itemType: SharedItemType, itemId: string, title: string, memberIds: string[]): Promise<'ok' | 'limit'> {
    if (!user) return 'ok'
    try {
      await createSharedItem(user.id, itemType, itemId, title, memberIds)
      refresh()
      return 'ok'
    } catch (err) {
      if (isFreePlanLimitError(err)) return 'limit'
      throw err
    }
  }

  async function acceptInvite(sharedItemId: string) {
    if (!user) return
    await respondToShareInvite(sharedItemId, user.id, true)
    refresh()
  }
  async function declineInvite(sharedItemId: string) {
    if (!user) return
    await respondToShareInvite(sharedItemId, user.id, false)
    refresh()
  }
  async function leave(sharedItemId: string) {
    if (!user) return
    await leaveSharedItem(sharedItemId, user.id)
    refresh()
  }
  async function removeMember(sharedItemId: string, userId: string) {
    await removeSharedMember(sharedItemId, userId)
    refresh()
  }
  async function deleteItem(sharedItemId: string) {
    await deleteSharedItem(sharedItemId)
    refresh()
  }
  async function setMyState(sharedItemId: string, date: string, state: HabitMark) {
    if (!user) return
    await setSharedLogState(sharedItemId, user.id, date, state)
    refresh()
  }
  async function sendCheerTo(sharedItemId: string, toUserId: string) {
    await sendCheerApi(sharedItemId, username ?? 'A friend', toUserId)
  }

  return {
    loading,
    error,
    items,
    cheer,
    dismissCheer: () => setCheer(null),
    share,
    acceptInvite,
    declineInvite,
    leave,
    removeMember,
    deleteItem,
    setMyState,
    sendCheerTo,
    refresh,
  }
}
