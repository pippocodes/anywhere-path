import { useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { usePostSuggestion } from '../../hooks/usePostSuggestion'
import { useToast } from '../ui/Toast'
import { getErrorMessage } from '../../lib/friendsApi'
import Pills from '../ui/Pills'
import AnimatedCheckbox from '../motion/AnimatedCheckbox'
import PostCard from './PostCard'
import type { PostVisibility } from '../../types/posts'

const VISIBILITY_OPTIONS = [
  { value: 'private', label: 'Private' },
  { value: 'friends', label: 'Friends only' },
  { value: 'public', label: 'Public' },
]

const MAX_LENGTH = 2000

interface Props {
  onPost: (body: string, visibility: PostVisibility, commentsEnabled: boolean) => Promise<void>
}

/** The composer: a one-tap suggested draft the user can edit (or write their own from scratch), a live preview, a visibility choice that always defaults to Private, and an explicit Post tap. */
function PostComposer({ onPost }: Props) {
  const { username } = useAuth()
  const { suggestion, markPosted, neverSuggestThisRule } = usePostSuggestion()
  const { show: showToast } = useToast()

  const [body, setBody] = useState('')
  const [visibility, setVisibility] = useState<PostVisibility>('private')
  const [commentsEnabled, setCommentsEnabled] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [bannerDismissed, setBannerDismissed] = useState(false)

  const showBanner = !!suggestion && !bannerDismissed && body.trim() === ''

  function useSuggestedDraft() {
    if (!suggestion) return
    setBody(suggestion.draft)
    setBannerDismissed(true)
  }

  function dismissNeverSuggest() {
    neverSuggestThisRule()
    setBannerDismissed(true)
  }

  async function handlePost() {
    const trimmed = body.trim()
    if (!trimmed || submitting) return
    setSubmitting(true)
    try {
      await onPost(trimmed, visibility, commentsEnabled)
      // Only the exact suggested draft counts as "posted about this
      // achievement" — editing it into something else is still a fresh
      // post, not a confirmation of the suggestion.
      if (suggestion && trimmed === suggestion.draft) markPosted()
      setBody('')
      setVisibility('private')
      setCommentsEnabled(false)
      showToast('Posted', 'success')
    } catch (err) {
      showToast(getErrorMessage(err, 'Could not post — try again.'), 'error')
    } finally {
      setSubmitting(false)
    }
  }

  const previewDetail = {
    post: {
      id: 'preview',
      userId: '',
      body,
      visibility,
      commentsEnabled,
      isRemoved: false,
      removedReason: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    authorUsername: username ?? 'You',
    isOwner: true,
    cheers: [],
    myCheer: null,
  }

  return (
    <div className="card" style={{ padding: '18px 20px', display: 'flex', flexDirection: 'column', gap: 14 }}>
      {showBanner && suggestion && (
        <div
          style={{
            background: 'var(--surface)',
            border: '1px solid var(--line)',
            borderRadius: 12,
            padding: '12px 14px',
            display: 'flex',
            flexDirection: 'column',
            gap: 10,
          }}
        >
          <p style={{ fontSize: 13.5, color: 'var(--cream)', margin: 0 }}>{suggestion.draft}</p>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <button type="button" className="btn" style={{ fontSize: 12, padding: '6px 14px' }} onClick={useSuggestedDraft}>
              Use this
            </button>
            <button type="button" className="btn-outline" style={{ fontSize: 12, padding: '6px 14px' }} onClick={() => setBannerDismissed(true)}>
              Not now
            </button>
            <button
              type="button"
              className="btn-outline"
              style={{ fontSize: 12, padding: '6px 14px', color: 'var(--mute)' }}
              onClick={dismissNeverSuggest}
            >
              Never suggest
            </button>
          </div>
        </div>
      )}

      <textarea
        value={body}
        onChange={(e) => setBody(e.target.value.slice(0, MAX_LENGTH))}
        placeholder="Share an update with your friends..."
        rows={3}
        style={{
          width: '100%',
          padding: '10px 12px',
          borderRadius: 10,
          border: '1px solid var(--line)',
          background: 'transparent',
          color: 'var(--cream)',
          fontSize: 14,
          fontFamily: 'inherit',
          resize: 'vertical',
        }}
      />

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
        <Pills
          options={VISIBILITY_OPTIONS}
          value={visibility}
          onChange={(v) => setVisibility(v as PostVisibility)}
          layoutId="post-visibility"
          size="sm"
        />
        <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12.5, color: 'var(--mute)' }}>
          <AnimatedCheckbox checked={commentsEnabled} onChange={() => setCommentsEnabled((v) => !v)} ariaLabel="Allow comments on this post" />
          Allow comments
        </label>
      </div>

      {body.trim() && (
        <div>
          <div className="micro-label" style={{ marginBottom: 8 }}>
            Preview
          </div>
          <PostCard detail={previewDetail} />
        </div>
      )}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: 11, color: 'var(--mute)' }}>{body.length}/{MAX_LENGTH}</span>
        <button type="button" className="btn" disabled={!body.trim() || submitting} onClick={handlePost}>
          {submitting ? 'Posting…' : 'Post'}
        </button>
      </div>
    </div>
  )
}

export default PostComposer
