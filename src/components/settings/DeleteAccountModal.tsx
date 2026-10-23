import { useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import Modal from '../ui/Modal'
import Button from '../ui/Button'

interface Props {
  open: boolean
  onClose: () => void
}

/** Type-your-username-to-confirm danger-zone modal — deletes the account server-side via /api/delete-account (service role, cascades everything). */
function DeleteAccountModal({ open, onClose }: Props) {
  const { username, session, signOut } = useAuth()
  const [confirmText, setConfirmText] = useState('')
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const canDelete = username !== null && confirmText === username

  function handleClose() {
    if (deleting) return
    setConfirmText('')
    setError(null)
    onClose()
  }

  async function handleDelete() {
    if (!canDelete) return
    setDeleting(true)
    setError(null)
    try {
      const res = await fetch('/api/delete-account', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}),
        },
        body: JSON.stringify({ confirmUsername: confirmText }),
      })
      const body = await res.json().catch(() => null)
      if (!res.ok) {
        setError(body?.message || 'Could not delete your account — try again.')
        setDeleting(false)
        return
      }
      await signOut()
      window.location.href = '/'
    } catch {
      setError('Could not reach the server — check your connection and try again.')
      setDeleting(false)
    }
  }

  return (
    <Modal open={open} onClose={handleClose} title="Delete your account">
      <p style={{ fontSize: 13.5, color: 'var(--mute)', lineHeight: 1.6, marginBottom: 16 }}>
        This permanently deletes your account and everything tied to it — courses, roadmaps, habits, friends,
        and any shared trackers you're part of. There's no undo.
      </p>
      <div className="field" style={{ marginBottom: 16 }}>
        <label htmlFor="delete-confirm">
          Type <strong>{username}</strong> to confirm
        </label>
        <input
          id="delete-confirm"
          type="text"
          autoComplete="off"
          value={confirmText}
          onChange={(e) => setConfirmText(e.target.value)}
          disabled={deleting}
        />
      </div>
      {error && <div className="auth-notice auth-notice-error" style={{ marginBottom: 16 }}>{error}</div>}
      <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
        <Button variant="secondary" onClick={handleClose} disabled={deleting}>
          Cancel
        </Button>
        <Button variant="danger" onClick={handleDelete} disabled={!canDelete} loading={deleting}>
          Delete my account
        </Button>
      </div>
    </Modal>
  )
}

export default DeleteAccountModal
