import { useState } from 'react'
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

      {showAddCourse && (
        <AddCourseForm
          onSave={(course) => {
            addCourse(course)
            setShowAddCourse(false)
          }}
          onCancel={() => setShowAddCourse(false)}
        />
      )}

      {data.courses.length === 0 && <p style={{ color: 'var(--rose)' }}>No courses yet — add one above.</p>}

      {data.courses.map((course) => (
        <CourseCard key={course.id} course={course} onToggleTopic={toggleTopic} onDelete={deleteCourse} />
      ))}
    </div>
  )
}

export default Courses
