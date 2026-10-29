import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { useApp } from '../../hooks/useApp'
import { useAuth } from '../../context/AuthContext'
import { useTodayItems, type TodayItem } from '../../hooks/useTodayItems'
import { bestCurrentStreak, toDateStr } from '../../utils/habits'
import { findModuleIdForTopic } from '../../utils/nextIncomplete'
import TriStateRing from '../friends/TriStateRing'
import AnimatedCheckbox from '../motion/AnimatedCheckbox'
import RevealHeading from '../ui/RevealHeading'

const KIND_LABEL: Record<TodayItem['kind'], string> = {
  habit: 'Habit',
  planStep: 'Plan step',
  courseTopic: 'Course lesson',
  roadmapStep: 'Roadmap step',
  sharedItem: 'Shared tracker',
}

/** Signed-in Home: what to study now, one tap to mark it, the streak. No AI anywhere on this screen. */
function TodayHome() {
  const { username } = useAuth()
  const { data, cycleHabitMark, togglePlanStep, toggleTopic, updateRoadmapDoc } = useApp()
  const items = useTodayItems()
  const navigate = useNavigate()
  const today = toDateStr(new Date())

  const habitsById = useMemo(() => new Map(data.habits.map((h) => [h.id, h])), [data.habits])
  const streak = useMemo(() => bestCurrentStreak(data.habits.filter((h) => !h.archived)), [data.habits])

  function habitMark(habitId: string) {
    return habitsById.get(habitId)?.marks[today] ?? 0
  }

  function complete(item: TodayItem) {
    switch (item.kind) {
      case 'habit':
        cycleHabitMark(item.id, today)
        return
      case 'planStep': {
        const [planId, stepId] = item.id.split(':')
        togglePlanStep(planId, stepId)
        return
      }
      case 'courseTopic': {
        const [courseId, topicId] = item.id.split(':')
        const course = data.courses.find((c) => c.id === courseId)
        const moduleId = course ? findModuleIdForTopic(course, topicId) : null
        if (moduleId) toggleTopic(courseId, moduleId, topicId)
        return
      }
      case 'roadmapStep': {
        const [docId, nodeId] = item.id.split(':')
        const doc = data.roadmapDocs.find((d) => d.id === docId)
        if (doc) updateRoadmapDoc(docId, { completedPaths: [...(doc.completedPaths ?? []), nodeId] })
        return
      }
      case 'sharedItem':
        // Shared trackers need everyone's state visible, not a blind one-tap
        // mark from here — go to the real card, same as the catch-up sheet does.
        navigate(item.href)
    }
  }

  return (
    <div className="page" style={{ maxWidth: 640 }}>
      <RevealHeading as="h1" className="page-title">
        {username ? `Hi, ${username}` : 'Today'}
      </RevealHeading>

      {streak > 0 && (
        <p style={{ fontSize: 13.5, color: 'var(--gold)', fontWeight: 600, marginBottom: 20 }}>✦ {streak}d streak</p>
      )}

      {items.length === 0 ? (
        <div className="card" style={{ padding: '20px 22px', textAlign: 'center' }}>
          <p style={{ fontSize: 14, color: 'var(--mute)', margin: 0 }}>
            Nothing left for today — everything due is done. Come back tomorrow.
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <AnimatePresence initial={false}>
          {items.map((item) => (
            <motion.div
              key={`${item.kind}-${item.id}`}
              layout
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="card"
              style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 16px' }}
            >
              {item.kind === 'habit' ? (
                <TriStateRing state={habitMark(item.id)} onClick={() => complete(item)} size={28} label={item.title} />
              ) : item.kind === 'sharedItem' ? (
                <button
                  type="button"
                  className="btn-outline"
                  style={{ fontSize: 11.5, padding: '5px 10px', flexShrink: 0 }}
                  onClick={() => complete(item)}
                >
                  Open
                </button>
              ) : (
                <AnimatedCheckbox checked={false} onChange={() => complete(item)} ariaLabel={`Mark "${item.title}" done`} />
              )}
              <button
                type="button"
                onClick={() => navigate(item.href)}
                style={{ flex: 1, textAlign: 'left', background: 'none', border: 'none', minWidth: 0 }}
              >
                <div style={{ fontSize: 10.5, color: 'var(--mute)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.3 }}>
                  {KIND_LABEL[item.kind]}
                </div>
                <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--cream)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {item.title}
                </div>
              </button>
            </motion.div>
          ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  )
}

export default TodayHome
