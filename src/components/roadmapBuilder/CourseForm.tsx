import { useState } from 'react'
import { AnimatePresence } from 'framer-motion'
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
import type { Course, CourseModule } from '../../types'
import { computeCourseStats } from '../../utils/courseStats'
import { formatDuration } from '../../utils/duration'
import { makeEmptyModule, cloneModuleWithNewIds, isModuleTreeComplete } from '../../utils/courseDraft'
import { SortableModuleEditor } from './ModuleEditor'
import Button from '../ui/Button'

export interface CourseFormValue {
  name: string
  platform: string
  instructor: string
  startDate: string
  hoursPerDay: string
  modules: CourseModule[]
}

export function courseToFormValue(course: Course): CourseFormValue {
  return {
    name: course.name,
    platform: course.platform ?? '',
    instructor: course.instructor ?? '',
    startDate: course.startDate ?? '',
    hoursPerDay: course.hoursPerDay != null ? String(course.hoursPerDay) : '',
    modules: course.modules,
  }
}

export function emptyFormValue(): CourseFormValue {
  return { name: '', platform: '', instructor: '', startDate: '', hoursPerDay: '', modules: [] }
}

interface Props {
  value: CourseFormValue
  onChange: (value: CourseFormValue) => void
  onSave: () => void
  saveLabel: string
}

/** Tab 1 of the Roadmap Builder — the direct-entry form: course fields plus a nested section/module/lecture builder with fast entry, drag reorder, and live totals. */
function CourseForm({ value, onChange, onSave, saveLabel }: Props) {
  const [showErrors, setShowErrors] = useState(false)
  const stats = computeCourseStats({ modules: value.modules })
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )

  const canSave = value.name.trim() !== '' && value.modules.length > 0 && isModuleTreeComplete(value.modules)

  function patch(fields: Partial<CourseFormValue>) {
    onChange({ ...value, ...fields })
  }

  function addSection() {
    onChange({ ...value, modules: [...value.modules, makeEmptyModule()] })
  }

  function patchModule(id: string, next: CourseModule) {
    onChange({ ...value, modules: value.modules.map((m) => (m.id === id ? next : m)) })
  }

  function deleteModule(id: string) {
    onChange({ ...value, modules: value.modules.filter((m) => m.id !== id) })
  }

  function duplicateModule(id: string) {
    const source = value.modules.find((m) => m.id === id)
    if (!source) return
    const copy = cloneModuleWithNewIds(source)
    const index = value.modules.findIndex((m) => m.id === id)
    const next = [...value.modules]
    next.splice(index + 1, 0, copy)
    onChange({ ...value, modules: next })
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (!over || active.id === over.id) return
    const ids = value.modules.map((m) => m.id)
    const oldIndex = ids.indexOf(String(active.id))
    const newIndex = ids.indexOf(String(over.id))
    if (oldIndex === -1 || newIndex === -1) return
    onChange({ ...value, modules: arrayMove(value.modules, oldIndex, newIndex) })
  }

  function handleSaveClick() {
    if (!canSave) {
      setShowErrors(true)
      return
    }
    onSave()
  }

  return (
    <div>
      <div className="card" style={{ padding: '18px 22px', marginBottom: 16 }}>
        <div className="field">
          <label htmlFor="course-form-title">Course title</label>
          <input id="course-form-title" value={value.name} onChange={(e) => patch({ name: e.target.value })} placeholder="e.g. Data Structures & Algorithms" />
        </div>
        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
          <div className="field" style={{ flex: '1 1 180px' }}>
            <label htmlFor="course-form-platform">Platform (optional)</label>
            <input id="course-form-platform" value={value.platform} onChange={(e) => patch({ platform: e.target.value })} placeholder="e.g. Udemy" />
          </div>
          <div className="field" style={{ flex: '1 1 180px' }}>
            <label htmlFor="course-form-instructor">Instructor (optional)</label>
            <input id="course-form-instructor" value={value.instructor} onChange={(e) => patch({ instructor: e.target.value })} placeholder="e.g. Jane Smith" />
          </div>
        </div>
        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
          <div className="field" style={{ flex: '1 1 160px', marginBottom: 0 }}>
            <label htmlFor="course-form-start">Start date (optional)</label>
            <input id="course-form-start" type="date" value={value.startDate} onChange={(e) => patch({ startDate: e.target.value })} />
          </div>
          <div className="field" style={{ flex: '1 1 160px', marginBottom: 0 }}>
            <label htmlFor="course-form-hours">Hours per day (optional)</label>
            <input id="course-form-hours" value={value.hoursPerDay} onChange={(e) => patch({ hoursPerDay: e.target.value })} placeholder="e.g. 2" />
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 10, flexWrap: 'wrap', gap: 8 }}>
        <span style={{ fontSize: 13, color: 'var(--mute)', fontWeight: 600 }}>
          {stats.lecturesTotal} lecture{stats.lecturesTotal === 1 ? '' : 's'}
        </span>
        <span style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 800, fontSize: 18, color: 'var(--cream)' }}>
          {formatDuration(stats.totalSeconds)} total
        </span>
      </div>

      {value.modules.length === 0 ? (
        <p style={{ fontSize: 13.5, color: 'var(--mute)', marginBottom: 14 }}>
          Add a section to start building the course structure.
        </p>
      ) : (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={value.modules.map((m) => m.id)} strategy={verticalListSortingStrategy}>
            <AnimatePresence initial={false}>
              {value.modules.map((m) => (
                <SortableModuleEditor
                  key={m.id}
                  module={m}
                  depth={1}
                  onChange={(next) => patchModule(m.id, next)}
                  onDelete={() => deleteModule(m.id)}
                  onDuplicate={() => duplicateModule(m.id)}
                />
              ))}
            </AnimatePresence>
          </SortableContext>
        </DndContext>
      )}

      <div style={{ display: 'flex', gap: 10, marginTop: 10, flexWrap: 'wrap', alignItems: 'center' }}>
        <button type="button" onClick={addSection} className="btn-outline">
          + Add section
        </button>
        <Button onClick={handleSaveClick}>{saveLabel}</Button>
      </div>

      {showErrors && !canSave && (
        <div className="outline-issues outline-issues-error" style={{ marginTop: 14 }}>
          {value.name.trim() === '' && <div>⚠ Give the course a title.</div>}
          {value.modules.length === 0 && <div>⚠ Add at least one section.</div>}
          {value.modules.length > 0 && !isModuleTreeComplete(value.modules) && (
            <div>⚠ Every section, module and lecture needs a title, and every lecture needs a duration greater than 0.</div>
          )}
        </div>
      )}
    </div>
  )
}

export default CourseForm
