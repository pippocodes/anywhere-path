import { AnimatePresence, motion } from 'framer-motion'
import type { CourseModule } from '../../types'
import { computeModuleStats } from '../../utils/courseStats'
import { formatDuration, getTopicSeconds } from '../../utils/duration'
import AnimatedCheckbox from '../motion/AnimatedCheckbox'

interface Props {
  courseId: string
  module: CourseModule
  depth: number // 1 = subtopic, 2+ = module/sub-module
  isOpen: (id: string) => boolean
  onToggleOpen: (id: string) => void
  onToggleTopic: (courseId: string, moduleId: string, topicId: string) => void
}

/** One subtopic/module row in the course accordion — recurses into nested modules, each leaf a tickable module with its own duration. Read + tick only; structural edits (rename/add/delete) stay on the full course page. */
function ModuleAccordionRow({ courseId, module, depth, isOpen, onToggleOpen, onToggleTopic }: Props) {
  const stats = computeModuleStats(module)
  const children = module.modules ?? []
  const hasChildren = module.topics.length > 0 || children.length > 0
  const open = isOpen(module.id)
  const label = depth === 1 ? 'Subtopic' : 'Module'

  return (
    <div style={{ marginLeft: depth > 1 ? 16 : 0 }}>
      <button
        type="button"
        onClick={() => hasChildren && onToggleOpen(module.id)}
        aria-expanded={open}
        aria-label={`${label}: ${module.name}`}
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 10,
          padding: '9px 4px',
          background: 'none',
          border: 'none',
          borderBottom: '1px solid var(--line)',
          cursor: hasChildren ? 'pointer' : 'default',
          textAlign: 'left',
        }}
      >
        <span style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
          {hasChildren ? (
            <motion.span
              animate={{ rotate: open ? 90 : 0 }}
              transition={{ duration: 0.2 }}
              style={{ display: 'inline-block', color: 'var(--mute)', fontSize: 13, flexShrink: 0 }}
            >
              ›
            </motion.span>
          ) : (
            <span style={{ width: 13, flexShrink: 0 }} />
          )}
          <span
            style={{
              fontSize: depth === 1 ? 14.5 : 13.5,
              fontWeight: depth === 1 ? 700 : 500,
              color: 'var(--cream)',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {module.name}
          </span>
        </span>
        <span className="outline-badge" style={{ flexShrink: 0, fontSize: 11.5, fontVariantNumeric: 'tabular-nums' }}>
          {stats.lecturesTotal > 0 ? `${stats.lecturesDone}/${stats.lecturesTotal} · ` : ''}
          {formatDuration(stats.totalSeconds)}
        </span>
      </button>

      <AnimatePresence initial={false}>
        {open && hasChildren && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.22, ease: [0.2, 0.8, 0.2, 1] }}
            style={{ overflow: 'hidden', paddingLeft: 21 }}
          >
            {module.topics.map((topic) => {
              const seconds = getTopicSeconds(topic)
              return (
                <div
                  key={topic.id}
                  style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '7px 4px', borderBottom: '1px solid var(--line)' }}
                >
                  <AnimatedCheckbox
                    checked={topic.done}
                    onChange={() => onToggleTopic(courseId, module.id, topic.id)}
                    ariaLabel={`Mark "${topic.name}" ${topic.done ? 'not done' : 'done'}`}
                  />
                  <span
                    style={{
                      flex: 1,
                      fontSize: 13,
                      color: topic.done ? 'var(--mute)' : 'var(--cream)',
                      textDecoration: topic.done ? 'line-through' : 'none',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {topic.name}
                  </span>
                  <span className="outline-badge" style={{ flexShrink: 0, fontSize: 11, fontVariantNumeric: 'tabular-nums' }}>
                    {formatDuration(seconds)}
                  </span>
                </div>
              )
            })}
            {children.map((child) => (
              <ModuleAccordionRow
                key={child.id}
                courseId={courseId}
                module={child}
                depth={depth + 1}
                isOpen={isOpen}
                onToggleOpen={onToggleOpen}
                onToggleTopic={onToggleTopic}
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default ModuleAccordionRow
