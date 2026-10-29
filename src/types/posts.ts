export type PostVisibility = 'private' | 'friends' | 'public'

export interface Post {
  id: string
  userId: string
  body: string
  visibility: PostVisibility
  commentsEnabled: boolean
  isRemoved: boolean
  removedReason: string | null
  createdAt: string
  updatedAt: string
}

export const CHEER_EMOJIS = ['🎉', '👏', '🔥', '💪', '❤️'] as const
export type CheerEmoji = (typeof CHEER_EMOJIS)[number]

export interface Cheer {
  postId: string
  userId: string
  emoji: CheerEmoji
  createdAt: string
}

/** A post plus everything the feed needs to render it. */
export interface PostWithDetail {
  post: Post
  authorUsername: string
  isOwner: boolean
  cheers: Cheer[]
  myCheer: CheerEmoji | null
}

export type ReportReason = 'spam' | 'harassment' | 'inappropriate' | 'other'
