import { useCallback, useEffect, useRef, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { fetchFeed, createPost, updatePost, deletePost, setCheer, removeCheer } from '../lib/postsApi'
import { getErrorMessage } from '../lib/friendsApi'
import { applyCheer, clearCheer } from '../utils/postCheers'
import type { CheerEmoji, PostVisibility, PostWithDetail } from '../types/posts'

export interface UsePostsResult {
  loading: boolean
  error: string | null
  posts: PostWithDetail[]
  post: (body: string, visibility: PostVisibility, commentsEnabled: boolean) => Promise<void>
  edit: (postId: string, fields: { body?: string; visibility?: PostVisibility; commentsEnabled?: boolean }) => Promise<void>
  remove: (postId: string) => Promise<void>
  cheer: (postId: string, emoji: CheerEmoji) => Promise<void>
  uncheer: (postId: string) => Promise<void>
  refresh: () => void
}

/** The community feed: every post visible to the signed-in user, newest first. */
export function usePosts(): UsePostsResult {
  const { user } = useAuth()
  const [posts, setPosts] = useState<PostWithDetail[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [nonce, setNonce] = useState(0)

  const refresh = useCallback(() => setNonce((n) => n + 1), [])

  useEffect(() => {
    if (!user) {
      setPosts([])
      setLoading(false)
      return
    }
    let cancelled = false
    setLoading(true)
    fetchFeed(user.id)
      .then((data) => {
        if (!cancelled) {
          setPosts(data)
          setError(null)
        }
      })
      .catch((err) => {
        if (!cancelled) setError(getErrorMessage(err, 'Could not load the feed.'))
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [user, nonce])

  async function post(body: string, visibility: PostVisibility, commentsEnabled: boolean) {
    if (!user) return
    await createPost(user.id, body, visibility, commentsEnabled)
    refresh()
  }

  async function edit(postId: string, fields: { body?: string; visibility?: PostVisibility; commentsEnabled?: boolean }) {
    await updatePost(postId, fields)
    refresh()
  }

  async function remove(postId: string) {
    await deletePost(postId)
    refresh()
  }

  // Cheering is a high-frequency, low-stakes tap — update the one affected
  // post locally instead of refetching the whole feed (unlike post/edit/
  // remove above, which are rare enough that a full refresh is fine).
  //
  // Network responses aren't guaranteed to arrive in request order, so a
  // quick "no wait, this emoji instead" re-tap could otherwise have the
  // FIRST tap's response land last and overwrite the second one. This ref
  // tracks the latest request per post; a response only gets applied if
  // it's still the most recent one for that post by the time it resolves.
  const latestCheerRequest = useRef<Map<string, symbol>>(new Map())

  async function cheer(postId: string, emoji: CheerEmoji) {
    if (!user) return
    const token = Symbol()
    latestCheerRequest.current.set(postId, token)
    await setCheer(postId, user.id, emoji)
    if (latestCheerRequest.current.get(postId) !== token) return
    setPosts((prev) => prev.map((d) => (d.post.id === postId ? applyCheer(d, user.id, emoji) : d)))
  }

  async function uncheer(postId: string) {
    if (!user) return
    const token = Symbol()
    latestCheerRequest.current.set(postId, token)
    await removeCheer(postId, user.id)
    if (latestCheerRequest.current.get(postId) !== token) return
    setPosts((prev) => prev.map((d) => (d.post.id === postId ? clearCheer(d, user.id) : d)))
  }

  return { loading, error, posts, post, edit, remove, cheer, uncheer, refresh }
}
