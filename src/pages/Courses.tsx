import { useMemo, useState } from 'react'
import { AnimatePresence } from 'framer-motion'
import { useApp } from '../hooks/useApp'
import { makeId } from '../utils/id'
import CourseCard from '../components/courses/CourseCard'
import CategoryChip from '../components/categories/CategoryChip'
import AddCourseSheet from '../components/courses/AddCourseSheet'
import DeleteCourseModal from '../components/courses/DeleteCourseModal'
import Button from '../components/ui/Button'
import RevealHeading from '../components/ui/RevealHeading'
import EmptyState from '../components/ui/EmptyState'
import { useToast } from '../components/ui/Toast'

function Courses() {
  const { data, addCourse, deleteCourse, toggleTopic } = useApp()
  const { show: showToast } = useToast()
  const [sheetOpen, setSheetOpen] = useState(false)
  const [categoryFilter, setCategoryFilter] = useState<string | null | 'all'>('all')
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null)

  const deleteTarget = data.courses.find((c) => c.id === deleteTargetId) ?? null
  const linkedHabitCount = deleteTargetId ? data.habits.filter((h) => h.courseId === deleteTargetId).length : 0

  function handleConfirmDelete() {
    if (!deleteTarget) return
    deleteCourse(deleteTarget.id)
    showToast(`Deleted "${deleteTarget.name}"`, 'success')
    setDeleteTargetId(null)
  }

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

  return (
    <div className="page" style={{ maxWidth: 900 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16, marginBottom: 20 }}>
        <div>
          <RevealHeading as="h1" className="page-title" style={{ marginBottom: 6 }}>
            Course Tracker
          </RevealHeading>
          <p className="page-subtitle" style={{ marginBottom: 0 }}>
            Track subtopics, modules and progress for courses you're taking elsewhere.
          </p>
        </div>
        <Button onClick={() => setSheetOpen(true)}>+ New course</Button>
      </div>

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

      {data.courses.length === 0 ? (
        <EmptyState
          title="No courses yet"
          description="Add your first course to start tracking progress, subtopics and modules."
          actionLabel="Add your first course"
          onAction={() => setSheetOpen(true)}
        />
      ) : visibleCourses.length === 0 ? (
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
      />

      <AddCourseSheet open={sheetOpen} onClose={() => setSheetOpen(false)} onAdd={handleAdd} />
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
