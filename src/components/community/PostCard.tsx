import { relativeTime } from '../../utils/relativeTime'
import { CHEER_EMOJIS, type CheerEmoji, type PostVisibility, type PostWithDetail } from '../../types/posts'

const VISIBILITY_LABEL: Record<PostVisibility, string> = {
  private: '🔒 Private',
  friends: '👥 Friends',
  public: '🌍 Public',
}

interface Props {
  detail: PostWithDetail
  // Omitted (e.g. the composer's live preview, where there's no real post
  // to react to yet) renders the cheer row read-only.
  onCheer?: (emoji: CheerEmoji) => void
  onUncheer?: () => void
}

/** One post in the feed — also reused by PostComposer as a live preview of the draft being written. */
function PostCard({ detail, onCheer, onUncheer }: Props) {
  const { post, authorUsername, cheers, myCheer } = detail
  const interactive = !!onCheer && !!onUncheer

  const countByEmoji = new Map<CheerEmoji, number>()
  for (const c of cheers) countByEmoji.set(c.emoji, (countByEmoji.get(c.emoji) ?? 0) + 1)

  function handleTap(emoji: CheerEmoji) {
    if (!interactive) return
    if (myCheer === emoji) onUncheer!()
    else onCheer!(emoji)
  }

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

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {CHEER_EMOJIS.map((emoji) => {
            const count = countByEmoji.get(emoji) ?? 0
            const mine = myCheer === emoji
            return (
              <button
                key={emoji}
                type="button"
                disabled={!interactive}
                onClick={() => handleTap(emoji)}
                aria-pressed={mine}
                aria-label={`Cheer with ${emoji}${mine ? ' (tap to remove)' : ''}`}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 5,
                  padding: '4px 9px',
                  borderRadius: 999,
                  border: `1px solid ${mine ? 'var(--gold)' : 'var(--line)'}`,
                  background: mine ? 'color-mix(in srgb, var(--gold) 18%, transparent)' : 'var(--surface)',
                  fontSize: 13,
                  cursor: interactive ? 'pointer' : 'default',
                }}
              >
                <span>{emoji}</span>
                {count > 0 && <span style={{ fontSize: 11, color: 'var(--mute)', fontVariantNumeric: 'tabular-nums' }}>{count}</span>}
              </button>
            )
          })}
        </div>
        {post.commentsEnabled && <span style={{ fontSize: 11, color: 'var(--mute)' }}>💬 Comments on</span>}
      </div>
    </div>
  )
}

export default PostCard
