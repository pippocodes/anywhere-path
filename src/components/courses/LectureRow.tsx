import { motion } from 'framer-motion'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import type { Topic } from '../../types'
import { getTopicSeconds, formatDuration } from '../../utils/duration'
import AnimatedCheckbox from '../motion/AnimatedCheckbox'

interface Props {
  topic: Topic
  onToggle: () => void
  onDelete?: () => void
}

/** One lecture row — drag handle, title, duration (mm:ss / h:mm:ss), and a round gold tick for watched. New rows animate in. */
function LectureRow({ topic, onToggle, onDelete }: Props) {
  const seconds = getTopicSeconds(topic)
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: topic.id })

  return (
    <motion.div
      ref={setNodeRef}
      layout
      initial={{ opacity: 0, y: -10, height: 0 }}
      animate={{ opacity: 1, y: 0, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }}
      transition={{ duration: 0.35, ease: [0.2, 0.8, 0.2, 1] }}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        padding: '10px 4px',
        borderBottom: '1px solid var(--line)',
        transform: CSS.Transform.toString(transform),
        transition: transition ?? undefined,
        opacity: isDragging ? 0.5 : 1,
      }}
    >
      <span {...attributes} {...listeners} title="Drag to reorder" style={{ cursor: 'grab', color: 'var(--line)', fontSize: 14, touchAction: 'none', flexShrink: 0 }}>
        ⠿
      </span>
      <AnimatedCheckbox checked={topic.done} onChange={onToggle} ariaLabel={`Mark "${topic.name}" ${topic.done ? 'not watched' : 'watched'}`} />
      <span
        style={{
          flex: 1,
          fontSize: 14,
          color: topic.done ? 'var(--mute)' : 'var(--cream)',
          textDecoration: topic.done ? 'line-through' : 'none',
          transition: 'color 0.2s ease',
        }}
      >
        {topic.name}
      </span>
      <span className="outline-badge" style={{ fontVariantNumeric: 'tabular-nums' }}>
        {formatDuration(seconds)}
      </span>
      {onDelete && (
        <button
          onClick={onDelete}
          className="btn-outline"
          style={{ fontSize: 12, opacity: 0.6, flexShrink: 0 }}
          aria-label={`Delete ${topic.name}`}
        >
          ✕
        </button>
      )}
    </motion.div>
  )
}

export default LectureRow
