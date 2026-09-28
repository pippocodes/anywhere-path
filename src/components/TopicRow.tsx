import { memo } from 'react'
import type { Topic } from '../types'

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
      <input
        type="checkbox"
        checked={topic.done}
        onChange={() => onToggle(topic.id)}
        style={{ width: 17, height: 17, accentColor: 'var(--cherry)', cursor: 'pointer' }}
      />
      <div
        style={{
          flex: 1,
          fontSize: 14,
          color: topic.done ? 'var(--rose)' : 'var(--ink)',
          textDecoration: topic.done ? 'line-through' : 'none',
        }}
      >
        {topic.name}
      </div>
      <div style={{ fontSize: 12, color: 'var(--rose)' }}>{topic.hours}h</div>
    </div>
  )
}

export default memo(TopicRow)
