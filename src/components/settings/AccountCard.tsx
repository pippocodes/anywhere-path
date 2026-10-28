import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { useApp } from '../../hooks/useApp'
import { buildExportPayload } from '../../utils/exportData'
import Card from '../ui/Card'
import Button from '../ui/Button'
import DeleteAccountModal from './DeleteAccountModal'

/** Settings' Account card: read-only email, log out, data export, and the delete-account danger zone. */
function AccountCard() {
  const { user, signOut } = useAuth()
  const { data } = useApp()
  const navigate = useNavigate()
  const [deleteOpen, setDeleteOpen] = useState(false)

  async function handleSignOut() {
    await signOut()
    navigate('/')
  }

  function handleExport() {
    const payload = buildExportPayload(data)
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `anywhere-path-export-${new Date().toISOString().slice(0, 10)}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  return (
    <>
      <Card style={{ marginBottom: 24 }}>
        <h3 style={{ fontSize: 17, marginBottom: 14 }}>Account</h3>
        <div className="settings-row" style={{ display: 'flex', justifyContent: 'space-between', gap: 12, fontSize: 13.5, marginBottom: 20 }}>
          <span style={{ color: 'var(--mute)' }}>Email</span>
          <span style={{ fontWeight: 600, overflowWrap: 'anywhere' }}>{user?.email ?? '—'}</span>
        </div>

        <Button variant="secondary" onClick={handleSignOut} style={{ marginBottom: 24 }}>
          Log out
        </Button>

        <div style={{ borderTop: '1px solid var(--line)', paddingTop: 20, marginBottom: 20 }}>
          <div style={{ fontSize: 13.5, fontWeight: 600, marginBottom: 4 }}>Export your data</div>
          <p style={{ fontSize: 12.5, color: 'var(--mute)', marginBottom: 12 }}>
            Download everything — courses, habits, roadmaps, and plans — as one JSON file.
          </p>
          <Button variant="secondary" onClick={handleExport}>
            Export as JSON
          </Button>
        </div>

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
