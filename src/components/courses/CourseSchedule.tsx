import { useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import type { Course, HabitCategory } from '../../types'
import { scheduleCourse } from '../../utils/courseScheduler'
import { formatDateLabel } from '../../utils/scheduler'
import { formatDuration } from '../../utils/duration'
import { categoryColor } from '../../utils/courseCategory'
import { toDateStr } from '../../utils/habits'
import ChevronIcon from '../ui/ChevronIcon'

interface Props {
  course: Pick<Course, 'modules' | 'startDate' | 'hoursPerDay' | 'weekdays' | 'categoryId'>
  categories: HabitCategory[]
}

const DEFAULT_WEEKDAYS = [0, 1, 2, 3, 4, 5, 6]

/** The weekly planner for one course — same schedule-by-start-date-and-hours-per-day idea as the outline roadmap's, accented with the course's own category colour. */
function CourseSchedule({ course, categories }: Props) {
  const [collapsed, setCollapsed] = useState(true)
  const accent = categoryColor(categories, course.categoryId)

  const schedule = useMemo(
    () =>
      scheduleCourse(course.modules, {
        startDate: course.startDate ?? toDateStr(new Date()),
        hoursPerDay: course.hoursPerDay ?? 0,
        weekdays: course.weekdays ?? DEFAULT_WEEKDAYS,
      }),
    [course.modules, course.startDate, course.hoursPerDay, course.weekdays]
  )

  if (schedule.items.length === 0) return null

  return (
    <div className="card" style={{ borderLeft: `3px solid ${accent}` }}>
      <button
        type="button"
        onClick={() => setCollapsed((v) => !v)}
        style={{
          width: '100%',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: 12,
          background: 'none',
          border: 'none',
          padding: 0,
          cursor: 'pointer',
          textAlign: 'left',
        }}
        aria-expanded={!collapsed}
      >
        <div>
          <span className="micro-label" style={{ marginBottom: 4, display: 'block' }}>
            Weekly planner
          </span>
          <span style={{ fontSize: 13.5, color: 'var(--mute)' }}>
            Started {formatDateLabel(course.startDate ?? toDateStr(new Date()))}
            {schedule.finishDate && (
              <>
                {' '}
                → estimated finish <strong style={{ color: 'var(--cream)' }}>{formatDateLabel(schedule.finishDate)}</strong>
              </>
            )}
            {' '}· {schedule.totalDays} study day{schedule.totalDays === 1 ? '' : 's'}
          </span>
        </div>
        <motion.span animate={{ rotate: collapsed ? 0 : 180 }} transition={{ duration: 0.2 }} style={{ color: 'var(--mute)', display: 'flex' }}>
          <ChevronIcon />
        </motion.span>
      </button>

      <AnimatePresence initial={false}>
        {!collapsed && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25, ease: [0.2, 0.8, 0.2, 1] }}
            style={{ overflow: 'hidden' }}
          >
            <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 6 }}>
              {schedule.items.map((item) => (
                <div
                  key={item.topicId}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    gap: 12,
                    padding: '8px 4px',
                    borderBottom: '1px solid var(--line)',
                    fontSize: 13,
                  }}
                >
                  <span style={{ minWidth: 0 }}>
                    <span style={{ color: 'var(--cream)' }}>{item.name}</span>
                    {item.path.length > 0 && (
                      <span style={{ color: 'var(--mute)', fontSize: 11.5 }}> — {item.path.join(' / ')}</span>
                    )}
                  </span>
                  <span style={{ flexShrink: 0, display: 'flex', gap: 10, alignItems: 'center' }}>
                    <span style={{ color: 'var(--mute)', fontSize: 12 }}>
                      {item.startDate === item.endDate
                        ? formatDateLabel(item.startDate)
                        : `${formatDateLabel(item.startDate)} – ${formatDateLabel(item.endDate)}`}
                    </span>
                    <span className="outline-badge" style={{ fontSize: 11 }}>
                      {formatDuration(item.seconds)}
                    </span>
                  </span>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default CourseSchedule
