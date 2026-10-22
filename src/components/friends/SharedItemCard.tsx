import { useMemo } from 'react'
import { motion } from 'framer-motion'
import TriStateRing from './TriStateRing'
import { cycleMark, toDateStr } from '../../utils/habits'
import { computeSharedStreak, finishOrderFor, stateFor } from '../../utils/sharedTracking'
import type { SharedItemWithDetail } from '../../types/friends'
import type { HabitMark } from '../../types'

interface Props {
  detail: SharedItemWithDetail
  currentUserId: string
  onSetMyState: (sharedItemId: string, date: string, state: HabitMark) => void
  onCheer: (sharedItemId: string, toUserId: string) => void
  onAcceptInvite: (sharedItemId: string) => void
  onDeclineInvite: (sharedItemId: string) => void
  onLeave: (sharedItemId: string) => void
  onRemoveMember: (sharedItemId: string, userId: string) => void
  onDelete: (sharedItemId: string) => void
}

const ITEM_TYPE_LABEL: Record<string, string> = { habit: 'Habit', course: 'Course' }

/** The "together" card — avatars + each person's state, who finished first today, shared streak, and a cheer button. */
function SharedItemCard({
  detail,
  currentUserId,
  onSetMyState,
  onCheer,
  onAcceptInvite,
  onDeclineInvite,
  onLeave,
  onRemoveMember,
  onDelete,
}: Props) {
  const today = toDateStr(new Date())
  const { item, members, logs, isOwner, myStatus, ownerUsername } = detail

  // "Participants" = the owner plus every accepted member — invited-but-
  // not-yet-accepted and left/removed people don't count toward the
  // together view or the shared streak.
  const participants = useMemo(() => {
    const list: { userId: string; username: string }[] = [{ userId: item.ownerId, username: ownerUsername }]
    for (const m of members) {
      if (m.status === 'accepted') list.push({ userId: m.userId, username: m.username })
    }
    return list
  }, [item.ownerId, ownerUsername, members])

  const streak = useMemo(
    () => computeSharedStreak(logs, participants.map((p) => p.userId)),
    [logs, participants]
  )
  const finishedToday = useMemo(
    () => finishOrderFor(logs.map((l) => ({ userId: l.userId, date: l.date, state: l.state, updatedAt: l.updatedAt })), today),
    [logs, today]
  )
  const firstFinisher = finishedToday[0]

  if (myStatus === 'invited') {
    return (
      <div className="card" style={{ borderLeft: '3px solid var(--gold)' }}>
        <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 6 }}>{item.title}</div>
        <p style={{ fontSize: 13, color: 'var(--mute)', marginBottom: 14 }}>
          {ownerUsername} wants to share this {ITEM_TYPE_LABEL[item.itemType].toLowerCase()} with you.
        </p>
        <div style={{ display: 'flex', gap: 10 }}>
          <button type="button" className="btn" style={{ padding: '7px 16px', fontSize: 12.5 }} onClick={() => onAcceptInvite(item.id)}>
            Accept
          </button>
          <button type="button" className="btn-outline" onClick={() => onDeclineInvite(item.id)}>
            Decline
          </button>
        </div>
      </div>
    )
  }

  function handleRingClick(userId: string) {
    if (userId !== currentUserId) return
    const current = stateFor(logs, currentUserId, today)
    onSetMyState(item.id, today, cycleMark(current))
  }

  return (
    <div className="card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, marginBottom: 14 }}>
        <div>
          <div style={{ fontWeight: 700, fontSize: 15 }}>{item.title}</div>
          <div style={{ fontSize: 11.5, color: 'var(--mute)', marginTop: 2 }}>
            {ITEM_TYPE_LABEL[item.itemType]} · shared by {ownerUsername}
          </div>
        </div>
        {streak > 0 && (
          <motion.span
            initial={{ opacity: 0, scale: 0.6 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: 'spring', stiffness: 400, damping: 15 }}
            style={{ fontSize: 12, color: 'var(--gold)', fontWeight: 700, whiteSpace: 'nowrap' }}
          >
            ✦ {streak}d together
          </motion.span>
        )}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 14 }}>
        {participants.map((p) => {
          const isMe = p.userId === currentUserId
          const state = stateFor(logs, p.userId, today)
          const finishedIndex = finishedToday.findIndex((f) => f.userId === p.userId)
          return (
            <div key={p.userId} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <span
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: '50%',
                  background: 'var(--gradient-primary)',
                  color: 'var(--ink)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 12,
                  fontWeight: 700,
                  flexShrink: 0,
                }}
              >
                {p.username.charAt(0).toUpperCase()}
              </span>
              <span style={{ flex: 1, fontSize: 13.5, fontWeight: isMe ? 700 : 500, minWidth: 0 }}>
                {p.username} {isMe && <span style={{ color: 'var(--mute)', fontWeight: 400 }}>(you)</span>}
                {finishedIndex === 0 && <span style={{ color: 'var(--gold)', fontSize: 11.5, marginLeft: 6 }}>finished first today</span>}
              </span>
              {!isMe && (
                <button
                  type="button"
                  className="btn-outline"
                  style={{ fontSize: 11, padding: '3px 9px' }}
                  onClick={() => onCheer(item.id, p.userId)}
                  title={`Cheer ${p.username} on`}
                >
                  ✦ Cheer
                </button>
              )}
              <TriStateRing state={state} onClick={isMe ? () => handleRingClick(p.userId) : undefined} size={30} />
            </div>
          )
        })}
      </div>

      {firstFinisher && (
        <p style={{ fontSize: 11.5, color: 'var(--mute)', marginBottom: 10 }}>
          {participants.find((p) => p.userId === firstFinisher.userId)?.username ?? 'Someone'} finished today's at{' '}
          {new Date(firstFinisher.finishedAt).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}.
        </p>
      )}

      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
        {isOwner ? (
          <button type="button" className="btn-outline" style={{ fontSize: 11.5, opacity: 0.75 }} onClick={() => onDelete(item.id)}>
            Delete this share
          </button>
        ) : (
          <button type="button" className="btn-outline" style={{ fontSize: 11.5, opacity: 0.75 }} onClick={() => onLeave(item.id)}>
            Leave
          </button>
        )}
        {isOwner &&
          members
            .filter((m) => m.status === 'accepted')
            .map((m) => (
              <button
                key={m.userId}
                type="button"
                className="btn-outline"
                style={{ fontSize: 11.5, opacity: 0.6 }}
                onClick={() => onRemoveMember(item.id, m.userId)}
              >
                Remove {m.username}
              </button>
            ))}
      </div>
    </div>
  )
}

export default SharedItemCard
