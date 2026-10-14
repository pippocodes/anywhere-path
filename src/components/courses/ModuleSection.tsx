import { useState, type FormEvent } from 'react'
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

const MAX_DEPTH = 3
const LEVEL_LABEL = ['Section', 'Module', 'Sub-module']

export interface ModuleSectionActions {
  toggleTopic: (courseId: string, moduleId: string, topicId: string) => void
  deleteTopic: (courseId: string, moduleId: string, topicId: string) => void
  reorderTopics: (courseId: string, moduleId: string, orderedIds: string[]) => void
  renameModule: (courseId: string, moduleId: string, name: string) => void
  deleteModule: (courseId: string, moduleId: string) => void
  addModule: (courseId: string, name: string, parentModuleId?: string | null) => void
}

interface Props {
  courseId: string
  module: CourseModule
  depth?: number // 1 = top-level section, up to MAX_DEPTH
  onAddLectures: (moduleId: string, moduleName: string) => void
  actions: ModuleSectionActions
}

/** One section/module/sub-module in the Course Tracker's structured view — recurses into `module.modules` so nested sub-modules (built via the Roadmap Builder) actually show up here, not just their top-level section. */
function ModuleSection({ courseId, module, depth = 1, onAddLectures, actions }: Props) {
  const { toggleTopic, deleteTopic, reorderTopics, renameModule, deleteModule, addModule } = actions
  const [collapsed, setCollapsed] = useState(false)
  const [nameDraft, setNameDraft] = useState(module.name)
  const [addingChild, setAddingChild] = useState(false)
  const [newChildName, setNewChildName] = useState('')
  const stats = computeModuleStats(module)
  const children = module.modules ?? []

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )

  function commitName() {
    const trimmed = nameDraft.trim()
    if (trimmed && trimmed !== module.name) renameModule(courseId, module.id, trimmed)
    else setNameDraft(module.name)
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (!over || active.id === over.id) return
    const ids = module.topics.map((t) => t.id)
    const oldIndex = ids.indexOf(String(active.id))
    const newIndex = ids.indexOf(String(over.id))
    if (oldIndex === -1 || newIndex === -1) return
    reorderTopics(courseId, module.id, arrayMove(ids, oldIndex, newIndex))
  }

  function handleAddChild(e: FormEvent) {
    e.preventDefault()
    const trimmed = newChildName.trim()
    if (!trimmed) return
    addModule(courseId, trimmed, module.id)
    setNewChildName('')
    setAddingChild(false)
  }

  return (
    <div
      className="card"
      style={{
        marginBottom: depth === 1 ? 20 : 14,
        marginLeft: depth > 1 ? 18 : 0,
        borderLeft: depth > 1 ? '2px solid var(--line)' : undefined,
      }}
    >
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
              fontSize: depth === 1 ? 17 : 14.5,
              fontFamily: depth === 1 ? 'var(--font-display)' : undefined,
              fontStyle: depth === 1 ? 'italic' : undefined,
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
          <button className="btn-outline" style={{ opacity: 0.75 }} onClick={() => deleteModule(courseId, module.id)}>
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
            {module.topics.length === 0 && children.length === 0 ? (
              <p style={{ fontSize: 13, color: 'var(--mute)', marginTop: 6 }}>No lectures yet.</p>
            ) : (
              module.topics.length > 0 && (
                <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                  <SortableContext items={module.topics.map((t) => t.id)} strategy={verticalListSortingStrategy}>
                    <AnimatePresence initial={false}>
                      {module.topics.map((topic) => (
                        <LectureRow
                          key={topic.id}
                          topic={topic}
                          onToggle={() => toggleTopic(courseId, module.id, topic.id)}
                          onDelete={() => deleteTopic(courseId, module.id, topic.id)}
                        />
                      ))}
                    </AnimatePresence>
                  </SortableContext>
                </DndContext>
              )
            )}

            <div style={{ display: 'flex', gap: 10, marginTop: 14, flexWrap: 'wrap' }}>
              <button className="btn-outline" onClick={() => onAddLectures(module.id, module.name)}>
                + Add lectures
              </button>
              {depth < MAX_DEPTH &&
                (addingChild ? (
                  <form onSubmit={handleAddChild} style={{ display: 'flex', gap: 8 }}>
                    <input
                      autoFocus
                      value={newChildName}
                      onChange={(e) => setNewChildName(e.target.value)}
                      placeholder={`${LEVEL_LABEL[depth] ?? 'Sub-module'} name`}
                      style={{ fontSize: 13, padding: '6px 10px' }}
                    />
                    <button type="submit" className="btn-outline" style={{ fontSize: 12.5 }}>
                      Add
                    </button>
                    <button type="button" className="btn-outline" style={{ fontSize: 12.5, opacity: 0.6 }} onClick={() => setAddingChild(false)}>
                      Cancel
                    </button>
                  </form>
                ) : (
                  <button className="btn-outline" onClick={() => setAddingChild(true)}>
                    + Add {LEVEL_LABEL[depth] ?? 'sub-module'}
                  </button>
                ))}
            </div>

            {children.length > 0 && (
              <div style={{ marginTop: 14 }}>
                <AnimatePresence initial={false}>
                  {children.map((child) => (
                    <motion.div key={child.id} layout initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                      <ModuleSection courseId={courseId} module={child} depth={depth + 1} onAddLectures={onAddLectures} actions={actions} />
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default ModuleSection
