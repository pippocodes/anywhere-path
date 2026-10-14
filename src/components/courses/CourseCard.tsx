import { useNavigate } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import type { Course, HabitCategory } from '../../types'
import { computeCourseStats } from '../../utils/courseStats'
import { formatDuration } from '../../utils/duration'
import ProgressRing from '../habits/ProgressRing'
import CategoryChip from '../categories/CategoryChip'
import ModuleAccordionRow from './ModuleAccordionRow'
import { useExpandedRows } from '../../hooks/useExpandedRows'

interface Props {
  course: Course
  categories: HabitCategory[]
  onToggleTopic: (courseId: string, moduleId: string, topicId: string) => void
  onRequestDelete: () => void
}

/** A course card that expands in place into its subtopic/module tree — course -> subtopic -> module, each row showing its own rolled-up time. Full editing (rename, add, schedule) stays on the course's own page, reached via "Open". */
function CourseCard({ course, categories, onToggleTopic, onRequestDelete }: Props) {
  const navigate = useNavigate()
  const stats = computeCourseStats(course)
  const meta = [course.platform, course.instructor].filter(Boolean).join(' · ')
  const { isOpen, toggle } = useExpandedRows()
  const expanded = isOpen(course.id)
  const hasModules = course.modules.length > 0

  return (
    <motion.div
      className="card"
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.97 }}
      transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
      style={{ position: 'relative' }}
    >
      <button
        type="button"
        onClick={onRequestDelete}
        aria-label={`Delete ${course.name}`}
        style={{
          position: 'absolute',
          top: 14,
          right: 14,
          width: 26,
          height: 26,
          borderRadius: '50%',
          border: '1px solid var(--line)',
          background: 'var(--surface)',
          color: 'var(--mute)',
          fontSize: 12,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1,
        }}
      >
        ✕
      </button>

      <button
        type="button"
        onClick={() => hasModules && toggle(course.id)}
        aria-expanded={expanded}
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          gap: 20,
          background: 'none',
          border: 'none',
          padding: 0,
          cursor: hasModules ? 'pointer' : 'default',
          textAlign: 'left',
        }}
      >
        <ProgressRing percent={stats.percent} size={64} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginBottom: 4, paddingRight: 32 }}>
            <h3 style={{ fontSize: 18, margin: 0 }}>{course.name}</h3>
            <CategoryChip categories={categories} categoryId={course.categoryId} />
            {hasModules && (
              <motion.span
                animate={{ rotate: expanded ? 90 : 0 }}
                transition={{ duration: 0.2 }}
                style={{ display: 'inline-block', color: 'var(--mute)', fontSize: 14 }}
                aria-hidden
              >
                ›
              </motion.span>
            )}
          </div>
          {meta && <div style={{ fontSize: 12.5, color: 'var(--mute)', marginBottom: 6 }}>{meta}</div>}
          <div style={{ fontSize: 12.5, color: 'var(--mute)' }}>
            {stats.lecturesDone}/{stats.lecturesTotal} modules · {formatDuration(stats.totalSeconds)} total
            {stats.lecturesTotal > 0 && <> · {formatDuration(stats.remainingSeconds)} left</>}
          </div>
        </div>
      </button>

      <AnimatePresence initial={false}>
        {expanded && hasModules && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25, ease: [0.2, 0.8, 0.2, 1] }}
            style={{ overflow: 'hidden' }}
          >
            <div style={{ marginTop: 16, borderTop: '1px solid var(--line)', paddingTop: 10 }}>
              {course.modules.map((subtopic) => (
                <ModuleAccordionRow
                  key={subtopic.id}
                  courseId={course.id}
                  module={subtopic}
                  depth={1}
                  isOpen={isOpen}
                  onToggleOpen={toggle}
                  onToggleTopic={onToggleTopic}
                />
              ))}
              <button
                type="button"
                onClick={() => navigate(`/courses/${course.id}`)}
                className="btn-outline"
                style={{ marginTop: 14, fontSize: 12.5 }}
              >
                Open course
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

export default CourseCard
