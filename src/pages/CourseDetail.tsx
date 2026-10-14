import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { useApp } from '../hooks/useApp'
import { computeCourseStats } from '../utils/courseStats'
import { findModuleById } from '../utils/courseDraft'
import CourseStats from '../components/courses/CourseStats'
import ModuleSection from '../components/courses/ModuleSection'
import AddLectureSheet from '../components/courses/AddLectureSheet'
import CourseSchedule from '../components/courses/CourseSchedule'
import CategorySelect from '../components/categories/CategorySelect'
import Button from '../components/ui/Button'
import RevealHeading from '../components/ui/RevealHeading'
import NotFound from './NotFound'

function CourseDetail() {
  const { courseId } = useParams<{ courseId: string }>()
  const navigate = useNavigate()
  const {
    data,
    updateCourse,
    deleteCourse,
    addModule,
    addTopics,
    toggleTopic,
    deleteTopic,
    reorderTopics,
    renameModule,
    deleteModule,
    addHabitCategory,
    renameHabitCategory,
    setHabitCategoryColor,
    deleteHabitCategory,
  } = useApp()

  const moduleActions = { toggleTopic, deleteTopic, reorderTopics, renameModule, deleteModule, addModule }

  const course = data.courses.find((c) => c.id === courseId)

  const [editingMeta, setEditingMeta] = useState(false)
  const [nameDraft, setNameDraft] = useState(course?.name ?? '')
  const [platformDraft, setPlatformDraft] = useState(course?.platform ?? '')
  const [instructorDraft, setInstructorDraft] = useState(course?.instructor ?? '')
  const [addingModule, setAddingModule] = useState(false)
  const [newModuleName, setNewModuleName] = useState('')
  const [lectureSheetModuleId, setLectureSheetModuleId] = useState<string | null>(null)
  const [confirmDelete, setConfirmDelete] = useState(false)

  if (!course) return <NotFound />

  const stats = computeCourseStats(course)
  const activeModule = lectureSheetModuleId ? findModuleById(course.modules, lectureSheetModuleId) : null

  function startEditingMeta() {
    setNameDraft(course!.name)
    setPlatformDraft(course!.platform ?? '')
    setInstructorDraft(course!.instructor ?? '')
    setEditingMeta(true)
  }

  function saveMeta() {
    const trimmedName = nameDraft.trim()
    updateCourse(course!.id, {
      name: trimmedName || course!.name,
      platform: platformDraft.trim() || undefined,
      instructor: instructorDraft.trim() || undefined,
    })
    setEditingMeta(false)
  }

  function handleAddModule(e: React.FormEvent) {
    e.preventDefault()
    const trimmed = newModuleName.trim()
    if (!trimmed) return
    addModule(course!.id, trimmed)
    setNewModuleName('')
    setAddingModule(false)
  }

  function handleDeleteCourse() {
    deleteCourse(course!.id)
    navigate('/courses', { replace: true })
  }

  const meta = [course.platform, course.instructor].filter(Boolean).join(' · ')

  return (
    <div className="page" style={{ maxWidth: 900 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16, marginBottom: 12 }}>
        <div style={{ flex: 1, minWidth: 240 }}>
          {editingMeta ? (
            <div className="card" style={{ marginBottom: 12 }}>
              <div className="field">
                <label htmlFor="edit-course-name">Course title</label>
                <input id="edit-course-name" value={nameDraft} onChange={(e) => setNameDraft(e.target.value)} />
              </div>
              <div className="field">
                <label htmlFor="edit-course-platform">Platform</label>
                <input id="edit-course-platform" value={platformDraft} onChange={(e) => setPlatformDraft(e.target.value)} placeholder="e.g. Udemy" />
              </div>
              <div className="field" style={{ marginBottom: 14 }}>
                <label htmlFor="edit-course-instructor">Instructor</label>
                <input id="edit-course-instructor" value={instructorDraft} onChange={(e) => setInstructorDraft(e.target.value)} placeholder="e.g. Jane Smith" />
              </div>
              <div style={{ display: 'flex', gap: 10 }}>
                <Button size="sm" onClick={saveMeta}>
                  Save
                </Button>
                <Button size="sm" variant="secondary" onClick={() => setEditingMeta(false)}>
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <>
              <RevealHeading as="h1" className="page-title" style={{ marginBottom: 6 }}>
                {course.name}
              </RevealHeading>
              {meta && <p className="page-subtitle" style={{ marginBottom: 10 }}>{meta}</p>}
              <CategorySelect
                categories={data.habitCategories}
                value={course.categoryId ?? null}
                onChange={(categoryId) => updateCourse(course.id, { categoryId })}
                usageCount={(id) => data.courses.filter((c) => c.categoryId === id).length}
                onCreateCategory={addHabitCategory}
                onRenameCategory={renameHabitCategory}
                onSetCategoryColor={setHabitCategoryColor}
                onDeleteCategory={deleteHabitCategory}
              />
            </>
          )}
        </div>

        {!editingMeta && (
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <Button variant="secondary" size="sm" onClick={startEditingMeta}>
              Edit details
            </Button>
            <Button variant="secondary" size="sm" onClick={() => navigate(`/courses?editCourse=${course.id}&mode=form`)}>
              Edit as form
            </Button>
            <Button variant="secondary" size="sm" onClick={() => navigate(`/courses?editCourse=${course.id}&mode=text`)}>
              Edit as text
            </Button>
            {confirmDelete ? (
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <Button variant="danger" size="sm" onClick={handleDeleteCourse}>
                  Confirm delete
                </Button>
                <Button variant="secondary" size="sm" onClick={() => setConfirmDelete(false)}>
                  Cancel
                </Button>
              </div>
            ) : (
              <Button variant="danger" size="sm" onClick={() => setConfirmDelete(true)}>
                Delete
              </Button>
            )}
          </div>
        )}
      </div>

      <div style={{ marginTop: 20 }}>
        <CourseStats stats={stats} />
      </div>

      {course.startDate && course.hoursPerDay ? (
        <div style={{ marginTop: 20 }}>
          <CourseSchedule course={course} categories={data.habitCategories} />
        </div>
      ) : null}

      <AnimatePresence initial={false}>
        {course.modules.map((module) => (
          <motion.div key={module.id} layout initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
            <ModuleSection
              courseId={course.id}
              module={module}
              onAddLectures={(moduleId) => setLectureSheetModuleId(moduleId)}
              actions={moduleActions}
            />
          </motion.div>
        ))}
      </AnimatePresence>

      {addingModule ? (
        <form onSubmit={handleAddModule} className="card" style={{ display: 'flex', gap: 10, marginBottom: 24 }}>
          <input
            autoFocus
            value={newModuleName}
            onChange={(e) => setNewModuleName(e.target.value)}
            placeholder="Section name (e.g. Linear Structures)"
            style={{ flex: 1 }}
          />
          <Button type="submit" size="sm">
            Add
          </Button>
          <Button type="button" variant="secondary" size="sm" onClick={() => setAddingModule(false)}>
            Cancel
          </Button>
        </form>
      ) : (
        <Button variant="secondary" onClick={() => setAddingModule(true)} style={{ marginBottom: 24 }}>
          + Add section
        </Button>
      )}

      {activeModule && (
        <AddLectureSheet
          open={!!activeModule}
          onClose={() => setLectureSheetModuleId(null)}
          moduleName={activeModule.name}
          onAdd={(lectures) => addTopics(course.id, activeModule.id, lectures)}
        />
      )}
    </div>
  )
}

export default CourseDetail
