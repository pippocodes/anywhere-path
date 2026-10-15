import { useState, type FormEvent } from 'react'
import type { Course, Plan } from '../../types'
import { parseDuration, formatDuration } from '../../utils/duration'
import Pills from '../ui/Pills'
import Button from '../ui/Button'

export interface AddHabitInput {
  name: string
  courseId: string | null
  planId: string | null
  targetSeconds: number | null
}

type Source = 'custom' | 'course' | 'plan'

const SOURCE_OPTIONS = [
  { value: 'custom', label: 'Custom' },
  { value: 'course', label: 'From a course' },
  { value: 'plan', label: 'From a plan' },
]

interface Props {
  courses: Course[]
  plans: Plan[]
  onAdd: (input: AddHabitInput) => void
  onCancel: () => void
}

/** The "Add from..." habit form — custom (name + optional manual daily target) or linked to an existing course/plan (name + target auto-filled from its hoursPerDay, editable). */
function AddHabitForm({ courses, plans, onAdd, onCancel }: Props) {
  const [source, setSource] = useState<Source>('custom')
  const [name, setName] = useState('')
  const [targetText, setTargetText] = useState('')
  const [selectedCourseId, setSelectedCourseId] = useState<string | null>(null)
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null)

  function pickCourse(course: Course) {
    setSelectedCourseId(course.id)
    if (!name.trim()) setName(course.name)
    if (course.hoursPerDay) setTargetText(formatDuration(course.hoursPerDay * 3600))
  }

  function pickPlan(plan: Plan) {
    setSelectedPlanId(plan.id)
    if (!name.trim()) setName(plan.title)
    if (plan.hoursPerDay) setTargetText(formatDuration(plan.hoursPerDay * 3600))
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    const trimmed = name.trim()
    if (!trimmed) return
    if (source === 'course' && !selectedCourseId) return
    if (source === 'plan' && !selectedPlanId) return

    onAdd({
      name: trimmed,
      courseId: source === 'course' ? selectedCourseId : null,
      planId: source === 'plan' ? selectedPlanId : null,
      targetSeconds: targetText.trim() ? parseDuration(targetText) : null,
    })
  }

  const canSubmit = name.trim() !== '' && (source !== 'course' || selectedCourseId) && (source !== 'plan' || selectedPlanId)

  return (
    <form onSubmit={handleSubmit} style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 10 }}>
      <Pills
        options={SOURCE_OPTIONS}
        value={source}
        onChange={(v) => setSource(v as Source)}
        layoutId="add-habit-source-pills"
        size="sm"
      />

      {source === 'course' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 140, overflowY: 'auto' }}>
          {courses.length === 0 ? (
            <p style={{ fontSize: 12, color: 'var(--mute)' }}>No courses yet — add one on the Courses page first.</p>
          ) : (
            courses.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => pickCourse(c)}
                style={{
                  textAlign: 'left',
                  fontSize: 12.5,
                  padding: '6px 10px',
                  borderRadius: 7,
                  border: selectedCourseId === c.id ? '1px solid var(--gold)' : '1px solid var(--line)',
                  background: 'var(--surface)',
                  color: 'var(--cream)',
                }}
              >
                {c.name}
              </button>
            ))
          )}
        </div>
      )}

      {source === 'plan' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 140, overflowY: 'auto' }}>
          {plans.length === 0 ? (
            <p style={{ fontSize: 12, color: 'var(--mute)' }}>No plans yet — build one in the Roadmap Builder first.</p>
          ) : (
            plans.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => pickPlan(p)}
                style={{
                  textAlign: 'left',
                  fontSize: 12.5,
                  padding: '6px 10px',
                  borderRadius: 7,
                  border: selectedPlanId === p.id ? '1px solid var(--gold)' : '1px solid var(--line)',
                  background: 'var(--surface)',
                  color: 'var(--cream)',
                }}
              >
                {p.title}
              </button>
            ))
          )}
        </div>
      )}

      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Habit name"
        style={{ padding: '7px 10px', borderRadius: 8, border: '1px solid var(--line)', fontSize: 13, background: 'var(--surface)', color: 'var(--cream)' }}
      />
      <input
        value={targetText}
        onChange={(e) => setTargetText(e.target.value)}
        placeholder="Daily target (optional) — e.g. 30m, 1h"
        style={{ padding: '7px 10px', borderRadius: 8, border: '1px solid var(--line)', fontSize: 13, background: 'var(--surface)', color: 'var(--cream)' }}
      />

      <div style={{ display: 'flex', gap: 10 }}>
        <Button type="submit" size="sm" disabled={!canSubmit}>
          Add
        </Button>
        <Button type="button" variant="secondary" size="sm" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </form>
  )
}

export default AddHabitForm
