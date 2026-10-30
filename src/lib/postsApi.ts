import { supabase } from './supabaseClient'
import { usernamesFor } from './friendsApi'
import type { Cheer, CheerEmoji, Post, PostVisibility, PostWithDetail, ReportReason } from '../types/posts'

function requireClient() {
  if (!supabase) throw new Error('Supabase is not configured.')
  return supabase
}

// Exported for adminApi.ts, which also reads raw `posts` rows (for
// reported-post review) and shouldn't have to redefine this mapping.
export type PostRow = {
  id: string
  user_id: string
  body: string
  visibility: PostVisibility
  comments_enabled: boolean
  is_removed: boolean
  removed_reason: string | null
  created_at: string
  updated_at: string
}

export function mapPost(r: PostRow): Post {
  return {
    id: r.id,
    userId: r.user_id,
    body: r.body,
    visibility: r.visibility,
    commentsEnabled: r.comments_enabled,
    isRemoved: r.is_removed,
    removedReason: r.removed_reason,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  }
}

type CheerRow = { post_id: string; user_id: string; emoji: CheerEmoji; created_at: string }

function mapCheer(r: CheerRow): Cheer {
  return { postId: r.post_id, userId: r.user_id, emoji: r.emoji, createdAt: r.created_at }
}

/**
 * Every post visible to `userId` (RLS on the posts table already enforces
 * who can see what — own/public/friends-only-if-friends, never a blocked
 * party's, never a removed one unless it's your own), newest first, with
 * each post's cheers and the author's username attached.
 */
export async function fetchFeed(userId: string): Promise<PostWithDetail[]> {
  const client = requireClient()

  const { data: postRows, error: postsError } = await client
    .from('posts')
    .select('*')
    .order('created_at', { ascending: false })
  if (postsError) throw postsError
  const posts = ((postRows ?? []) as PostRow[]).map(mapPost)
  if (posts.length === 0) return []

  const postIds = posts.map((p) => p.id)
  const { data: cheerRows, error: cheersError } = await client.from('cheers').select('*').in('post_id', postIds)
  if (cheersError) throw cheersError
  const cheers = ((cheerRows ?? []) as CheerRow[]).map(mapCheer)

  const usernames = await usernamesFor(posts.map((p) => p.userId))

  const cheersByPost = new Map<string, Cheer[]>()
  for (const cheer of cheers) {
    const list = cheersByPost.get(cheer.postId) ?? []
    list.push(cheer)
    cheersByPost.set(cheer.postId, list)
  }

  return posts.map((post) => {
    const postCheers = cheersByPost.get(post.id) ?? []
    return {
      post,
      authorUsername: usernames.get(post.userId) ?? '(unknown)',
      isOwner: post.userId === userId,
      cheers: postCheers,
      myCheer: postCheers.find((c) => c.userId === userId)?.emoji ?? null,
    }
  })
}

export async function createPost(
  userId: string,
  body: string,
  visibility: PostVisibility,
  commentsEnabled: boolean
): Promise<Post> {
  const client = requireClient()
  const { data, error } = await client
    .from('posts')
    .insert({ user_id: userId, body, visibility, comments_enabled: commentsEnabled })
    .select()
    .single()
  if (error) throw error
  return mapPost(data as PostRow)
}

export async function updatePost(
  postId: string,
  fields: { body?: string; visibility?: PostVisibility; commentsEnabled?: boolean }
): Promise<void> {
  const client = requireClient()
  const update: Record<string, unknown> = { updated_at: new Date().toISOString() }
  if (fields.body !== undefined) update.body = fields.body
  if (fields.visibility !== undefined) update.visibility = fields.visibility
  if (fields.commentsEnabled !== undefined) update.comments_enabled = fields.commentsEnabled
  const { error } = await client.from('posts').update(update).eq('id', postId)
  if (error) throw error
}

export async function deletePost(postId: string): Promise<void> {
  const client = requireClient()
  const { error } = await client.from('posts').delete().eq('id', postId)
  if (error) throw error
}

/** Sets (or replaces) the caller's own cheer on a post — one cheer per person per post, upsert on the (post_id, user_id) primary key. */
export async function setCheer(postId: string, userId: string, emoji: CheerEmoji): Promise<void> {
  const client = requireClient()
  const { error } = await client.from('cheers').upsert({ post_id: postId, user_id: userId, emoji })
  if (error) throw error
}

export async function removeCheer(postId: string, userId: string): Promise<void> {
  const client = requireClient()
  const { error } = await client.from('cheers').delete().eq('post_id', postId).eq('user_id', userId)
  if (error) throw error
}

/** Files a report — confidential: only the reporter and admins can ever see it (see reports_select in schema.sql), never the post's author. One per person per post; a second tap is a silent no-op (reports has a unique(reporter_id, post_id) constraint), not an error the user needs to see. */
export async function reportPost(postId: string, reporterId: string, reason: ReportReason, details: string): Promise<void> {
  const client = requireClient()
  const { error } = await client
    .from('reports')
    .insert({ post_id: postId, reporter_id: reporterId, reason, details: details.trim() || null })
  if (error && error.code !== '23505') throw error // 23505 = unique_violation (already reported)
}

export async function blockUser(blockerId: string, blockedId: string): Promise<void> {
  const client = requireClient()
  const { error } = await client.from('blocks').insert({ blocker_id: blockerId, blocked_id: blockedId })
  if (error) throw error
}

export async function unblockUser(blockerId: string, blockedId: string): Promise<void> {
  const client = requireClient()
  const { error } = await client.from('blocks').delete().eq('blocker_id', blockerId).eq('blocked_id', blockedId)
  if (error) throw error
}

export interface BlockedUser {
  userId: string
  username: string
}

/** Everyone `userId` has blocked (blocks_select_own only ever returns rows where YOU are the blocker — never who blocked you, never someone else's list). */
export async function fetchBlockedUsers(userId: string): Promise<BlockedUser[]> {
  const client = requireClient()
  const { data, error } = await client.from('blocks').select('blocked_id').eq('blocker_id', userId)
  if (error) throw error
  const ids = ((data ?? []) as { blocked_id: string }[]).map((r) => r.blocked_id)
  if (ids.length === 0) return []
  const usernames = await usernamesFor(ids)
  return ids.map((id) => ({ userId: id, username: usernames.get(id) ?? '(unknown)' }))
}
