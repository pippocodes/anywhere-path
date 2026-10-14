import { useState } from 'react'
import { AnimatePresence } from 'framer-motion'
import { useApp } from '../hooks/useApp'
import { makeId } from '../utils/id'
import CourseCard from '../components/courses/CourseCard'
import AddCourseSheet from '../components/courses/AddCourseSheet'
import Button from '../components/ui/Button'
import RevealHeading from '../components/ui/RevealHeading'

function Courses() {
  const { data, addCourse } = useApp()
  const [sheetOpen, setSheetOpen] = useState(false)

  function handleAdd(fields: { name: string; platform: string; instructor: string }) {
    addCourse({
      id: makeId('course'),
      name: fields.name,
      platform: fields.platform || undefined,
      instructor: fields.instructor || undefined,
      isCustom: true,
      modules: [],
    })
  }

  return (
    <div className="page" style={{ maxWidth: 900 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16, marginBottom: 28 }}>
        <div>
          <RevealHeading as="h1" className="page-title" style={{ marginBottom: 6 }}>
            Course Tracker
          </RevealHeading>
          <p className="page-subtitle" style={{ marginBottom: 0 }}>
            Track lectures and watched progress for courses you're taking elsewhere.
          </p>
        </div>
        <Button onClick={() => setSheetOpen(true)}>+ New course</Button>
      </div>

      {data.courses.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '48px 24px' }}>
          <p style={{ color: 'var(--mute)', marginBottom: 18 }}>
            No courses yet — add one to start tracking lectures and progress.
          </p>
          <Button onClick={() => setSheetOpen(true)}>+ New course</Button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <AnimatePresence initial={false}>
            {data.courses.map((course) => (
              <CourseCard key={course.id} course={course} />
            ))}
          </AnimatePresence>
        </div>
      )}

      <AddCourseSheet open={sheetOpen} onClose={() => setSheetOpen(false)} onAdd={handleAdd} />
    </div>
  )
}

export default Courses
