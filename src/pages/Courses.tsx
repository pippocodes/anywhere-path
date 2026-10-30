import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { useApp } from '../hooks/useApp'
import { useAuth } from '../context/AuthContext'
import { makeId } from '../utils/id'
import { serializeCourseToOutline } from '../utils/courseOutlineParser'
import type { Course } from '../types'
import CourseCard from '../components/courses/CourseCard'
import CategoryChip from '../components/categories/CategoryChip'
import DeleteCourseModal from '../components/courses/DeleteCourseModal'
import CourseForm, { courseToFormValue, emptyFormValue, type CourseFormValue } from '../components/roadmapBuilder/CourseForm'
import CourseOutlineEditor from '../components/roadmapBuilder/CourseOutlineEditor'
import Button from '../components/ui/Button'
import Pills from '../components/ui/Pills'
import RevealHeading from '../components/ui/RevealHeading'
import LearningTabs from '../components/learning/LearningTabs'
import EmptyState from '../components/ui/EmptyState'
import { useToast } from '../components/ui/Toast'

function Courses() {
  const {
    data,
    addCourse,
    updateCourse,
    setCourseModules,
    deleteCourse,
    toggleTopic,
    addHabitCategory,
    renameHabitCategory,
    setHabitCategoryColor,
    deleteHabitCategory,
  } = useApp()
  const { session } = useAuth()
  const { show: showToast } = useToast()
  const [searchParams, setSearchParams] = useSearchParams()

  const [categoryFilter, setCategoryFilter] = useState<string | null | 'all'>('all')
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null)

  const [addOpen, setAddOpen] = useState(false)
  const [courseTab, setCourseTab] = useState<'form' | 'text'>('form')
  const [courseForm, setCourseForm] = useState<CourseFormValue>(emptyFormValue())
  const [editingCourseId, setEditingCourseId] = useState<string | null>(null)
  const [courseOutlineText, setCourseOutlineText] = useState('')
  const [editingTextCourseId, setEditingTextCourseId] = useState<string | null>(null)

  const [aiOpen, setAiOpen] = useState(false)
  const [aiGoal, setAiGoal] = useState('')
  const [aiLoading, setAiLoading] = useState(false)
  const [aiError, setAiError] = useState<string | null>(null)
  const [aiConfirmOverwrite, setAiConfirmOverwrite] = useState(false)

  const deleteTarget = data.courses.find((c) => c.id === deleteTargetId) ?? null
  const linkedHabitCount = deleteTargetId ? data.habits.filter((h) => h.courseId === deleteTargetId).length : 0
  const linkedPlanCount = deleteTargetId ? data.plans.filter((p) => p.sourceCourseId === deleteTargetId).length : 0

  function categoryUsageCount(categoryId: string) {
    return data.courses.filter((c) => c.categoryId === categoryId).length
  }

  function resetAddPanel() {
    setCourseForm(emptyFormValue())
    setEditingCourseId(null)
    setCourseOutlineText('')
    setEditingTextCourseId(null)
    setCourseTab('form')
    setAiOpen(false)
    setAiError(null)
    setAiConfirmOverwrite(false)
  }

  function handleConfirmDelete() {
    if (!deleteTarget) return
    deleteCourse(deleteTarget.id)
    showToast(`Deleted "${deleteTarget.name}"`, 'success')
    setDeleteTargetId(null)
  }

  function handleSaveCourse() {
    const hoursPerDay = courseForm.hoursPerDay.trim() === '' ? undefined : Number(courseForm.hoursPerDay) || undefined
    const meta = {
      name: courseForm.name.trim(),
      platform: courseForm.platform.trim() || undefined,
      instructor: courseForm.instructor.trim() || undefined,
      startDate: courseForm.startDate || undefined,
      hoursPerDay,
      categoryId: courseForm.categoryId,
    }
    if (editingCourseId) {
      updateCourse(editingCourseId, meta)
      setCourseModules(editingCourseId, courseForm.modules)
      showToast(`Saved "${meta.name}"`, 'success')
    } else {
      addCourse({ id: makeId('course'), modules: courseForm.modules, ...meta })
      showToast(`Added "${meta.name}"`, 'success')
    }
    resetAddPanel()
    setAddOpen(false)
  }

  function handleSaveCoursesFromText(courses: Pick<Course, 'id' | 'name' | 'modules' | 'categoryId'>[]) {
    if (editingTextCourseId && courses.length > 0) {
      const [first, ...rest] = courses
      updateCourse(editingTextCourseId, { name: first.name, categoryId: first.categoryId })
      setCourseModules(editingTextCourseId, first.modules)
      for (const c of rest) addCourse(c as Course)
      showToast(`Saved "${first.name}"`, 'success')
    } else {
      for (const c of courses) addCourse(c as Course)
      showToast(courses.length === 1 ? `Added "${courses[0].name}"` : `Added ${courses.length} courses`, 'success')
    }
    resetAddPanel()
    setAddOpen(false)
  }

  async function handleGenerate(e: React.FormEvent) {
    e.preventDefault()
    if (!aiGoal.trim() || aiLoading) return
    if (courseOutlineText.trim() && !aiConfirmOverwrite) {
      setAiConfirmOverwrite(true)
      return
    }
    setAiConfirmOverwrite(false)
    setAiLoading(true)
    setAiError(null)
    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}),
        },
        body: JSON.stringify({ goal: aiGoal.trim() }),
      })
      const body = await res.json().catch(() => null)
      if (!res.ok) {
        setAiError(body?.message || 'Something went wrong generating the outline. AI may not be configured for this app yet.')
        return
      }
      setCourseOutlineText(body.outlineText)
      setCourseTab('text')
      setAiOpen(false)
      setAiGoal('')
    } catch {
      setAiError('Could not reach the server — check your connection and try again.')
    } finally {
      setAiLoading(false)
    }
  }

  // Arriving via "Edit as form" / "Edit as text" from a course's own page
  // (/courses?editCourse=<id>&mode=form|text) opens the add panel on
  // whichever tab was asked for, pre-filled with that course's structure.
  useEffect(() => {
    const courseId = searchParams.get('editCourse')
    if (!courseId) return
    const course = data.courses.find((c) => c.id === courseId)
    if (!course) return
    const mode = searchParams.get('mode') === 'text' ? 'text' : 'form'
    if (mode === 'text') {
      setCourseOutlineText(serializeCourseToOutline(course))
      setEditingTextCourseId(course.id)
    } else {
      setCourseForm(courseToFormValue(course))
      setEditingCourseId(course.id)
    }
    setCourseTab(mode)
    setAddOpen(true)
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev)
        next.delete('editCourse')
        next.delete('mode')
        return next
      },
      { replace: true }
    )
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams, data.courses])

  // Only categories actually used by a course show up as filter chips — no
  // point offering a filter for a category with nothing in it here.
  const usedCategoryIds = useMemo(() => {
    const ids = new Set<string | null>()
    for (const c of data.courses) ids.add(c.categoryId ?? null)
    return ids
  }, [data.courses])
  const filterCategories = data.habitCategories.filter((c) => usedCategoryIds.has(c.id))
  const showOtherFilter = usedCategoryIds.has(null)

  const visibleCourses =
    categoryFilter === 'all' ? data.courses : data.courses.filter((c) => (c.categoryId ?? null) === categoryFilter)

  function openAddPanel() {
    resetAddPanel()
    setAddOpen(true)
  }

  return (
    <div className="page" style={{ maxWidth: 900 }}>
      <LearningTabs />
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16, marginBottom: 20 }}>
        <div>
          <RevealHeading as="h1" className="page-title" style={{ marginBottom: 6 }}>
            My Learning
          </RevealHeading>
          <p className="page-subtitle" style={{ marginBottom: 0 }}>
            Track subtopics, modules and progress for courses you're taking elsewhere.
          </p>
        </div>
        {!addOpen && <Button onClick={openAddPanel}>+ Add course</Button>}
      </div>

      <AnimatePresence initial={false}>
        {addOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25, ease: [0.2, 0.8, 0.2, 1] }}
            style={{ overflow: 'hidden', marginBottom: 28 }}
          >
            <div className="card" style={{ padding: '20px 22px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, marginBottom: 18 }}>
                <Pills
                  options={[
                    { value: 'form', label: 'Fill the form' },
                    { value: 'text', label: 'Write it as text' },
                  ]}
                  value={courseTab}
                  onChange={(v) => setCourseTab(v as 'form' | 'text')}
                  layoutId="course-creation-mode"
                />
                <div style={{ display: 'flex', gap: 10 }}>
                  {!aiOpen && (
                    <button className="btn-secondary btn" type="button" onClick={() => setAiOpen(true)}>
                      Generate with AI
                    </button>
                  )}
                  <button
                    className="btn-outline"
                    type="button"
                    onClick={() => {
                      resetAddPanel()
                      setAddOpen(false)
                    }}
                  >
                    Close
                  </button>
                </div>
              </div>

              {aiOpen && (
                <motion.form
                  onSubmit={handleGenerate}
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="card"
                  style={{ padding: '18px 22px', marginBottom: 16, overflow: 'hidden' }}
                >
                  <div style={{ fontWeight: 600, fontSize: 13.5, color: 'var(--mute)', marginBottom: 10 }}>Generate with AI</div>
                  <p style={{ fontSize: 12.5, color: 'var(--mute)', marginBottom: 12 }}>
                    Describe the course you want and it'll fill in "Write it as text" for you to review and edit before saving.
                  </p>
                  {aiError && <div className="auth-notice auth-notice-error" style={{ marginBottom: 12 }}>{aiError}</div>}
                  {aiConfirmOverwrite ? (
                    <div className="outline-issues outline-issues-warning" style={{ marginBottom: 12 }}>
                      This will replace what's currently in the text tab. Generate anyway?
                      <div style={{ display: 'flex', gap: 10, marginTop: 10 }}>
                        <button type="submit" className="btn" style={{ padding: '7px 16px', fontSize: 12.5 }}>
                          Yes, replace it
                        </button>
                        <button type="button" className="btn-outline" onClick={() => setAiConfirmOverwrite(false)}>
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                      <input
                        autoFocus
                        value={aiGoal}
                        onChange={(e) => setAiGoal(e.target.value)}
                        placeholder="e.g. a beginner course on data structures"
                        disabled={aiLoading}
                        style={{ flex: 1, minWidth: 200, padding: '10px 14px', borderRadius: 10, border: '1px solid var(--line)', fontSize: 14 }}
                      />
                      <button className="btn" type="submit" disabled={aiLoading || !aiGoal.trim()}>
                        {aiLoading ? 'Generating…' : 'Generate'}
                      </button>
                      <button
                        type="button"
                        className="btn-outline"
                        onClick={() => {
                          setAiOpen(false)
                          setAiError(null)
                          setAiConfirmOverwrite(false)
                        }}
                      >
                        Cancel
                      </button>
                    </div>
                  )}
                </motion.form>
              )}

              <AnimatePresence mode="wait" initial={false}>
                {courseTab === 'form' ? (
                  <motion.div key="form" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.18 }}>
                    <CourseForm
                      value={courseForm}
                      onChange={setCourseForm}
                      onSave={handleSaveCourse}
                      saveLabel={editingCourseId ? 'Save changes' : 'Save course'}
                      categories={data.habitCategories}
                      usageCount={categoryUsageCount}
                      onCreateCategory={addHabitCategory}
                      onRenameCategory={renameHabitCategory}
                      onSetCategoryColor={setHabitCategoryColor}
                      onDeleteCategory={deleteHabitCategory}
                    />
                  </motion.div>
                ) : (
                  <motion.div key="text" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.18 }}>
                    <CourseOutlineEditor
                      value={courseOutlineText}
                      onChange={setCourseOutlineText}
                      onSave={handleSaveCoursesFromText}
                      saveLabel={editingTextCourseId ? 'Save changes' : 'Save course(s)'}
                      categories={data.habitCategories}
                      usageCount={categoryUsageCount}
                      onCreateCategory={addHabitCategory}
                      onRenameCategory={renameHabitCategory}
                      onSetCategoryColor={setHabitCategoryColor}
                      onDeleteCategory={deleteHabitCategory}
                    />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {data.courses.length > 0 && (filterCategories.length > 0 || showOtherFilter) && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 20 }}>
          <FilterChip active={categoryFilter === 'all'} onClick={() => setCategoryFilter('all')}>
            All
          </FilterChip>
          {filterCategories.map((cat) => (
            <FilterChip key={cat.id} active={categoryFilter === cat.id} onClick={() => setCategoryFilter(cat.id)}>
              <CategoryChip categories={data.habitCategories} categoryId={cat.id} />
            </FilterChip>
          ))}
          {showOtherFilter && (
            <FilterChip active={categoryFilter === null} onClick={() => setCategoryFilter(null)}>
              <CategoryChip categories={data.habitCategories} categoryId={null} />
            </FilterChip>
          )}
        </div>
      )}

      {data.courses.length === 0 && !addOpen ? (
        <EmptyState
          title="No courses yet"
          description="Add your first course to start tracking progress, subtopics and modules."
          actionLabel="Add your first course"
          onAction={openAddPanel}
        />
      ) : visibleCourses.length === 0 && data.courses.length > 0 ? (
        <p style={{ color: 'var(--mute)', fontSize: 14 }}>No courses in this category.</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <AnimatePresence initial={false}>
            {visibleCourses.map((course) => (
              <CourseCard
                key={course.id}
                course={course}
                categories={data.habitCategories}
                onToggleTopic={toggleTopic}
                onRequestDelete={() => setDeleteTargetId(course.id)}
              />
            ))}
          </AnimatePresence>
        </div>
      )}

      <DeleteCourseModal
        open={!!deleteTarget}
        onClose={() => setDeleteTargetId(null)}
        onConfirm={handleConfirmDelete}
        courseName={deleteTarget?.name ?? ''}
        linkedHabitCount={linkedHabitCount}
        linkedPlanCount={linkedPlanCount}
      />
    </div>
  )
}

function FilterChip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        padding: typeof children === 'string' ? '3px 11px' : 1,
        borderRadius: 999,
        border: active ? '1px solid var(--gold)' : '1px solid transparent',
        background: 'transparent',
        fontSize: 12.5,
        fontWeight: 600,
        color: 'var(--cream)',
      }}
    >
      {children}
    </button>
  )
}

export default Courses
