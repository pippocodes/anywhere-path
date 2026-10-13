import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useApp } from '../hooks/useApp'
import CourseCard from '../components/CourseCard'
import AddCourseForm from '../components/AddCourseForm'

function Courses() {
  const { data, toggleTopic, addCourse, deleteCourse } = useApp()
  const [showAddCourse, setShowAddCourse] = useState(false)

  return (
    <div className="page">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
        <h1 className="page-title">Your Courses</h1>
        <button className="btn" onClick={() => setShowAddCourse((v) => !v)}>
          {showAddCourse ? 'Close' : '+ Add Course'}
        </button>
      </div>

      <AnimatePresence initial={false}>
        {showAddCourse && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            style={{ overflow: 'hidden' }}
          >
            <AddCourseForm
              onSave={(course) => {
                addCourse(course)
                setShowAddCourse(false)
              }}
              onCancel={() => setShowAddCourse(false)}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {data.courses.length === 0 && <p style={{ color: 'var(--rose)' }}>No courses yet — add one above.</p>}

      <AnimatePresence initial={false}>
        {data.courses.map((course, index) => (
          <motion.div
            key={course.id}
            layout
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96 }}
            transition={{ duration: 0.3, delay: index * 0.04, ease: [0.16, 1, 0.3, 1] }}
          >
            <CourseCard course={course} onToggleTopic={toggleTopic} onDelete={deleteCourse} />
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  )
}

export default Courses
