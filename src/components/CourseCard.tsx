import { useState } from 'react'
import { Link } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import type { Course } from '../types'
import { useCourseProgress } from '../hooks/useCourseProgress'
import ModuleCard from './ModuleCard'
import TiltCard from './motion/TiltCard'
import CountUp from './motion/CountUp'

interface Props {
  course: Course
  onToggleTopic: (courseId: string, moduleId: string, topicId: string) => void
  onDelete: (courseId: string) => void
}

function CourseCard({ course, onToggleTopic, onDelete }: Props) {
  const [expanded, setExpanded] = useState(false)
  const [confirmingDelete, setConfirmingDelete] = useState(false)
  const { done, total, percent } = useCourseProgress(course)

  return (
    <TiltCard className="card" maxTilt={3} style={{ marginBottom: 24 }}>
      <div
        className="expandable-header"
        style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', cursor: 'pointer' }}
        onClick={() => setExpanded((e) => !e)}
      >
        <div>
          <h3 style={{ fontSize: 20 }}>{course.name}</h3>
          <div style={{ fontSize: 13, color: 'var(--mute)', marginTop: 4 }}>
            <CountUp value={done} /> of {total} topics complete
          </div>
        </div>
        <motion.div
          animate={{ rotate: expanded ? 180 : 0 }}
          transition={{ duration: 0.2 }}
          style={{ fontSize: 20, color: 'var(--cherry)' }}
        >
          {expanded ? '−' : '+'}
        </motion.div>
      </div>

      <div className="progress-track" style={{ marginTop: 16 }}>
        <motion.div
          className="progress-fill"
          initial={false}
          animate={{ width: `${percent}%` }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        />
      </div>

      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            style={{ overflow: 'hidden' }}
          >
            <div style={{ marginTop: 22, display: 'flex', flexDirection: 'column', gap: 16 }}>
              {course.modules.map((mod) => (
                <ModuleCard
                  key={mod.id}
                  courseModule={mod}
                  onToggleTopic={(moduleId, topicId) => onToggleTopic(course.id, moduleId, topicId)}
                />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div
        style={{
          marginTop: 20,
          paddingTop: 16,
          borderTop: '1px solid var(--pink-paler)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <Link to={`/roadmap/${course.id}`} className="btn-outline">
          Build Roadmap
        </Link>

        {confirmingDelete ? (
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <span style={{ fontSize: 13, color: 'var(--plum)' }}>Delete this course permanently?</span>
            <button className="btn btn-danger" style={{ padding: '7px 14px', fontSize: 12.5 }} onClick={() => onDelete(course.id)}>
              Yes, delete
            </button>
            <button className="btn-outline" style={{ color: 'var(--mute)' }} onClick={() => setConfirmingDelete(false)}>
              Cancel
            </button>
          </div>
        ) : (
          <button
            className="btn-outline"
            style={{ opacity: 0.75, fontSize: 12.5 }}
            onClick={() => setConfirmingDelete(true)}
          >
            Delete Course
          </button>
        )}
      </div>
    </TiltCard>
  )
}

export default CourseCard
