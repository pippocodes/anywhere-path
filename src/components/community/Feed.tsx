import { usePosts } from '../../hooks/usePosts'
import { useToast } from '../ui/Toast'
import { getErrorMessage } from '../../lib/friendsApi'
import PostComposer from './PostComposer'
import PostCard from './PostCard'
import AnnouncementBanner from './AnnouncementBanner'
import type { CheerEmoji, ReportReason } from '../../types/posts'

/** The community feed: compose a post, see everyone's (visible to you) newest first. */
function Feed() {
  const { loading, error, posts, blockedUsers, post, remove, cheer, uncheer, report, block, unblock } = usePosts()
  const { show: showToast } = useToast()

  function handleCheer(postId: string, emoji: CheerEmoji) {
    cheer(postId, emoji).catch((err) => showToast(getErrorMessage(err, 'Could not cheer — try again.'), 'error'))
  }

  function handleUncheer(postId: string) {
    uncheer(postId).catch((err) => showToast(getErrorMessage(err, 'Could not remove your cheer — try again.'), 'error'))
  }

  function handleDelete(postId: string) {
    remove(postId)
      .then(() => showToast('Post deleted', 'success'))
      .catch((err) => showToast(getErrorMessage(err, 'Could not delete — try again.'), 'error'))
  }

  function handleReport(postId: string, reason: ReportReason, details: string) {
    // Re-throws after toasting: PostCard awaits this and only shows its
    // own "thanks, received" confirmation on real success.
    return report(postId, reason, details).catch((err) => {
      showToast(getErrorMessage(err, 'Could not send report — try again.'), 'error')
      throw err
    })
  }

  function handleBlock(authorUserId: string) {
    block(authorUserId)
      .then(() => showToast('Blocked', 'success'))
      .catch((err) => showToast(getErrorMessage(err, 'Could not block — try again.'), 'error'))
  }

  function handleUnblock(userId: string) {
    unblock(userId).catch((err) => showToast(getErrorMessage(err, 'Could not unblock — try again.'), 'error'))
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <AnnouncementBanner />
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
            onDelete={handleDelete}
            onReport={handleReport}
            onBlock={handleBlock}
          />
        ))
      )}

      {blockedUsers.length > 0 && (
        <div className="card" style={{ padding: '18px 20px' }}>
          <div className="micro-label" style={{ marginBottom: 10 }}>
            Blocked ({blockedUsers.length})
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {blockedUsers.map((b) => (
              <div key={b.userId} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
                <span style={{ fontSize: 13.5 }}>{b.username}</span>
                <button type="button" className="btn-outline" style={{ fontSize: 12 }} onClick={() => handleUnblock(b.userId)}>
                  Unblock
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default Feed
