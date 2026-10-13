import { memo } from 'react'
import { motion } from 'framer-motion'
import type { Topic } from '../types'
import AnimatedCheckbox from './motion/AnimatedCheckbox'

interface Props {
  topic: Topic
  onToggle: (topicId: string) => void
}

// Memoized: a module can have many topics, and only the toggled one should
// actually re-render when a sibling's checkbox changes elsewhere on the page.
function TopicRow({ topic, onToggle }: Props) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        padding: '8px 10px',
        background: 'var(--card-bg)',
        borderRadius: 8,
      }}
    >
      <AnimatedCheckbox checked={topic.done} onChange={() => onToggle(topic.id)} ariaLabel={topic.name} />
      <motion.div
        animate={{ color: topic.done ? 'var(--mute)' : 'var(--cream)' }}
        transition={{ duration: 0.2 }}
        style={{
          flex: 1,
          fontSize: 14,
          textDecoration: topic.done ? 'line-through' : 'none',
        }}
      >
        {topic.name}
      </motion.div>
      <div style={{ fontSize: 12, color: 'var(--mute)' }}>{topic.hours}h</div>
    </div>
  )
}

export default memo(TopicRow)
