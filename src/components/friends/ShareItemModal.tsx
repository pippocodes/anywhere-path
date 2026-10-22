import { useEffect, useState } from 'react'
import Modal from '../ui/Modal'
import Pills from '../ui/Pills'
import Button from '../ui/Button'
import UpgradeToSharePanel from './UpgradeToSharePanel'
import { getErrorMessage } from '../../lib/friendsApi'
import type { Course, Habit } from '../../types'
import type { FriendEntry, SharedItemType } from '../../types/friends'

interface Props {
  open: boolean
  onClose: () => void
  courses: Course[]
  habits: Habit[]
  friends: FriendEntry[]
  preselectedFriendId: string | null
  ownedSharedItemCount: number
  onShare: (itemType: SharedItemType, itemId: string, title: string, memberIds: string[]) => Promise<'ok' | 'limit'>
}

const SOURCE_OPTIONS = [
  { value: 'habit', label: 'A habit' },
  { value: 'course', label: 'A course' },
]

/** Share one of the user's own habits or courses with chosen friends — blocked server-side past 2 owned shared items. */
function ShareItemModal({ open, onClose, courses, habits, friends, preselectedFriendId, ownedSharedItemCount, onShare }: Props) {
  const [itemType, setItemType] = useState<SharedItemType>('habit')
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null)
  const [selectedFriendIds, setSelectedFriendIds] = useState<Set<string>>(
    new Set(preselectedFriendId ? [preselectedFriendId] : [])
  )
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showLimit, setShowLimit] = useState(false)

  function reset() {
    setItemType('habit')
    setSelectedItemId(null)
    setSelectedFriendIds(new Set(preselectedFriendId ? [preselectedFriendId] : []))
    setError(null)
    setShowLimit(false)
  }

  // The modal stays mounted (Modal just toggles visibility), so each fresh
  // open needs to re-pick up whichever friend triggered it this time.
  useEffect(() => {
    if (open) reset()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, preselectedFriendId])

  function handleClose() {
    reset()
    onClose()
  }

  function toggleFriend(id: string) {
    setSelectedFriendIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  async function handleSubmit() {
    if (!selectedItemId || selectedFriendIds.size === 0) return
    const source = itemType === 'habit' ? habits.find((h) => h.id === selectedItemId) : courses.find((c) => c.id === selectedItemId)
    if (!source) return

    setSubmitting(true)
    setError(null)
    try {
      const result = await onShare(itemType, selectedItemId, source.name, [...selectedFriendIds])
      if (result === 'limit') {
        setShowLimit(true)
      } else {
        handleClose()
      }
    } catch (err) {
      setError(getErrorMessage(err, 'Could not share — try again.'))
    } finally {
      setSubmitting(false)
    }
  }

  if (showLimit) {
    return (
      <Modal open={open} onClose={handleClose} title="Share more">
        <UpgradeToSharePanel ownedCount={ownedSharedItemCount} onClose={handleClose} />
      </Modal>
    )
  }

  const sourceItems = itemType === 'habit' ? habits : courses
  const canSubmit = !!selectedItemId && selectedFriendIds.size > 0 && !submitting

  return (
    <Modal open={open} onClose={handleClose} title="Share with friends">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {error && <div className="auth-notice auth-notice-error">{error}</div>}

        <div>
          <div className="micro-label" style={{ marginBottom: 8 }}>
            What to share
          </div>
          <Pills
            options={SOURCE_OPTIONS}
            value={itemType}
            onChange={(v) => {
              setItemType(v as SharedItemType)
              setSelectedItemId(null)
            }}
            layoutId="share-item-type-pills"
            size="sm"
          />
        </div>

        <div style={{ maxHeight: 160, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 6 }}>
          {sourceItems.length === 0 ? (
            <p style={{ fontSize: 12.5, color: 'var(--mute)' }}>
              {itemType === 'habit' ? "You don't have any habits yet." : "You don't have any courses yet."}
            </p>
          ) : (
            sourceItems.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setSelectedItemId(item.id)}
                style={{
                  textAlign: 'left',
                  fontSize: 13,
                  padding: '8px 12px',
                  borderRadius: 8,
                  border: selectedItemId === item.id ? '1px solid var(--gold)' : '1px solid var(--line)',
                  background: 'var(--surface)',
                  color: 'var(--cream)',
                }}
              >
                {item.name}
              </button>
            ))
          )}
        </div>

        <div>
          <div className="micro-label" style={{ marginBottom: 8 }}>
            With
          </div>
          {friends.length === 0 ? (
            <p style={{ fontSize: 12.5, color: 'var(--mute)' }}>Add a friend first to share something with them.</p>
          ) : (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {friends.map((f) => {
                const active = selectedFriendIds.has(f.otherUserId)
                return (
                  <button
                    key={f.friendship.id}
                    type="button"
                    onClick={() => toggleFriend(f.otherUserId)}
                    style={{
                      fontSize: 12.5,
                      padding: '6px 12px',
                      borderRadius: 999,
                      border: active ? '1px solid var(--gold)' : '1px solid var(--line)',
                      background: active ? 'color-mix(in srgb, var(--accent) 12%, transparent)' : 'transparent',
                      color: 'var(--cream)',
                    }}
                  >
                    {f.otherUsername}
                  </button>
                )
              })}
            </div>
          )}
        </div>

        <div style={{ display: 'flex', gap: 10 }}>
          <Button onClick={handleSubmit} disabled={!canSubmit}>
            {submitting ? 'Sharing…' : 'Share'}
          </Button>
          <Button variant="secondary" onClick={handleClose}>
            Cancel
          </Button>
        </div>
      </div>
    </Modal>
  )
}

export default ShareItemModal
