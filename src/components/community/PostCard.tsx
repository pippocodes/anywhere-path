import { relativeTime } from '../../utils/relativeTime'
import type { PostVisibility, PostWithDetail } from '../../types/posts'

const VISIBILITY_LABEL: Record<PostVisibility, string> = {
  private: '🔒 Private',
  friends: '👥 Friends',
  public: '🌍 Public',
}

interface Props {
  detail: PostWithDetail
}

/** One post in the feed — also reused by PostComposer as a live preview of the draft being written. */
function PostCard({ detail }: Props) {
  const { post, authorUsername } = detail

  return (
    <div className="card" style={{ padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
        <span style={{ fontWeight: 700, fontSize: 13.5, color: 'var(--cream)' }}>{authorUsername}</span>
        <span style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 11.5, color: 'var(--mute)' }}>
          <span className="outline-badge" style={{ fontSize: 11 }}>{VISIBILITY_LABEL[post.visibility]}</span>
          {relativeTime(post.createdAt)}
        </span>
      </div>
      <p style={{ fontSize: 14, color: 'var(--cream)', margin: 0, whiteSpace: 'pre-wrap', overflowWrap: 'break-word' }}>
        {post.body}
      </p>
    </div>
  )
}

export default PostCard
