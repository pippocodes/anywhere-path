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
import { SortableContext, arrayMove, sortableKeyboardCoordinates, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import type { CourseModule } from '../../types'
import { computeModuleStats } from '../../utils/courseStats'
import { formatDuration } from '../../utils/duration'
import { makeEmptyModule, makeEmptyTopic, cloneModuleWithNewIds } from '../../utils/courseDraft'
import EditableLectureRow from './EditableLectureRow'

const MAX_DEPTH = 3
const LEVEL_LABEL = ['Section', 'Module', 'Sub-module']

interface Props {
  module: CourseModule
  depth: number // 1, 2, or 3
  onChange: (next: CourseModule) => void
  onDelete: () => void
  onDuplicate: () => void
  dragHandle?: { attributes: ReturnType<typeof useSortable>['attributes']; listeners: ReturnType<typeof useSortable>['listeners'] }
  style?: React.CSSProperties
}

/**
 * One section/module/sub-module in the direct-entry course builder — can
 * nest more ModuleEditors under it (up to MAX_DEPTH) and holds its own
 * lecture rows. Recursive and self-similar at every depth; only the "+ Add
 * sub-module" affordance disappears once MAX_DEPTH is reached.
 */
function ModuleEditor({ module, depth, onChange, onDelete, onDuplicate, dragHandle, style }: Props) {
  const [collapsed, setCollapsed] = useState(false)
  const [focusTopicId, setFocusTopicId] = useState<string | null>(null)
  const stats = computeModuleStats(module)
  const children = module.modules ?? []

  const topicSensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )
  const moduleSensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )

  function patchTopic(topicId: string, patch: Partial<typeof module.topics[number]>) {
    onChange({ ...module, topics: module.topics.map((t) => (t.id === topicId ? { ...t, ...patch } : t)) })
  }

  function addTopic() {
    const topic = makeEmptyTopic()
    onChange({ ...module, topics: [...module.topics, topic] })
    setFocusTopicId(topic.id)
  }

  function duplicateTopic(topicId: string) {
    const source = module.topics.find((t) => t.id === topicId)
    if (!source) return
    const copy = { ...source, id: makeEmptyTopic().id }
    const index = module.topics.findIndex((t) => t.id === topicId)
    const next = [...module.topics]
    next.splice(index + 1, 0, copy)
    onChange({ ...module, topics: next })
  }

  function deleteTopic(topicId: string) {
    onChange({ ...module, topics: module.topics.filter((t) => t.id !== topicId) })
  }

  function handleTopicDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (!over || active.id === over.id) return
    const ids = module.topics.map((t) => t.id)
    const oldIndex = ids.indexOf(String(active.id))
    const newIndex = ids.indexOf(String(over.id))
    if (oldIndex === -1 || newIndex === -1) return
    onChange({ ...module, topics: arrayMove(module.topics, oldIndex, newIndex) })
  }

  function addChildModule() {
    onChange({ ...module, modules: [...children, makeEmptyModule()] })
  }

  function patchChild(childId: string, next: CourseModule) {
    onChange({ ...module, modules: children.map((c) => (c.id === childId ? next : c)) })
  }

  function deleteChild(childId: string) {
    onChange({ ...module, modules: children.filter((c) => c.id !== childId) })
  }

  function duplicateChild(childId: string) {
    const source = children.find((c) => c.id === childId)
    if (!source) return
    const copy = cloneModuleWithNewIds(source)
    const index = children.findIndex((c) => c.id === childId)
    const next = [...children]
    next.splice(index + 1, 0, copy)
    onChange({ ...module, modules: next })
  }

  function handleModuleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (!over || active.id === over.id) return
    const ids = children.map((c) => c.id)
    const oldIndex = ids.indexOf(String(active.id))
    const newIndex = ids.indexOf(String(over.id))
    if (oldIndex === -1 || newIndex === -1) return
    onChange({ ...module, modules: arrayMove(children, oldIndex, newIndex) })
  }

  return (
    <div className="card" style={{ marginBottom: 14, paddingTop: 14, paddingBottom: 14, ...style }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1, minWidth: 180 }}>
          {dragHandle && (
            <span {...dragHandle.attributes} {...dragHandle.listeners} title="Drag to reorder" style={{ cursor: 'grab', color: 'var(--line)', fontSize: 14, touchAction: 'none' }}>
              ⠿
            </span>
          )}
          <button
            type="button"
            className="expandable-header"
            onClick={() => setCollapsed((v) => !v)}
            style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', padding: 0, cursor: 'pointer' }}
            aria-expanded={!collapsed}
          >
            <motion.span animate={{ rotate: collapsed ? -90 : 0 }} transition={{ duration: 0.2 }} style={{ display: 'inline-block', color: 'var(--mute)', fontSize: 14 }}>
              ›
            </motion.span>
          </button>
          <input
            value={module.name}
            onChange={(e) => onChange({ ...module, name: e.target.value })}
            placeholder={`${LEVEL_LABEL[depth - 1] ?? 'Module'} name`}
            style={{
              fontSize: depth === 1 ? 16 : 14,
              fontFamily: depth === 1 ? 'var(--font-display)' : undefined,
              fontStyle: depth === 1 ? 'italic' : undefined,
              fontWeight: 600,
              background: 'none',
              border: 'none',
              borderBottom: '1px solid var(--line)',
              color: 'var(--cream)',
              padding: '4px 2px',
              flex: 1,
              minWidth: 100,
            }}
          />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
          <span className="micro-label" style={{ marginBottom: 0, fontVariantNumeric: 'tabular-nums' }}>
            {stats.lecturesTotal} lecture{stats.lecturesTotal === 1 ? '' : 's'} · {formatDuration(stats.totalSeconds)}
          </span>
          <button type="button" onClick={onDuplicate} className="btn-outline" style={{ fontSize: 11.5, opacity: 0.75, padding: '6px 10px' }}>
            Duplicate
          </button>
          <button type="button" onClick={onDelete} className="btn-outline" style={{ fontSize: 12, opacity: 0.6, padding: '6px 10px' }} aria-label={`Delete ${module.name || 'section'}`}>
            ✕
          </button>
        </div>
      </div>

      <AnimatePresence initial={false}>
        {!collapsed && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.22, ease: [0.2, 0.8, 0.2, 1] }}
            style={{ overflow: 'hidden' }}
          >
            <div style={{ marginTop: 12, paddingLeft: 10, borderLeft: '1px solid var(--line)' }}>
              {module.topics.length > 0 && (
                <DndContext sensors={topicSensors} collisionDetection={closestCenter} onDragEnd={handleTopicDragEnd}>
                  <SortableContext items={module.topics.map((t) => t.id)} strategy={verticalListSortingStrategy}>
                    <AnimatePresence initial={false}>
                      {module.topics.map((topic) => (
                        <EditableLectureRow
                          key={topic.id}
                          id={topic.id}
                          name={topic.name}
                          seconds={topic.durationSeconds ?? 0}
                          autoFocus={focusTopicId === topic.id}
                          onChangeName={(name) => patchTopic(topic.id, { name })}
                          onChangeSeconds={(durationSeconds) => patchTopic(topic.id, { durationSeconds, hours: durationSeconds / 3600 })}
                          onEnter={addTopic}
                          onDuplicate={() => duplicateTopic(topic.id)}
                          onDelete={() => deleteTopic(topic.id)}
                        />
                      ))}
                    </AnimatePresence>
                  </SortableContext>
                </DndContext>
              )}

              <div style={{ display: 'flex', gap: 10, marginTop: 10, flexWrap: 'wrap' }}>
                <button type="button" onClick={addTopic} className="btn-outline" style={{ fontSize: 12.5 }}>
                  + Add lecture
                </button>
                {depth < MAX_DEPTH && (
                  <button type="button" onClick={addChildModule} className="btn-outline" style={{ fontSize: 12.5 }}>
                    + Add {LEVEL_LABEL[depth] ?? 'sub-module'}
                  </button>
                )}
              </div>

              {children.length > 0 && (
                <div style={{ marginTop: 14 }}>
                  <DndContext sensors={moduleSensors} collisionDetection={closestCenter} onDragEnd={handleModuleDragEnd}>
                    <SortableContext items={children.map((c) => c.id)} strategy={verticalListSortingStrategy}>
                      <AnimatePresence initial={false}>
                        {children.map((child) => (
                          <SortableModuleEditor
                            key={child.id}
                            module={child}
                            depth={depth + 1}
                            onChange={(next) => patchChild(child.id, next)}
                            onDelete={() => deleteChild(child.id)}
                            onDuplicate={() => duplicateChild(child.id)}
                          />
                        ))}
                      </AnimatePresence>
                    </SortableContext>
                  </DndContext>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

/** Wraps ModuleEditor with its own `useSortable` so nested sub-modules can be drag-reordered among their siblings, same as top-level sections. */
function SortableModuleEditor(props: Omit<Props, 'dragHandle' | 'style'>) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: props.module.id })
  return (
    <motion.div
      ref={setNodeRef}
      layout
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, height: 0 }}
      transition={{ duration: 0.3, ease: [0.2, 0.8, 0.2, 1] }}
      style={{ transform: CSS.Transform.toString(transform), transition: transition ?? undefined, opacity: isDragging ? 0.5 : 1 }}
    >
      <ModuleEditor {...props} dragHandle={{ attributes, listeners }} />
    </motion.div>
  )
}

export default ModuleEditor
export { SortableModuleEditor }
