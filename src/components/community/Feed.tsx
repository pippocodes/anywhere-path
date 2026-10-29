import { usePosts } from '../../hooks/usePosts'
import { useToast } from '../ui/Toast'
import { getErrorMessage } from '../../lib/friendsApi'
import PostComposer from './PostComposer'
import PostCard from './PostCard'
import type { CheerEmoji } from '../../types/posts'

/** The community feed: compose a post, see everyone's (visible to you) newest first. */
function Feed() {
  const { loading, error, posts, post, cheer, uncheer } = usePosts()
  const { show: showToast } = useToast()

  function handleCheer(postId: string, emoji: CheerEmoji) {
    cheer(postId, emoji).catch((err) => showToast(getErrorMessage(err, 'Could not cheer — try again.'), 'error'))
  }

  function handleUncheer(postId: string) {
    uncheer(postId).catch((err) => showToast(getErrorMessage(err, 'Could not remove your cheer — try again.'), 'error'))
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <PostComposer onPost={post} />

      {loading ? (
        <p style={{ fontSize: 13, color: 'var(--mute)' }}>Loading…</p>
      ) : error ? (
        <div className="card" style={{ padding: '16px 18px' }}>
          <p style={{ fontSize: 13, color: 'var(--danger)', margin: 0 }}>{error}</p>
        </div>
      ) : posts.length === 0 ? (
        <div className="card" style={{ padding: '20px 22px', textAlign: 'center' }}>
          <p style={{ fontSize: 14, color: 'var(--mute)', margin: 0 }}>
            Nothing here yet — share an update above, or check back once friends start posting.
          </p>
        </div>
      ) : (
        posts.map((detail) => (
          <PostCard
            key={detail.post.id}
            detail={detail}
            onCheer={(emoji) => handleCheer(detail.post.id, emoji)}
            onUncheer={() => handleUncheer(detail.post.id)}
          />
        ))
      )}
    </div>
  )
}

export default Feed
