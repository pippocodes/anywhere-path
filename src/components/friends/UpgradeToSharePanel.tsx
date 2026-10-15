import { useState } from 'react'
import { motion } from 'framer-motion'
import Button from '../ui/Button'

interface Props {
  ownedCount: number
  onClose: () => void
}

/** Shown when the free-plan share limit (server-enforced) is hit on a 3rd owned shared item — no real payments, just a polished placeholder + optional "notify me". */
function UpgradeToSharePanel({ ownedCount, onClose }: Props) {
  const [notifyMe, setNotifyMe] = useState(false)

  return (
    <div style={{ textAlign: 'center', padding: '8px 4px' }}>
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: 'spring', stiffness: 300, damping: 18 }}
        style={{ fontSize: 32, color: 'var(--gold)', marginBottom: 12 }}
      >
        ✦
      </motion.div>
      <h4 style={{ fontSize: 18, marginBottom: 8 }}>You've reached the free plan limit</h4>
      <p style={{ fontSize: 13.5, color: 'var(--mute)', marginBottom: 20 }}>
        The free plan allows sharing up to 2 items at a time — you're currently sharing {ownedCount}. Subscriptions are
        coming soon to share more.
      </p>
      {notifyMe ? (
        <p style={{ fontSize: 13, color: 'var(--gold)', marginBottom: 20 }}>✦ You're on the list — we'll let you know.</p>
      ) : (
        <button
          type="button"
          className="btn-outline"
          style={{ fontSize: 13, marginBottom: 20 }}
          onClick={() => setNotifyMe(true)}
        >
          Notify me when it's ready
        </button>
      )}
      <div>
        <Button variant="secondary" onClick={onClose}>
          Got it
        </Button>
      </div>
    </div>
  )
}

export default UpgradeToSharePanel
