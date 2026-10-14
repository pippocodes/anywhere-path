import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import { SortableContext, arrayMove, sortableKeyboardCoordinates, verticalListSortingStrategy } from '@dnd-kit/sortable'
import type { CourseModule } from '../../types'
import { computeModuleStats } from '../../utils/courseStats'
import { formatDuration } from '../../utils/duration'
import LectureRow from './LectureRow'

interface Props {
  module: CourseModule
  onToggleTopic: (topicId: string) => void
  onDeleteTopic: (topicId: string) => void
  onReorderTopics: (orderedIds: string[]) => void
  onAddLectures: () => void
  onRename: (name: string) => void
  onDeleteModule: () => void
}

function ModuleSection({ module, onToggleTopic, onDeleteTopic, onReorderTopics, onAddLectures, onRename, onDeleteModule }: Props) {
  const [collapsed, setCollapsed] = useState(false)
  const [nameDraft, setNameDraft] = useState(module.name)
  const stats = computeModuleStats(module)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )

  function commitName() {
    const trimmed = nameDraft.trim()
    if (trimmed && trimmed !== module.name) onRename(trimmed)
    else setNameDraft(module.name)
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (!over || active.id === over.id) return
    const ids = module.topics.map((t) => t.id)
    const oldIndex = ids.indexOf(String(active.id))
    const newIndex = ids.indexOf(String(over.id))
    if (oldIndex === -1 || newIndex === -1) return
    onReorderTopics(arrayMove(ids, oldIndex, newIndex))
  }

  return (
    <div className="card" style={{ marginBottom: 20 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
        <button
          className="expandable-header"
          onClick={() => setCollapsed((v) => !v)}
          style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'none', border: 'none', padding: 0, cursor: 'pointer' }}
          aria-expanded={!collapsed}
        >
          <motion.span animate={{ rotate: collapsed ? -90 : 0 }} transition={{ duration: 0.2 }} style={{ display: 'inline-block', color: 'var(--mute)', fontSize: 14 }}>
            ›
          </motion.span>
          <input
            value={nameDraft}
            onChange={(e) => setNameDraft(e.target.value)}
            onBlur={commitName}
            onKeyDown={(e) => e.key === 'Enter' && (e.target as HTMLInputElement).blur()}
            onClick={(e) => e.stopPropagation()}
            style={{
              fontSize: 17,
              fontFamily: 'var(--font-display)',
              fontStyle: 'italic',
              fontWeight: 600,
              background: 'none',
              border: 'none',
              color: 'var(--cream)',
              padding: '2px 4px',
              width: Math.max(120, nameDraft.length * 11),
            }}
          />
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div className="micro-label" style={{ marginBottom: 0 }}>
            {stats.lecturesDone}/{stats.lecturesTotal} · {formatDuration(stats.totalSeconds)}
          </div>
          <button className="btn-outline" style={{ opacity: 0.75 }} onClick={onDeleteModule}>
            Delete
          </button>
        </div>
      </div>

      <div className="progress-track" style={{ marginTop: 14, marginBottom: collapsed ? 0 : 10 }}>
        <motion.div
          className="progress-fill"
          initial={false}
          animate={{ width: `${stats.percent}%` }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        />
      </div>

      <AnimatePresence initial={false}>
        {!collapsed && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25, ease: [0.2, 0.8, 0.2, 1] }}
            style={{ overflow: 'hidden' }}
          >
            {module.topics.length === 0 ? (
              <p style={{ fontSize: 13, color: 'var(--mute)', marginTop: 6 }}>No lectures yet.</p>
            ) : (
              <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                <SortableContext items={module.topics.map((t) => t.id)} strategy={verticalListSortingStrategy}>
                  <AnimatePresence initial={false}>
                    {module.topics.map((topic) => (
                      <LectureRow
                        key={topic.id}
                        topic={topic}
                        onToggle={() => onToggleTopic(topic.id)}
                        onDelete={() => onDeleteTopic(topic.id)}
                      />
                    ))}
                  </AnimatePresence>
                </SortableContext>
              </DndContext>
            )}

            <button className="btn-outline" style={{ marginTop: 14 }} onClick={onAddLectures}>
              + Add lectures
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default ModuleSection
