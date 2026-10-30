import type { Cheer, CheerEmoji, PostWithDetail } from '../types/posts'

/** Locally applies "I cheered with this emoji" to a post — replaces any previous cheer from this same user (one cheer per person per post, same rule the database enforces), used for an optimistic UI update right after setCheer() succeeds, instead of refetching the whole feed. */
export function applyCheer(detail: PostWithDetail, userId: string, emoji: CheerEmoji): PostWithDetail {
  const others = detail.cheers.filter((c) => c.userId !== userId)
  const mine: Cheer = { postId: detail.post.id, userId, emoji, createdAt: new Date().toISOString() }
  return { ...detail, cheers: [...others, mine], myCheer: emoji }
}

/** Locally removes this user's cheer from a post — the optimistic counterpart to removeCheer(). */
export function clearCheer(detail: PostWithDetail, userId: string): PostWithDetail {
  return { ...detail, cheers: detail.cheers.filter((c) => c.userId !== userId), myCheer: null }
}
