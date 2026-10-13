import { useState, useCallback } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import type { CourseModule } from '../types'
import { useModuleProgress } from '../hooks/useCourseProgress'
import TopicRow from './TopicRow'
import CountUp from './motion/CountUp'

interface Props {
  courseModule: CourseModule
  onToggleTopic: (moduleId: string, topicId: string) => void
}

function ModuleCard({ courseModule, onToggleTopic }: Props) {
  const [expanded, setExpanded] = useState(false)
  const { percent } = useModuleProgress(courseModule)

  const handleToggle = useCallback(
    (topicId: string) => onToggleTopic(courseModule.id, topicId),
    [courseModule.id, onToggleTopic]
  )

  return (
    <div style={{ background: 'var(--bg)', borderRadius: 14, padding: '16px 18px' }}>
      <div
        className="expandable-header"
        style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}
        onClick={() => setExpanded((e) => !e)}
      >
        <div style={{ fontWeight: 700, fontSize: 15, color: 'var(--plum)' }}>{courseModule.name}</div>
        <div style={{ fontSize: 13, color: 'var(--cherry)', fontWeight: 600 }}>
          <CountUp value={percent} suffix="%" />
        </div>
      </div>
      <div style={{ height: 6, borderRadius: 4, background: 'var(--pink-paler)', marginTop: 10, overflow: 'hidden' }}>
        <motion.div
          initial={false}
          animate={{ width: `${percent}%` }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          style={{ height: '100%', borderRadius: 4, background: 'var(--pink-light)' }}
        />
      </div>

      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            style={{ overflow: 'hidden' }}
          >
            <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
              {courseModule.topics.map((topic) => (
                <TopicRow key={topic.id} topic={topic} onToggle={handleToggle} />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default ModuleCard
