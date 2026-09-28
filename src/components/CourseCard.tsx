import { useState } from 'react'
import { Link } from 'react-router-dom'
import type { Course } from '../types'
import { useCourseProgress } from '../hooks/useCourseProgress'
import ModuleCard from './ModuleCard'

interface Props {
  course: Course
  onToggleTopic: (courseId: string, moduleId: string, topicId: string) => void
  onDelete: (courseId: string) => void
}

function CourseCard({ course, onToggleTopic, onDelete }: Props) {
  const [expanded, setExpanded] = useState(false)
  const [confirmingDelete, setConfirmingDelete] = useState(false)
  const { done, total, percent } = useCourseProgress(course)

  return (
    <div className="card" style={{ marginBottom: 24 }}>
      <div
        className="expandable-header"
        style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', cursor: 'pointer' }}
        onClick={() => setExpanded((e) => !e)}
      >
        <div>
          <h3 style={{ fontSize: 20 }}>{course.name}</h3>
          <div style={{ fontSize: 13, color: 'var(--rose)', marginTop: 4 }}>
            {done} of {total} topics complete
          </div>
        </div>
        <div style={{ fontSize: 20, color: 'var(--cherry)' }}>{expanded ? '−' : '+'}</div>
      </div>

      <div className="progress-track" style={{ marginTop: 16 }}>
        <div className="progress-fill" style={{ width: `${percent}%` }} />
      </div>

      {expanded && (
        <div style={{ marginTop: 22, display: 'flex', flexDirection: 'column', gap: 16 }}>
          {course.modules.map((mod) => (
            <ModuleCard
              key={mod.id}
              courseModule={mod}
              onToggleTopic={(moduleId, topicId) => onToggleTopic(course.id, moduleId, topicId)}
            />
          ))}
        </div>
      )}

      <div
        style={{
          marginTop: 20,
          paddingTop: 16,
          borderTop: '1px solid var(--pink-paler)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <Link to={`/roadmap/${course.id}`} className="btn-outline">
          Build Roadmap
        </Link>

        {confirmingDelete ? (
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <span style={{ fontSize: 13, color: 'var(--plum)' }}>Delete this course permanently?</span>
            <button className="btn btn-danger" style={{ padding: '7px 14px', fontSize: 12.5 }} onClick={() => onDelete(course.id)}>
              Yes, delete
            </button>
            <button className="btn-outline" style={{ color: 'var(--rose)' }} onClick={() => setConfirmingDelete(false)}>
              Cancel
            </button>
          </div>
        ) : (
          <button
            className="btn-outline"
            style={{ opacity: 0.75, fontSize: 12.5 }}
            onClick={() => setConfirmingDelete(true)}
          >
            Delete Course
          </button>
        )}
      </div>
    </div>
  )
}

export default CourseCard
