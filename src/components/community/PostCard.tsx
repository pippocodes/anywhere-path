import { useState } from 'react'
import { relativeTime } from '../../utils/relativeTime'
import Modal from '../ui/Modal'
import Pills from '../ui/Pills'
import { LockIcon, GlobeIcon, MessageIcon } from './icons'
import { FriendsIcon } from '../nav/tabIcons'
import { CHEER_EMOJIS, type CheerEmoji, type PostVisibility, type PostWithDetail, type ReportReason } from '../../types/posts'

const VISIBILITY_ICON: Record<PostVisibility, (props: { size?: number }) => JSX.Element> = {
  private: LockIcon,
  friends: FriendsIcon,
  public: GlobeIcon,
}

const VISIBILITY_LABEL: Record<PostVisibility, string> = {
  private: 'Private',
  friends: 'Friends',
  public: 'Public',
}

const REPORT_REASON_OPTIONS = [
  { value: 'spam', label: 'Spam' },
  { value: 'harassment', label: 'Harassment' },
  { value: 'inappropriate', label: 'Inappropriate' },
  { value: 'other', label: 'Other' },
]

interface Props {
  detail: PostWithDetail
  // All omitted (e.g. the composer's live preview, where there's no real
  // post to act on yet) renders a read-only card with no action row at all.
  onCheer?: (emoji: CheerEmoji) => void
  onUncheer?: () => void
  onDelete?: (postId: string) => void
  onReport?: (postId: string, reason: ReportReason, details: string) => Promise<void>
  onBlock?: (authorUserId: string) => void
}

/** One post in the feed — also reused by PostComposer as a live preview of the draft being written. */
function PostCard({ detail, onCheer, onUncheer, onDelete, onReport, onBlock }: Props) {
  const { post, authorUsername, isOwner, cheers, myCheer } = detail
  const cheersInteractive = !!onCheer && !!onUncheer
  const actionsAvailable = !!onDelete || !!onReport || !!onBlock

  const [confirmDelete, setConfirmDelete] = useState(false)
  const [confirmBlock, setConfirmBlock] = useState(false)
  const [reportOpen, setReportOpen] = useState(false)
  const [reportReason, setReportReason] = useState<ReportReason>('spam')
  const [reportDetails, setReportDetails] = useState('')
  const [reportSent, setReportSent] = useState(false)
  const [reportSubmitting, setReportSubmitting] = useState(false)

  const countByEmoji = new Map<CheerEmoji, number>()
  for (const c of cheers) countByEmoji.set(c.emoji, (countByEmoji.get(c.emoji) ?? 0) + 1)

  function handleTap(emoji: CheerEmoji) {
    if (!cheersInteractive) return
    if (myCheer === emoji) onUncheer!()
    else onCheer!(emoji)
  }

  async function submitReport() {
    if (!onReport || reportSubmitting) return
    setReportSubmitting(true)
    try {
      await onReport(post.id, reportReason, reportDetails)
      setReportSent(true)
    } catch {
      // Feed.tsx already surfaced a toast for this — leave the form open
      // (not the "thanks, received" screen) so the user can try again.
    } finally {
      setReportSubmitting(false)
    }
  }

  function closeReport() {
    setReportOpen(false)
    setReportSent(false)
    setReportReason('spam')
    setReportDetails('')
  }

  return (
    <div className="card" style={{ padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
        <span style={{ fontWeight: 700, fontSize: 13.5, color: 'var(--cream)' }}>{authorUsername}</span>
        <span style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 11.5, color: 'var(--mute)' }}>
          <span className="outline-badge" style={{ fontSize: 11, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
            {(() => {
              const VisibilityIcon = VISIBILITY_ICON[post.visibility]
              return <VisibilityIcon size={12} />
            })()}
            {VISIBILITY_LABEL[post.visibility]}
          </span>
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
                disabled={!cheersInteractive}
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
                  cursor: cheersInteractive ? 'pointer' : 'default',
                }}
              >
                <span>{emoji}</span>
                {count > 0 && <span style={{ fontSize: 11, color: 'var(--mute)', fontVariantNumeric: 'tabular-nums' }}>{count}</span>}
              </button>
            )
          })}
        </div>
        {post.commentsEnabled && (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 11, color: 'var(--mute)' }}>
            <MessageIcon size={12} /> Comments on
          </span>
        )}
      </div>

      {actionsAvailable && (
        <div style={{ borderTop: '1px solid var(--line)', paddingTop: 10, display: 'flex', justifyContent: 'flex-end' }}>
          {isOwner ? (
            onDelete &&
            (confirmDelete ? (
              <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                <span style={{ fontSize: 12.5, color: 'var(--mute)' }}>Delete this post?</span>
                <button
                  type="button"
                  className="btn btn-danger"
                  style={{ padding: '6px 12px', fontSize: 12 }}
                  onClick={() => {
                    onDelete(post.id)
                    setConfirmDelete(false)
                  }}
                >
                  Yes, delete
                </button>
                <button type="button" className="btn-outline" style={{ fontSize: 12, color: 'var(--mute)' }} onClick={() => setConfirmDelete(false)}>
                  Cancel
                </button>
              </div>
            ) : (
              <button type="button" className="btn-outline" style={{ fontSize: 12, opacity: 0.75 }} onClick={() => setConfirmDelete(true)}>
                Delete
              </button>
            ))
          ) : confirmBlock ? (
            <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
              <span style={{ fontSize: 12.5, color: 'var(--mute)' }}>
                Block {authorUsername}? Neither of you will see the other's posts.
              </span>
              <button
                type="button"
                className="btn btn-danger"
                style={{ padding: '6px 12px', fontSize: 12 }}
                onClick={() => {
                  onBlock?.(post.userId)
                  setConfirmBlock(false)
                }}
              >
                Yes, block
              </button>
              <button type="button" className="btn-outline" style={{ fontSize: 12, color: 'var(--mute)' }} onClick={() => setConfirmBlock(false)}>
                Cancel
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', gap: 8 }}>
              {onReport && (
                <button type="button" className="btn-outline" style={{ fontSize: 12, opacity: 0.75 }} onClick={() => setReportOpen(true)}>
                  Report
                </button>
              )}
              {onBlock && (
                <button type="button" className="btn-outline" style={{ fontSize: 12, opacity: 0.75 }} onClick={() => setConfirmBlock(true)}>
                  Block
                </button>
              )}
            </div>
          )}
        </div>
      )}

      <Modal open={reportOpen} onClose={closeReport} variant="center" title="Report this post" width={440}>
        {reportSent ? (
          <>
            <p style={{ fontSize: 13.5, color: 'var(--cream)', marginBottom: 18 }}>
              Thanks — we've received your report. It's only visible to you and the moderators.
            </p>
            <button type="button" className="btn" onClick={closeReport}>
              Done
            </button>
          </>
        ) : (
          <>
            <div className="micro-label" style={{ marginBottom: 8 }}>
              Reason
            </div>
            <Pills
              options={REPORT_REASON_OPTIONS}
              value={reportReason}
              onChange={(v) => setReportReason(v as ReportReason)}
              layoutId={`report-reason-${post.id}`}
              size="sm"
            />
            <textarea
              value={reportDetails}
              onChange={(e) => setReportDetails(e.target.value.slice(0, 500))}
              placeholder="Anything else that would help us review this? (optional)"
              rows={3}
              style={{
                width: '100%',
                marginTop: 14,
                padding: '10px 12px',
                borderRadius: 10,
                border: '1px solid var(--line)',
                background: 'transparent',
                color: 'var(--cream)',
                fontSize: 13.5,
                fontFamily: 'inherit',
                resize: 'vertical',
              }}
            />
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 16 }}>
              <button type="button" className="btn-outline" onClick={closeReport}>
                Cancel
              </button>
              <button type="button" className="btn" disabled={reportSubmitting} onClick={submitReport}>
                {reportSubmitting ? 'Sending…' : 'Submit report'}
              </button>
            </div>
          </>
        )}
      </Modal>
    </div>
  )
}

export default PostCard
