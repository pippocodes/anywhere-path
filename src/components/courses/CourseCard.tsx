import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import type { Course } from '../../types'
import { computeCourseStats } from '../../utils/courseStats'
import { formatDuration } from '../../utils/duration'
import ProgressRing from '../habits/ProgressRing'

function CourseCard({ course }: { course: Course }) {
  const navigate = useNavigate()
  const stats = computeCourseStats(course)
  const meta = [course.platform, course.instructor].filter(Boolean).join(' · ')

  return (
    <motion.div
      className="card"
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.97 }}
      transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
      onClick={() => navigate(`/courses/${course.id}`)}
      style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 20 }}
    >
      <ProgressRing percent={stats.percent} size={64} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <h3 style={{ fontSize: 18, marginBottom: 4 }}>{course.name}</h3>
        {meta && <div style={{ fontSize: 12.5, color: 'var(--mute)', marginBottom: 6 }}>{meta}</div>}
        <div style={{ fontSize: 12.5, color: 'var(--mute)' }}>
          {stats.lecturesDone}/{stats.lecturesTotal} lectures · {formatDuration(stats.totalSeconds)} total
          {stats.lecturesTotal > 0 && <> · {formatDuration(stats.remainingSeconds)} left</>}
        </div>
      </div>
    </motion.div>
  )
}

export default CourseCard
