import { useState } from 'react'
import type { CourseModule } from '../../types'
import ModuleAccordionRow from '../courses/ModuleAccordionRow'

// Sample data only — not a real course. Feeds the same ModuleAccordionRow
// the real Course Tracker page uses, so this preview is genuinely
// interactive and theme-aware, not a screenshot.
const SAMPLE_MODULE: CourseModule = {
  id: 'preview-module',
  name: 'Linear Structures',
  topics: [
    { id: 'preview-t1', name: 'Arrays', hours: 0, done: true, durationSeconds: 1322 },
    { id: 'preview-t2', name: 'Linked Lists', hours: 0, done: true, durationSeconds: 2045 },
    { id: 'preview-t3', name: 'Stacks & Queues', hours: 0, done: false, durationSeconds: 1890 },
  ],
}

/** Home's Course Tracker preview — the real accordion row component with sample topics, click to try it. */
function CourseTrackerPreview() {
  const [open, setOpen] = useState(true)
  const [doneIds, setDoneIds] = useState(() => new Set(SAMPLE_MODULE.topics.filter((t) => t.done).map((t) => t.id)))

  const module: CourseModule = {
    ...SAMPLE_MODULE,
    topics: SAMPLE_MODULE.topics.map((t) => ({ ...t, done: doneIds.has(t.id) })),
  }

  function toggleTopic(_courseId: string, _moduleId: string, topicId: string) {
    setDoneIds((prev) => {
      const next = new Set(prev)
      if (next.has(topicId)) next.delete(topicId)
      else next.add(topicId)
      return next
    })
  }

  return (
    <ModuleAccordionRow
      courseId="preview-course"
      module={module}
      depth={1}
      isOpen={() => open}
      onToggleOpen={() => setOpen((v) => !v)}
      onToggleTopic={toggleTopic}
    />
  )
}

export default CourseTrackerPreview
