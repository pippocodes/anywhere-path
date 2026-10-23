import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import Card from '../ui/Card'
import Button from '../ui/Button'
import DeleteAccountModal from './DeleteAccountModal'

/** Settings' Account card: read-only email, log out, and the delete-account danger zone. */
function AccountCard() {
  const { user, signOut } = useAuth()
  const navigate = useNavigate()
  const [deleteOpen, setDeleteOpen] = useState(false)

  async function handleSignOut() {
    await signOut()
    navigate('/')
  }

  return (
    <>
      <Card style={{ marginBottom: 24 }}>
        <h3 style={{ fontSize: 17, marginBottom: 14 }}>Account</h3>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, fontSize: 13.5, marginBottom: 20 }}>
          <span style={{ color: 'var(--mute)' }}>Email</span>
          <span style={{ fontWeight: 600, overflowWrap: 'anywhere' }}>{user?.email ?? '—'}</span>
        </div>

        <Button variant="secondary" onClick={handleSignOut} style={{ marginBottom: 24 }}>
          Log out
        </Button>

        <div style={{ borderTop: '1px solid var(--line)', paddingTop: 20 }}>
          <div style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--danger)', marginBottom: 4 }}>Danger zone</div>
          <p style={{ fontSize: 12.5, color: 'var(--mute)', marginBottom: 12 }}>
            Permanently delete your account and everything tied to it. This can't be undone.
          </p>
          <Button variant="danger" onClick={() => setDeleteOpen(true)}>
            Delete account
          </Button>
        </div>
      </Card>

      <DeleteAccountModal open={deleteOpen} onClose={() => setDeleteOpen(false)} />
    </>
  )
}

export default AccountCard
