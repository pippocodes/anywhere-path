import { useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import type { Course, HabitCategory } from '../../types'
import {
  parseCourseOutline,
  courseOutlineNodeToCourse,
  totalSecondsForCourse,
  totalLecturesForCourse,
  totalSecondsForNode,
  totalLecturesForNode,
  type CourseOutlineNode,
} from '../../utils/courseOutlineParser'
import { formatDuration } from '../../utils/duration'
import OutlineTextEditor from '../OutlineTextEditor'
import CategorySelect from '../categories/CategorySelect'
import Button from '../ui/Button'

const SAMPLE_TEXT = [
  'Anatomy Basics',
  '  Skeletal System',
  '    Bones of the arm (5:22)',
  '    Bones of the leg (7:10)',
  '  Muscular System',
  '    Major muscle groups (12:40)',
].join('\n')

type SavedCourse = Pick<Course, 'id' | 'name' | 'modules' | 'categoryId'>

interface Props {
  value: string
  onChange: (value: string) => void
  onSave: (courses: SavedCourse[]) => void
  saveLabel?: string
  categories: HabitCategory[]
  usageCount: (categoryId: string) => number
  onCreateCategory: (name: string, color: string) => HabitCategory
  onRenameCategory: (id: string, name: string) => void
  onSetCategoryColor: (id: string, color: string) => void
  onDeleteCategory: (id: string) => void
}

/** Tab 2 of the Roadmap Builder — write one or more courses as an indented outline, with a live preview and friendly inline errors. */
function CourseOutlineEditor({
  value,
  onChange,
  onSave,
  saveLabel = 'Save',
  categories,
  usageCount,
  onCreateCategory,
  onRenameCategory,
  onSetCategoryColor,
  onDeleteCategory,
}: Props) {
  const [howToOpen, setHowToOpen] = useState(false)
  const [defaultCategoryId, setDefaultCategoryId] = useState<string | null>(null)
  const [categoryOverrides, setCategoryOverrides] = useState<Record<string, string | null>>({})
  const parsed = useMemo(() => parseCourseOutline(value), [value])
  const canSave = parsed.errors.length === 0 && parsed.courses.length > 0

  const categoryProps = { categories, usageCount, onCreateCategory, onRenameCategory, onSetCategoryColor, onDeleteCategory }

  function categoryFor(rootId: string): string | null {
    return rootId in categoryOverrides ? categoryOverrides[rootId] : defaultCategoryId
  }

  function handleSave() {
    if (!canSave) return
    onSave(
      parsed.courses.map((root) => ({ ...courseOutlineNodeToCourse(root), categoryId: categoryFor(root.id) }))
    )
    setCategoryOverrides({})
  }

  return (
    <div id="course-outline-editor">
      <button
        type="button"
        onClick={() => setHowToOpen((v) => !v)}
        className="btn-outline"
        style={{ fontSize: 13, marginBottom: howToOpen ? 10 : 16, display: 'inline-flex', alignItems: 'center', gap: 6 }}
      >
        <motion.span animate={{ rotate: howToOpen ? 90 : 0 }} transition={{ duration: 0.2 }} style={{ display: 'inline-block' }}>
          ›
        </motion.span>
        How to write it
      </button>
      <AnimatePresence initial={false}>
        {howToOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25, ease: [0.2, 0.8, 0.2, 1] }}
            style={{ overflow: 'hidden' }}
          >
            <p className="page-subtitle" style={{ marginBottom: 16, fontSize: 13.5 }}>
              Indent with 2 spaces or a tab per level. Each line that starts at the very left (no indent) begins a
              new course. Add a duration at the end of any lecture line, like <code>(5:22)</code>,{' '}
              <code>(1:05:22)</code>, <code>(2h)</code>, <code>(45m)</code>, or <code>(1h 30m)</code>. You can nest
              sections up to 3 levels deep: section → module → sub-module.
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      <div style={{ marginBottom: 16 }}>
        <CategorySelect
          label="Category (applied to every course below — change a course's own category in the preview)"
          value={defaultCategoryId}
          onChange={setDefaultCategoryId}
          {...categoryProps}
        />
      </div>

      <div className="outline-layout">
        <div>
          <OutlineTextEditor
            value={value}
            onChange={onChange}
            placeholder={'Anatomy Basics\n  Skeletal System\n    Bones of the arm (5:22)\n    Bones of the leg (7:10)'}
            errors={parsed.errors}
          />
          <div style={{ display: 'flex', gap: 10, marginTop: 12, flexWrap: 'wrap' }}>
            <Button disabled={!canSave} onClick={handleSave}>
              {saveLabel}
            </Button>
            {value === '' && (
              <Button variant="secondary" onClick={() => onChange(SAMPLE_TEXT)}>
                Insert example
              </Button>
            )}
          </div>

          <AnimatePresence>
            {parsed.errors.length > 0 && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.2 }}
                className="outline-issues outline-issues-error"
                style={{ overflow: 'hidden', marginTop: 12 }}
              >
                {parsed.errors.map((err, i) => (
                  <div key={i}>⚠ Line {err.line}: {err.message}</div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="card outline-preview">
          {parsed.courses.length === 0 ? (
            <p style={{ color: 'var(--mute)', fontSize: 14 }}>
              Start typing on the left — the course (or courses) you're building will take shape here.
            </p>
          ) : (
            <>
              <div style={{ fontSize: 13, color: 'var(--mute)', fontWeight: 600, marginBottom: 14 }}>
                {parsed.courses.length} course{parsed.courses.length === 1 ? '' : 's'} will be created
              </div>
              {parsed.courses.map((course) => (
                <CoursePreviewCard
                  key={course.id}
                  course={course}
                  categoryId={categoryFor(course.id)}
                  onChangeCategory={(id) => setCategoryOverrides((prev) => ({ ...prev, [course.id]: id }))}
                  categoryProps={categoryProps}
                />
              ))}
            </>
          )}
        </div>
      </div>
    </div>
  )
}

interface CoursePreviewCategoryProps {
  categories: HabitCategory[]
  usageCount: (categoryId: string) => number
  onCreateCategory: (name: string, color: string) => HabitCategory
  onRenameCategory: (id: string, name: string) => void
  onSetCategoryColor: (id: string, color: string) => void
  onDeleteCategory: (id: string) => void
}

function CoursePreviewCard({
  course,
  categoryId,
  onChangeCategory,
  categoryProps,
}: {
  course: CourseOutlineNode
  categoryId: string | null
  onChangeCategory: (id: string | null) => void
  categoryProps: CoursePreviewCategoryProps
}) {
  const seconds = totalSecondsForCourse(course)
  const lectures = totalLecturesForCourse(course)
  return (
    <div className="card" style={{ marginBottom: 14, padding: '14px 16px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 8, gap: 10, flexWrap: 'wrap' }}>
        <span style={{ fontFamily: 'var(--font-display)', fontStyle: 'italic', fontWeight: 600, fontSize: 16 }}>
          {course.name}
        </span>
        <span style={{ fontSize: 12.5, color: 'var(--mute)', flexShrink: 0 }}>
          {lectures} lecture{lectures === 1 ? '' : 's'} · {formatDuration(seconds)}
        </span>
      </div>
      <div style={{ marginBottom: 10 }}>
        <CategorySelect value={categoryId} onChange={onChangeCategory} {...categoryProps} />
      </div>
      {course.children.length === 0 ? (
        <p style={{ fontSize: 12.5, color: 'var(--mute)', margin: 0 }}>No sections yet.</p>
      ) : (
        course.children.map((child) => <PreviewNode key={child.id} node={child} />)
      )}
    </div>
  )
}

function PreviewNode({ node }: { node: CourseOutlineNode }) {
  const isLeaf = node.children.length === 0
  const seconds = isLeaf ? node.durationSeconds ?? 0 : totalSecondsForNode(node)
  const lectures = totalLecturesForNode(node)

  return (
    <div style={{ marginLeft: (node.level - 1) * 16, marginTop: 4 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, fontSize: 13, padding: '3px 0' }}>
        <span style={{ color: isLeaf ? 'var(--cream)' : 'var(--mute)', fontWeight: isLeaf ? 400 : 600 }}>
          {isLeaf ? node.name : `· ${node.name}`}
        </span>
        <span className="outline-badge" style={{ flexShrink: 0, fontSize: 11 }}>
          {isLeaf ? formatDuration(seconds) : `${lectures} · ${formatDuration(seconds)}`}
        </span>
      </div>
      {node.children.map((child) => (
        <PreviewNode key={child.id} node={child} />
      ))}
    </div>
  )
}

export default CourseOutlineEditor
