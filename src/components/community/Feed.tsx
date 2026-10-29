import { usePosts } from '../../hooks/usePosts'
import PostComposer from './PostComposer'
import PostCard from './PostCard'

/** The community feed: compose a post, see everyone's (visible to you) newest first. */
function Feed() {
  const { loading, error, posts, post, cheer, uncheer } = usePosts()

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
            onCheer={(emoji) => cheer(detail.post.id, emoji)}
            onUncheer={() => uncheer(detail.post.id)}
          />
        ))
      )}
    </div>
  )
}

export default Feed
