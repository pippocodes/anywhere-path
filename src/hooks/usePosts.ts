import { useCallback, useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { fetchFeed, createPost, updatePost, deletePost } from '../lib/postsApi'
import { getErrorMessage } from '../lib/friendsApi'
import type { PostVisibility, PostWithDetail } from '../types/posts'

export interface UsePostsResult {
  loading: boolean
  error: string | null
  posts: PostWithDetail[]
  post: (body: string, visibility: PostVisibility, commentsEnabled: boolean) => Promise<void>
  edit: (postId: string, fields: { body?: string; visibility?: PostVisibility; commentsEnabled?: boolean }) => Promise<void>
  remove: (postId: string) => Promise<void>
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

  return { loading, error, posts, post, edit, remove, refresh }
}
