import { useState } from 'react'
import { useAdmin } from '../hooks/useAdmin'
import { useToast } from '../components/ui/Toast'
import { getErrorMessage } from '../lib/friendsApi'
import RevealHeading from '../components/ui/RevealHeading'
import type { ReportWithPost } from '../types/admin'

const REASON_LABEL: Record<string, string> = {
  spam: 'Spam',
  harassment: 'Harassment',
  inappropriate: 'Inappropriate',
  other: 'Other',
}

/**
 * A simple moderation + announcements page. The "Admin" link/route itself is
 * just UX — the actual gate is the database: is_admin() checks the
 * admin_users table (no policies at all, so nothing short of the project
 * owner running a SQL INSERT can grant it), and every write below (removing
 * a post, resolving a report) is re-checked by that same function inside
 * the RPC it calls, not just by this page deciding to render.
 */
function Admin() {
  const {
    isAdmin,
    loading,
    error,
    reports,
    announcements,
    removeReportedPost,
    dismissReport,
    postAnnouncement,
    toggleAnnouncement,
    removeAnnouncement,
  } = useAdmin()
  const { show: showToast } = useToast()

  if (loading) return <div className="page" style={{ maxWidth: 760 }} />

  if (!isAdmin) {
    return (
      <div className="page" style={{ maxWidth: 760 }}>
        <RevealHeading as="h1" className="page-title">
          Not authorized
        </RevealHeading>
        <p className="page-subtitle">This page is only for admins.</p>
      </div>
    )
  }

  return (
    <div className="page" style={{ maxWidth: 760 }}>
      <RevealHeading as="h1" className="page-title">
        Admin
      </RevealHeading>

      {error && (
        <div className="card" style={{ padding: '16px 18px', marginBottom: 20 }}>
          <p style={{ fontSize: 13, color: 'var(--danger)', margin: 0 }}>{error}</p>
        </div>
      )}

      <section style={{ marginBottom: 32 }}>
        <div className="micro-label" style={{ marginBottom: 12 }}>
          Open reports ({reports.length})
        </div>
        {reports.length === 0 ? (
          <div className="card" style={{ padding: '18px 20px' }}>
            <p style={{ fontSize: 13.5, color: 'var(--mute)', margin: 0 }}>Nothing to review right now.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {reports.map((r) => (
              <ReportRow
                key={r.report.id}
                detail={r}
                onRemovePost={(reason) =>
                  removeReportedPost(r.report.id, r.report.postId, reason)
                    .then(() => showToast('Post removed', 'success'))
                    .catch((err) => showToast(getErrorMessage(err, 'Could not remove the post — try again.'), 'error'))
                }
                onDismiss={() =>
                  dismissReport(r.report.id)
                    .then(() => showToast('Report dismissed', 'success'))
                    .catch((err) => showToast(getErrorMessage(err, 'Could not dismiss — try again.'), 'error'))
                }
              />
            ))}
          </div>
        )}
      </section>

      <section>
        <div className="micro-label" style={{ marginBottom: 12 }}>
          Announcements
        </div>
        <AnnouncementComposer
          onPost={(body) =>
            postAnnouncement(body).catch((err) => showToast(getErrorMessage(err, 'Could not post — try again.'), 'error'))
          }
        />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 14 }}>
          {announcements.map((a) => (
            <div key={a.id} className="card" style={{ padding: '14px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
              <p style={{ fontSize: 13.5, color: a.active ? 'var(--cream)' : 'var(--mute)', margin: 0, flex: 1, minWidth: 200 }}>{a.body}</p>
              <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                <button
                  type="button"
                  className="btn-outline"
                  style={{ fontSize: 12 }}
                  onClick={() =>
                    toggleAnnouncement(a.id, !a.active).catch((err) => showToast(getErrorMessage(err, 'Could not update — try again.'), 'error'))
                  }
                >
                  {a.active ? 'Retire' : 'Reactivate'}
                </button>
                <button
                  type="button"
                  className="btn-outline"
                  style={{ fontSize: 12, color: 'var(--mute)' }}
                  onClick={() =>
                    removeAnnouncement(a.id).catch((err) => showToast(getErrorMessage(err, 'Could not delete — try again.'), 'error'))
                  }
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}

function ReportRow({
  detail,
  onRemovePost,
  onDismiss,
}: {
  detail: ReportWithPost
  onRemovePost: (reason: string) => void
  onDismiss: () => void
}) {
  const { report, reporterUsername, post, authorUsername } = detail
  const [confirmRemove, setConfirmRemove] = useState(false)
  const [reason, setReason] = useState('')

  return (
    <div className="card" style={{ padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8, fontSize: 12, color: 'var(--mute)' }}>
        <span>
          Reported by <strong style={{ color: 'var(--cream)' }}>{reporterUsername}</strong> — {REASON_LABEL[report.reason] ?? report.reason}
        </span>
      </div>
      {report.details && <p style={{ fontSize: 13, color: 'var(--mute)', margin: 0, fontStyle: 'italic' }}>"{report.details}"</p>}

      {post ? (
        <div style={{ borderLeft: '2px solid var(--line)', paddingLeft: 12 }}>
          <div style={{ fontSize: 12, color: 'var(--mute)', marginBottom: 4 }}>Post by {authorUsername}</div>
          <p style={{ fontSize: 13.5, color: 'var(--cream)', margin: 0, whiteSpace: 'pre-wrap' }}>{post.body}</p>
        </div>
      ) : (
        <p style={{ fontSize: 13, color: 'var(--mute)', margin: 0 }}>(The author already deleted this post.)</p>
      )}

      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, flexWrap: 'wrap' }}>
        {confirmRemove ? (
          <>
            <input
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Reason (shown to no one but the moderation log)"
              style={{ flex: 1, minWidth: 160, padding: '7px 10px', borderRadius: 8, border: '1px solid var(--line)', background: 'transparent', color: 'var(--cream)', fontSize: 12.5 }}
            />
            <button
              type="button"
              className="btn btn-danger"
              style={{ padding: '6px 12px', fontSize: 12 }}
              onClick={() => {
                onRemovePost(reason)
                setConfirmRemove(false)
                setReason('')
              }}
            >
              Confirm remove
            </button>
            <button type="button" className="btn-outline" style={{ fontSize: 12, color: 'var(--mute)' }} onClick={() => setConfirmRemove(false)}>
              Cancel
            </button>
          </>
        ) : (
          <>
            <button type="button" className="btn-outline" style={{ fontSize: 12 }} onClick={onDismiss}>
              Dismiss
            </button>
            {post && (
              <button type="button" className="btn btn-danger" style={{ fontSize: 12 }} onClick={() => setConfirmRemove(true)}>
                Remove post
              </button>
            )}
          </>
        )}
      </div>
    </div>
  )
}

function AnnouncementComposer({ onPost }: { onPost: (body: string) => void }) {
  const [body, setBody] = useState('')

  function submit() {
    const trimmed = body.trim()
    if (!trimmed) return
    onPost(trimmed)
    setBody('')
  }

  return (
    <div className="card" style={{ padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: 10 }}>
      <textarea
        value={body}
        onChange={(e) => setBody(e.target.value.slice(0, 500))}
        placeholder="Write an announcement for everyone..."
        rows={2}
        style={{
          width: '100%',
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
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: 11, color: 'var(--mute)' }}>{body.length}/500</span>
        <button type="button" className="btn" disabled={!body.trim()} onClick={submit}>
          Post announcement
        </button>
      </div>
    </div>
  )
}

export default Admin
