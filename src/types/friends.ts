import type { HabitMark } from '../types'

export type FriendshipStatus = 'pending' | 'accepted' | 'declined' | 'blocked'

export interface Friendship {
  id: string
  requesterId: string
  addresseeId: string
  status: FriendshipStatus
  blockedBy: string | null
  createdAt: string
  updatedAt: string
}

/** A friendship joined with the other party's profile — what the UI actually renders. */
export interface FriendEntry {
  friendship: Friendship
  otherUserId: string
  otherUsername: string
  direction: 'incoming' | 'outgoing' // relative to the current user, for pending requests
}

export type SharedItemType = 'habit' | 'course'
export type SharedMemberStatus = 'invited' | 'accepted' | 'left' | 'removed'

export interface SharedItem {
  id: string
  ownerId: string
  itemType: SharedItemType
  itemId: string
  title: string
  createdAt: string
}

export interface SharedItemMember {
  sharedItemId: string
  userId: string
  username: string
  status: SharedMemberStatus
  joinedAt: string | null
}

export interface SharedItemLogRow {
  sharedItemId: string
  userId: string
  date: string
  state: HabitMark
  updatedAt: string
}

/** A shared item plus everything needed to render its "together" card. */
export interface SharedItemWithDetail {
  item: SharedItem
  ownerUsername: string
  members: SharedItemMember[] // accepted + invited + the ones who left/were removed (for history), owner not included
  logs: SharedItemLogRow[]
  isOwner: boolean
  myStatus: SharedMemberStatus | 'owner'
}
