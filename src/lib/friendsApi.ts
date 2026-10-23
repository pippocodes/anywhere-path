import type { RealtimeChannel } from '@supabase/supabase-js'
import { supabase } from './supabaseClient'
import type {
  Friendship,
  FriendEntry,
  PublicProfile,
  SharedItem,
  SharedItemMember,
  SharedItemLogRow,
  SharedItemType,
} from '../types/friends'
import type { HabitMark } from '../types'

function requireClient() {
  if (!supabase) throw new Error('Supabase is not configured.')
  return supabase
}

/**
 * Supabase/PostgREST errors (what every `throw error` below actually
 * throws, via `.insert()`/`.update()`/`.rpc()` failures) are plain
 * `{message, details, hint, code}` objects — NOT `instanceof Error` — so
 * `err instanceof Error` silently misses them everywhere. This is the one
 * place that extracts a message from either shape.
 */
export function getErrorMessage(error: unknown, fallback = 'Something went wrong — try again.'): string {
  if (error instanceof Error) return error.message
  if (error && typeof error === 'object' && 'message' in error && typeof (error as { message: unknown }).message === 'string') {
    return (error as { message: string }).message
  }
  return fallback
}

/** The one error shape the UI needs to distinguish from "something broke" — see shared_items_enforce_limit() in the migration. */
export const FREE_PLAN_SHARE_LIMIT_PREFIX = 'FREE_PLAN_SHARE_LIMIT'

export function isFreePlanLimitError(error: unknown): boolean {
  return getErrorMessage(error, '').includes(FREE_PLAN_SHARE_LIMIT_PREFIX)
}

// --- Row <-> app-shape mapping ---

type FriendshipRow = {
  id: string
  requester_id: string
  addressee_id: string
  status: Friendship['status']
  blocked_by: string | null
  created_at: string
  updated_at: string
}

function mapFriendship(r: FriendshipRow): Friendship {
  return {
    id: r.id,
    requesterId: r.requester_id,
    addresseeId: r.addressee_id,
    status: r.status,
    blockedBy: r.blocked_by,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  }
}

async function usernamesFor(ids: string[]): Promise<Map<string, string>> {
  const map = new Map<string, string>()
  const unique = [...new Set(ids)]
  if (unique.length === 0) return map
  const client = requireClient()
  const { data, error } = await client.from('profiles').select('id, username').in('id', unique)
  if (error) throw error
  for (const row of (data ?? []) as { id: string; username: string }[]) map.set(row.id, row.username)
  return map
}

// --- Username search ---

export async function searchUsers(query: string): Promise<{ id: string; username: string }[]> {
  if (query.trim().length < 3) return []
  const client = requireClient()
  const { data, error } = await client.rpc('search_users', { query })
  if (error) throw error
  return (data ?? []) as { id: string; username: string }[]
}

/** One page of the "People you can add" directory — public profiles only, already excluding self/friends/pending/blocked server-side (see people_you_can_add() in schema.sql). Never filter this list further client-side. */
export async function fetchPeopleYouCanAdd(limit: number, offset: number): Promise<PublicProfile[]> {
  const client = requireClient()
  const { data, error } = await client.rpc('people_you_can_add', { p_limit: limit, p_offset: offset })
  if (error) throw error
  return (data ?? []) as PublicProfile[]
}

// --- Friendships ---

/** Every friendship row involving `userId`, joined with the other party's username. */
export async function fetchFriendEntries(userId: string): Promise<FriendEntry[]> {
  const client = requireClient()
  const { data, error } = await client
    .from('friendships')
    .select('*')
    .or(`requester_id.eq.${userId},addressee_id.eq.${userId}`)
  if (error) throw error

  const rows = (data ?? []) as FriendshipRow[]
  const otherIds = rows.map((r) => (r.requester_id === userId ? r.addressee_id : r.requester_id))
  const usernames = await usernamesFor(otherIds)

  return rows.map((r) => {
    const friendship = mapFriendship(r)
    const otherUserId = r.requester_id === userId ? r.addressee_id : r.requester_id
    return {
      friendship,
      otherUserId,
      otherUsername: usernames.get(otherUserId) ?? '(unknown)',
      direction: r.requester_id === userId ? ('outgoing' as const) : ('incoming' as const),
    }
  })
}

export async function sendFriendRequest(requesterId: string, addresseeId: string): Promise<void> {
  const client = requireClient()
  const { error } = await client.from('friendships').insert({ requester_id: requesterId, addressee_id: addresseeId })
  if (error) throw error
}

export async function respondToFriendRequest(friendshipId: string, accept: boolean): Promise<void> {
  const client = requireClient()
  const { error } = await client
    .from('friendships')
    .update({ status: accept ? 'accepted' : 'declined' })
    .eq('id', friendshipId)
  if (error) throw error
}

/** Cancel a sent request, remove an accepted friend, or unblock — all the same DELETE under the hood. */
export async function deleteFriendship(friendshipId: string): Promise<void> {
  const client = requireClient()
  const { error } = await client.from('friendships').delete().eq('id', friendshipId)
  if (error) throw error
}

export async function blockFriendship(friendshipId: string): Promise<void> {
  const client = requireClient()
  const { error } = await client.from('friendships').update({ status: 'blocked' }).eq('id', friendshipId)
  if (error) throw error
}

// --- Shared items ---

type SharedItemRow = {
  id: string
  owner_id: string
  item_type: SharedItemType
  item_id: string
  title: string
  created_at: string
}

function mapSharedItem(r: SharedItemRow): SharedItem {
  return { id: r.id, ownerId: r.owner_id, itemType: r.item_type, itemId: r.item_id, title: r.title, createdAt: r.created_at }
}

type SharedItemMemberRow = {
  shared_item_id: string
  user_id: string
  status: SharedItemMember['status']
  joined_at: string | null
}

type SharedItemLogRowDb = {
  shared_item_id: string
  user_id: string
  log_date: string
  state: HabitMark
  updated_at: string
}

function mapLog(r: SharedItemLogRowDb): SharedItemLogRow {
  return { sharedItemId: r.shared_item_id, userId: r.user_id, date: r.log_date, state: r.state, updatedAt: r.updated_at }
}

export interface SharedItemsBundle {
  items: SharedItem[]
  membersByItem: Map<string, SharedItemMember[]>
  logs: SharedItemLogRow[]
  ownerUsernames: Map<string, string>
}

/** Everything needed to render every shared item the user owns or belongs to, in one bundle. */
export async function fetchSharedItemsBundle(userId: string): Promise<SharedItemsBundle> {
  const client = requireClient()

  const { data: itemRows, error: itemsError } = await client.from('shared_items').select('*')
  if (itemsError) throw itemsError
  const items = ((itemRows ?? []) as SharedItemRow[]).map(mapSharedItem)
  if (items.length === 0) return { items: [], membersByItem: new Map(), logs: [], ownerUsernames: new Map() }

  const itemIds = items.map((i) => i.id)

  const { data: memberRows, error: membersError } = await client
    .from('shared_item_members')
    .select('*')
    .in('shared_item_id', itemIds)
  if (membersError) throw membersError

  const { data: logRows, error: logsError } = await client
    .from('shared_item_logs')
    .select('*')
    .in('shared_item_id', itemIds)
  if (logsError) throw logsError

  const memberIds = ((memberRows ?? []) as SharedItemMemberRow[]).map((m) => m.user_id)
  const ownerIds = items.map((i) => i.ownerId)
  const usernames = await usernamesFor([...memberIds, ...ownerIds])

  const membersByItem = new Map<string, SharedItemMember[]>()
  for (const r of (memberRows ?? []) as SharedItemMemberRow[]) {
    const entry: SharedItemMember = {
      sharedItemId: r.shared_item_id,
      userId: r.user_id,
      username: usernames.get(r.user_id) ?? '(unknown)',
      status: r.status,
      joinedAt: r.joined_at,
    }
    const list = membersByItem.get(r.shared_item_id) ?? []
    list.push(entry)
    membersByItem.set(r.shared_item_id, list)
  }

  const ownerUsernames = new Map<string, string>()
  for (const item of items) ownerUsernames.set(item.id, usernames.get(item.ownerId) ?? '(unknown)')

  return {
    items,
    membersByItem,
    logs: ((logRows ?? []) as SharedItemLogRowDb[]).map(mapLog),
    ownerUsernames,
  }
}

export async function createSharedItem(
  ownerId: string,
  itemType: SharedItemType,
  itemId: string,
  title: string,
  memberIds: string[]
): Promise<SharedItem> {
  const client = requireClient()
  const { data, error } = await client
    .from('shared_items')
    .insert({ owner_id: ownerId, item_type: itemType, item_id: itemId, title })
    .select('*')
    .single()
  if (error) throw error
  const item = mapSharedItem(data as SharedItemRow)

  if (memberIds.length > 0) {
    const { error: memberError } = await client
      .from('shared_item_members')
      .insert(memberIds.map((userId) => ({ shared_item_id: item.id, user_id: userId })))
    if (memberError) throw memberError
  }
  return item
}

export async function respondToShareInvite(sharedItemId: string, userId: string, accept: boolean): Promise<void> {
  const client = requireClient()
  const { error } = await client
    .from('shared_item_members')
    .update({ status: accept ? 'accepted' : 'left' })
    .eq('shared_item_id', sharedItemId)
    .eq('user_id', userId)
  if (error) throw error
}

export async function leaveSharedItem(sharedItemId: string, userId: string): Promise<void> {
  const client = requireClient()
  const { error } = await client
    .from('shared_item_members')
    .update({ status: 'left' })
    .eq('shared_item_id', sharedItemId)
    .eq('user_id', userId)
  if (error) throw error
}

export async function removeSharedMember(sharedItemId: string, userId: string): Promise<void> {
  const client = requireClient()
  const { error } = await client
    .from('shared_item_members')
    .update({ status: 'removed' })
    .eq('shared_item_id', sharedItemId)
    .eq('user_id', userId)
  if (error) throw error
}

export async function deleteSharedItem(sharedItemId: string): Promise<void> {
  const client = requireClient()
  const { error } = await client.from('shared_items').delete().eq('id', sharedItemId)
  if (error) throw error
}

/** Upserts today's (or any date's) tri-state log row for the current user. */
export async function setSharedLogState(
  sharedItemId: string,
  userId: string,
  date: string,
  state: HabitMark
): Promise<void> {
  const client = requireClient()
  const { error } = await client
    .from('shared_item_logs')
    .upsert({ shared_item_id: sharedItemId, user_id: userId, log_date: date, state, updated_at: new Date().toISOString() })
  if (error) throw error
}

// --- Realtime ---
//
// Supabase Realtime forbids adding `.on(...)` listeners to a channel that's
// already `.subscribe()`d — but multiple components in the same tab each
// call these subscribe functions independently (e.g. the notification bell
// AND the Friends page both want friendship updates). `client.channel(name)`
// returns the SAME underlying channel object for a repeated name, so the
// second caller's `.on()` would throw. These tiny per-name registries make
// the module itself the single owner of each channel: the first subscriber
// actually creates + subscribes it, later subscribers just register a local
// listener, and the channel is torn down once the last listener leaves.
//
// Teardown is debounced a tick: React 18 StrictMode (dev only) runs
// mount -> cleanup -> mount again synchronously for every effect, and
// `client.removeChannel()` doesn't remove the channel from the client's
// own registry synchronously — so an immediate teardown-and-recreate on
// that phantom unmount could still hand the remount a channel that's
// mid-teardown. Deferring the real teardown past that synchronous
// double-invoke, and cancelling it if a new subscriber shows up first,
// sidesteps the race entirely.
function scheduleTeardown(fn: () => void): () => void {
  const timer = setTimeout(fn, 0)
  return () => clearTimeout(timer)
}

type CheerPayload = { fromUsername: string; toUserId: string; sharedItemId: string }

const friendshipRegistry = new Map<
  string,
  { channel: RealtimeChannel; listeners: Set<() => void>; cancelTeardown: (() => void) | null }
>()

/** Live updates for incoming/outgoing friend requests and responses — drives the notification bell + friends list. */
export function subscribeToFriendships(userId: string, onChange: () => void): () => void {
  const client = requireClient()
  const name = `friendships-${userId}`
  let entry = friendshipRegistry.get(name)
  if (entry) {
    entry.cancelTeardown?.()
    entry.cancelTeardown = null
  } else {
    const listeners = new Set<() => void>()
    const dispatch = () => listeners.forEach((l) => l())
    const channel = client
      .channel(name)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'friendships', filter: `requester_id=eq.${userId}` }, dispatch)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'friendships', filter: `addressee_id=eq.${userId}` }, dispatch)
      .subscribe()
    entry = { channel, listeners, cancelTeardown: null }
    friendshipRegistry.set(name, entry)
  }
  entry.listeners.add(onChange)
  return () => {
    const current = friendshipRegistry.get(name)
    if (!current) return
    current.listeners.delete(onChange)
    if (current.listeners.size === 0) {
      current.cancelTeardown = scheduleTeardown(() => {
        const stillThere = friendshipRegistry.get(name)
        if (stillThere && stillThere.listeners.size === 0) {
          client.removeChannel(stillThere.channel)
          friendshipRegistry.delete(name)
        }
      })
    }
  }
}

function cheerChannelName(sharedItemId: string): string {
  return `shared-item-${sharedItemId}`
}

const sharedItemRegistry = new Map<
  string,
  {
    channel: RealtimeChannel
    onChangeListeners: Set<() => void>
    onCheerListeners: Set<(p: CheerPayload) => void>
    cancelTeardown: (() => void) | null
  }
>()

/**
 * Live updates for a set of shared items — one shared (registry-backed)
 * channel per item, each carrying both postgres_changes (members/logs for
 * that item) and the broadcast cheer/nudge events sendCheer() sends on the
 * same per-item channel name — they have to match for broadcast delivery
 * to work at all, and across different users' browser sessions too.
 */
export function subscribeToSharedItems(
  itemIds: string[],
  onChange: () => void,
  onCheer?: (payload: CheerPayload) => void
): () => void {
  const client = requireClient()
  const names = itemIds.map((itemId) => ({ itemId, name: cheerChannelName(itemId) }))

  for (const { itemId, name } of names) {
    let entry = sharedItemRegistry.get(name)
    if (entry) {
      entry.cancelTeardown?.()
      entry.cancelTeardown = null
    } else {
      const onChangeListeners = new Set<() => void>()
      const onCheerListeners = new Set<(p: CheerPayload) => void>()
      const filter = `shared_item_id=eq.${itemId}`
      const channel = client
        .channel(name)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'shared_item_members', filter }, () =>
          onChangeListeners.forEach((l) => l())
        )
        .on('postgres_changes', { event: '*', schema: 'public', table: 'shared_item_logs', filter }, () =>
          onChangeListeners.forEach((l) => l())
        )
        .on('broadcast', { event: 'cheer' }, ({ payload }) => {
          const p = payload as CheerPayload
          onCheerListeners.forEach((l) => l(p))
        })
        .subscribe()
      entry = { channel, onChangeListeners, onCheerListeners, cancelTeardown: null }
      sharedItemRegistry.set(name, entry)
    }
    entry.onChangeListeners.add(onChange)
    if (onCheer) entry.onCheerListeners.add(onCheer)
  }

  return () => {
    for (const { name } of names) {
      const current = sharedItemRegistry.get(name)
      if (!current) continue
      current.onChangeListeners.delete(onChange)
      if (onCheer) current.onCheerListeners.delete(onCheer)
      if (current.onChangeListeners.size === 0 && current.onCheerListeners.size === 0) {
        current.cancelTeardown = scheduleTeardown(() => {
          const stillThere = sharedItemRegistry.get(name)
          if (stillThere && stillThere.onChangeListeners.size === 0 && stillThere.onCheerListeners.size === 0) {
            client.removeChannel(stillThere.channel)
            sharedItemRegistry.delete(name)
          }
        })
      }
    }
  }
}

/** A lightweight, non-persisted "nudge" — a live spark sent to everyone subscribed to this shared item's channel right now. */
export async function sendCheer(sharedItemId: string, fromUsername: string, toUserId: string): Promise<void> {
  const client = requireClient()
  await client.channel(cheerChannelName(sharedItemId)).send({
    type: 'broadcast',
    event: 'cheer',
    payload: { fromUsername, toUserId, sharedItemId },
  })
}
