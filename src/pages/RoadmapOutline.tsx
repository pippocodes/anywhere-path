import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import { SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { useApp } from '../hooks/useApp'
import { useAuth } from '../context/AuthContext'
import { parseOutline, serializeOutline, computeTotalMinutes, minutesToHours, formatHours } from '../utils/outlineParser'
import { scheduleOutline, buildScheduleIndex, formatDateLabel } from '../utils/scheduler'
import { renameNode, setNodeDuration, deleteNode, moveSibling } from '../utils/outlineTree'
import { computeProgress } from '../utils/roadmapProgress'
import { toDateStr } from '../utils/habits'
import { makeId } from '../utils/id'
import { OutlineEditorContext, type OutlineEditorApi } from '../context/OutlineEditorContext'
import type { Course, DurationUnit, OutlineNode } from '../types'
import OutlineNodeView from '../components/OutlineNodeView'
import OutlineTextEditor from '../components/OutlineTextEditor'
import CourseForm, { courseToFormValue, emptyFormValue, type CourseFormValue } from '../components/roadmapBuilder/CourseForm'
import CourseOutlineEditor from '../components/roadmapBuilder/CourseOutlineEditor'
import { serializeCourseToOutline } from '../utils/courseOutlineParser'
import CountUp from '../components/motion/CountUp'
import Button from '../components/ui/Button'
import Pills from '../components/ui/Pills'
import RevealHeading from '../components/ui/RevealHeading'

const SAMPLE_OUTLINE = [
  'Data Structures & Algorithms (8w)',
  '  Linear Structures',
  '    Arrays (5h)',
  '    Linked Lists (6h)',
  '    Stacks & Queues (5h)',
  '  Algorithms',
  '    Sorting',
  '      Bubble & Insertion Sort (2h)',
  '      Merge & Quick Sort (3h)',
  '    Searching (4h)',
  '    Dynamic Programming (8h)',
].join('\n')

const DEFAULT_WEEKDAYS = [0, 1, 2, 3, 4, 5, 6]
const WEEKDAY_LABELS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa']

function RoadmapOutline() {
  const {
    data,
    addRoadmapDoc,
    updateRoadmapDoc,
    deleteRoadmapDoc,
    addCourse,
    updateCourse,
    setCourseModules,
    addHabitCategory,
    renameHabitCategory,
    setHabitCategoryColor,
    deleteHabitCategory,
  } = useApp()
  const { session } = useAuth()
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()

  const [courseTab, setCourseTab] = useState<'form' | 'text'>('form')
  const [courseForm, setCourseForm] = useState<CourseFormValue>(emptyFormValue())
  const [editingCourseId, setEditingCourseId] = useState<string | null>(null)
  const [courseOutlineText, setCourseOutlineText] = useState('')
  const [editingTextCourseId, setEditingTextCourseId] = useState<string | null>(null)

  const [courseAiOpen, setCourseAiOpen] = useState(false)
  const [courseAiGoal, setCourseAiGoal] = useState('')
  const [courseAiLoading, setCourseAiLoading] = useState(false)
  const [courseAiError, setCourseAiError] = useState<string | null>(null)
  const [courseAiConfirmOverwrite, setCourseAiConfirmOverwrite] = useState(false)

  const [title, setTitle] = useState('')
  const [outlineText, setOutlineText] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)
  const [howToOpen, setHowToOpen] = useState(false)

  const [aiOpen, setAiOpen] = useState(false)
  const [aiGoal, setAiGoal] = useState('')
  const [aiLoading, setAiLoading] = useState(false)
  const [aiError, setAiError] = useState<string | null>(null)
  const [aiConfirmOverwrite, setAiConfirmOverwrite] = useState(false)

  const [startDate, setStartDate] = useState(() => toDateStr(new Date()))
  const [hoursPerDay, setHoursPerDay] = useState('2')
  const [weekdays, setWeekdays] = useState<number[]>(DEFAULT_WEEKDAYS)

  const [editingNameId, setEditingNameId] = useState<string | null>(null)
  const [nameDraft, setNameDraft] = useState('')
  const [editingDurationId, setEditingDurationId] = useState<string | null>(null)
  const [durationDraftValue, setDurationDraftValue] = useState('1')
  const [durationDraftUnit, setDurationDraftUnit] = useState<DurationUnit>('h')
  const [pendingDeleteNodeId, setPendingDeleteNodeId] = useState<string | null>(null)

  const fileInputRef = useRef<HTMLInputElement>(null)
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )

  const parsed = useMemo(() => parseOutline(outlineText), [outlineText])
  const totalMinutes = useMemo(() => computeTotalMinutes(parsed.nodes), [parsed.nodes])
  const canSave = parsed.errors.length === 0 && parsed.nodes.length > 0

  const scheduleOptions = useMemo(
    () => ({ startDate, hoursPerDay: Number(hoursPerDay) || 0, weekdays }),
    [startDate, hoursPerDay, weekdays]
  )
  const schedule = useMemo(() => scheduleOutline(parsed.nodes, scheduleOptions), [parsed.nodes, scheduleOptions])
  const scheduleIndex = useMemo(() => buildScheduleIndex(schedule.items), [schedule.items])

  function toggleWeekday(day: number) {
    setWeekdays((prev) => (prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day].sort()))
  }

  async function handleGenerate(e: React.FormEvent) {
    e.preventDefault()
    if (!aiGoal.trim() || aiLoading) return

    // Typing into a fresh/empty textarea is safe to just overwrite; anything
    // with real content gets a confirm step first since this isn't undoable.
    if (outlineText.trim() && !aiConfirmOverwrite) {
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
        setAiError(body?.message || 'Something went wrong generating the outline.')
        return
      }
      setOutlineText(body.outlineText)
      setAiOpen(false)
      setAiGoal('')
    } catch {
      setAiError('Could not reach the server — check your connection and try again.')
    } finally {
      setAiLoading(false)
    }
  }

  // Visual tree edits (rename/duration/delete/reorder) all funnel through
  // here: they rewrite the node tree, then serialize it straight back into
  // outlineText — the textarea stays the single source of truth either way.
  function applyTreeEdit(nextNodes: OutlineNode[]) {
    setOutlineText(serializeOutline(nextNodes))
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (!over || active.id === over.id) return
    applyTreeEdit(moveSibling(parsed.nodes, String(active.id), String(over.id)))
  }

  const editorApi: OutlineEditorApi = {
    scheduleIndex,

    editingNameId,
    nameDraft,
    startRename(id, currentName) {
      setEditingNameId(id)
      setNameDraft(currentName)
    },
    changeNameDraft: setNameDraft,
    commitRename() {
      const id = editingNameId
      setEditingNameId(null)
      if (!id) return
      const trimmed = nameDraft.trim()
      if (!trimmed) return
      applyTreeEdit(renameNode(parsed.nodes, id, trimmed))
    },
    cancelRename() {
      setEditingNameId(null)
    },

    editingDurationId,
    durationDraftValue,
    durationDraftUnit,
    startDuration(id, value, unit) {
      setEditingDurationId(id)
      setDurationDraftValue(String(value))
      setDurationDraftUnit(unit)
    },
    changeDurationDraftValue: setDurationDraftValue,
    changeDurationDraftUnit: setDurationDraftUnit,
    commitDuration() {
      const id = editingDurationId
      setEditingDurationId(null)
      if (!id) return
      const value = Number(durationDraftValue)
      if (!Number.isFinite(value) || value <= 0) return
      applyTreeEdit(setNodeDuration(parsed.nodes, id, { value, unit: durationDraftUnit }))
    },
    cancelDuration() {
      setEditingDurationId(null)
    },

    pendingDeleteId: pendingDeleteNodeId,
    requestDelete: setPendingDeleteNodeId,
    confirmDelete() {
      const id = pendingDeleteNodeId
      setPendingDeleteNodeId(null)
      if (!id) return
      applyTreeEdit(deleteNode(parsed.nodes, id))
    },
    cancelDelete() {
      setPendingDeleteNodeId(null)
    },
  }

  function handleExport() {
    const blob = new Blob([outlineText], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${(title.trim() || parsed.nodes[0]?.name || 'roadmap').replace(/[^\w\- ]+/g, '').trim() || 'roadmap'}.txt`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  function handleImportFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = '' // allow re-selecting the same file later
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      setOutlineText(String(reader.result ?? ''))
      setEditingId(null)
      if (!title.trim()) setTitle(file.name.replace(/\.[^.]+$/, ''))
    }
    reader.readAsText(file)
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
      const id = editingCourseId
      setEditingCourseId(null)
      setCourseForm(emptyFormValue())
      navigate(`/courses/${id}`)
      return
    }
    const newCourse: Course = { id: makeId('course'), modules: courseForm.modules, ...meta }
    addCourse(newCourse)
    setCourseForm(emptyFormValue())
    navigate(`/courses/${newCourse.id}`)
  }

  function categoryUsageCount(categoryId: string) {
    return data.courses.filter((c) => c.categoryId === categoryId).length
  }

  function handleSaveCoursesFromText(courses: Pick<Course, 'id' | 'name' | 'modules' | 'categoryId'>[]) {
    if (editingTextCourseId && courses.length > 0) {
      const [first, ...rest] = courses
      updateCourse(editingTextCourseId, { name: first.name, categoryId: first.categoryId })
      setCourseModules(editingTextCourseId, first.modules)
      for (const c of rest) addCourse(c as Course)
      const id = editingTextCourseId
      setEditingTextCourseId(null)
      setCourseOutlineText('')
      navigate(`/courses/${id}`)
      return
    }
    for (const c of courses) addCourse(c as Course)
    setCourseOutlineText('')
    navigate(courses.length === 1 ? `/courses/${courses[0].id}` : '/courses')
  }

  async function handleGenerateCourse(e: React.FormEvent) {
    e.preventDefault()
    if (!courseAiGoal.trim() || courseAiLoading) return

    if (courseOutlineText.trim() && !courseAiConfirmOverwrite) {
      setCourseAiConfirmOverwrite(true)
      return
    }
    setCourseAiConfirmOverwrite(false)
    setCourseAiLoading(true)
    setCourseAiError(null)

    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}),
        },
        body: JSON.stringify({ goal: courseAiGoal.trim() }),
      })
      const body = await res.json().catch(() => null)
      if (!res.ok) {
        setCourseAiError(body?.message || 'Something went wrong generating the outline.')
        return
      }
      // The generator writes the same indentation grammar this tab's parser
      // reads — only the destination differs (a Course, not a RoadmapDoc) —
      // so the raw text can be handed straight to the text tab for review.
      setCourseOutlineText(body.outlineText)
      setCourseTab('text')
      setCourseAiOpen(false)
      setCourseAiGoal('')
    } catch {
      setCourseAiError('Could not reach the server — check your connection and try again.')
    } finally {
      setCourseAiLoading(false)
    }
  }

  function handleSave() {
    if (!canSave) return
    const finalTitle = title.trim() || parsed.nodes[0].name
    const fields = { title: finalTitle, outlineText, startDate, hoursPerDay: Number(hoursPerDay) || 0, weekdays }
    let savedId: string
    if (editingId) {
      updateRoadmapDoc(editingId, fields)
      savedId = editingId
    } else {
      savedId = addRoadmapDoc(fields).id
    }
    setTitle(finalTitle)
    // Read-only-first: land on the saved roadmap's view, not back in the editor.
    navigate(`/roadmap/${savedId}`)
  }

  function handleNew() {
    setTitle('')
    setOutlineText('')
    setEditingId(null)
    setConfirmDeleteId(null)
    setStartDate(toDateStr(new Date()))
    setHoursPerDay('2')
    setWeekdays(DEFAULT_WEEKDAYS)
    setEditingNameId(null)
    setEditingDurationId(null)
    setPendingDeleteNodeId(null)
  }

  function handleEdit(id: string) {
    const doc = data.roadmapDocs.find((d) => d.id === id)
    if (!doc) return
    setTitle(doc.title)
    setOutlineText(doc.outlineText)
    setEditingId(doc.id)
    setConfirmDeleteId(null)
    setStartDate(doc.startDate ?? toDateStr(new Date()))
    setHoursPerDay(String(doc.hoursPerDay ?? 2))
    setWeekdays(doc.weekdays ?? DEFAULT_WEEKDAYS)
    setEditingNameId(null)
    setEditingDurationId(null)
    setPendingDeleteNodeId(null)
  }

  function handleDelete(id: string) {
    deleteRoadmapDoc(id)
    if (editingId === id) handleNew()
    setConfirmDeleteId(null)
  }

  // Arriving via "Edit as text" from the read-only view (/roadmap?edit=<id>)
  // loads that doc straight into the editor.
  useEffect(() => {
    const editParam = searchParams.get('edit')
    if (!editParam) return
    handleEdit(editParam)
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev)
      next.delete('edit')
      return next
    }, { replace: true })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams])

  // Arriving via "Edit as form" / "Edit as text" from a course's own page
  // (/roadmap?editCourse=<id>&mode=form|text) loads that course into
  // whichever tab was asked for, round-tripping its saved structure.
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
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev)
      next.delete('editCourse')
      next.delete('mode')
      return next
    }, { replace: true })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams, data.courses])

  return (
    <div className="page" style={{ maxWidth: 1100 }}>
      <RevealHeading as="h1" className="page-title">
        Roadmap Builder
      </RevealHeading>
      <p className="page-subtitle" style={{ marginBottom: 24 }}>
        Build a course directly, or write one as an outline below — both end up in your Course Tracker with the
        same progress and scheduling.
      </p>

      <div style={{ marginBottom: 44 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, marginBottom: 18 }}>
          <Pills
            options={[
              { value: 'form', label: 'Add course' },
              { value: 'text', label: 'Write it as text' },
            ]}
            value={courseTab}
            onChange={(v) => setCourseTab(v as 'form' | 'text')}
            layoutId="course-creation-mode"
          />
          {!courseAiOpen && (
            <button className="btn-secondary btn" onClick={() => setCourseAiOpen(true)}>
              Generate with AI
            </button>
          )}
        </div>

        {courseAiOpen && (
          <motion.form
            onSubmit={handleGenerateCourse}
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="card"
            style={{ padding: '18px 22px', marginBottom: 16, overflow: 'hidden' }}
          >
            <div style={{ fontWeight: 600, fontSize: 13.5, color: 'var(--mute)', marginBottom: 10 }}>
              Generate with AI
            </div>
            <p style={{ fontSize: 12.5, color: 'var(--mute)', marginBottom: 12 }}>
              Describe the course you want and it'll fill in the "Write it as text" tab for you to review and edit
              before saving.
            </p>
            {courseAiError && <div className="auth-notice auth-notice-error" style={{ marginBottom: 12 }}>{courseAiError}</div>}
            {courseAiConfirmOverwrite ? (
              <div className="outline-issues outline-issues-warning" style={{ marginBottom: 12 }}>
                This will replace what's currently in the text tab. Generate anyway?
                <div style={{ display: 'flex', gap: 10, marginTop: 10 }}>
                  <button type="submit" className="btn" style={{ padding: '7px 16px', fontSize: 12.5 }}>
                    Yes, replace it
                  </button>
                  <button type="button" className="btn-outline" onClick={() => setCourseAiConfirmOverwrite(false)}>
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div style={{ display: 'flex', gap: 10 }}>
                <input
                  autoFocus
                  value={courseAiGoal}
                  onChange={(e) => setCourseAiGoal(e.target.value)}
                  placeholder="e.g. a beginner course on data structures"
                  disabled={courseAiLoading}
                  style={{ flex: 1, padding: '10px 14px', borderRadius: 10, border: '1px solid var(--line)', fontSize: 14 }}
                />
                <button className="btn" type="submit" disabled={courseAiLoading || !courseAiGoal.trim()}>
                  {courseAiLoading ? 'Generating…' : 'Generate'}
                </button>
                <button
                  type="button"
                  className="btn-outline"
                  onClick={() => {
                    setCourseAiOpen(false)
                    setCourseAiError(null)
                    setCourseAiConfirmOverwrite(false)
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
                saveLabel="Save course"
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
                saveLabel="Save course(s)"
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

      <div style={{ borderTop: '1px solid var(--line)', paddingTop: 36, marginBottom: 20 }}>
        <h2 style={{ fontSize: 18, marginBottom: 6 }}>Outline Roadmaps</h2>
        <p className="page-subtitle" style={{ marginBottom: 16, fontSize: 13.5 }}>
          A separate saved-roadmap format: write or generate an indented outline and schedule it week by week.
        </p>
      </div>

      <button
        type="button"
        onClick={() => setHowToOpen((v) => !v)}
        className="btn-outline"
        style={{ fontSize: 13, marginBottom: howToOpen ? 10 : 20, display: 'inline-flex', alignItems: 'center', gap: 6 }}
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
            <p className="page-subtitle" style={{ marginBottom: 20, fontSize: 13.5 }}>
              Indent with 2 spaces or a tab per level — Topic → Subtopic → Module → Sub-module, up to 4 levels
              deep. Add a duration at the end of any line, like <code>(2h)</code>, <code>(45m)</code>,{' '}
              <code>(3d)</code> or <code>(2w)</code>.
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      <input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Roadmap name (defaults to your first topic)"
        style={{
          width: '100%',
          padding: '12px 14px',
          borderRadius: 10,
          border: '1px solid var(--line)',
          fontSize: 15,
          marginBottom: 16,
        }}
      />

      {aiOpen ? (
        <motion.form
          onSubmit={handleGenerate}
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="card"
          style={{ padding: '18px 22px', marginBottom: 16, overflow: 'hidden' }}
        >
          <div style={{ fontWeight: 600, fontSize: 13.5, color: 'var(--mute)', marginBottom: 10 }}>
            Generate with AI
          </div>
          <p style={{ fontSize: 12.5, color: 'var(--mute)', marginBottom: 12 }}>
            Describe what you want to learn and how much time you have — e.g. "learn data structures in 8 weeks,
            1h/day". You can edit the result before saving.
          </p>
          {aiError && <div className="auth-notice auth-notice-error" style={{ marginBottom: 12 }}>{aiError}</div>}
          {aiConfirmOverwrite ? (
            <div className="outline-issues outline-issues-warning" style={{ marginBottom: 12 }}>
              This will replace what's currently in the editor. Generate anyway?
              <div style={{ display: 'flex', gap: 10, marginTop: 10 }}>
                <button type="submit" className="btn" style={{ padding: '7px 16px', fontSize: 12.5 }}>
                  Yes, replace it
                </button>
                <button
                  type="button"
                  className="btn-outline"
                  onClick={() => setAiConfirmOverwrite(false)}
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', gap: 10 }}>
              <input
                autoFocus
                value={aiGoal}
                onChange={(e) => setAiGoal(e.target.value)}
                placeholder="e.g. learn data structures in 8 weeks, 1h/day"
                disabled={aiLoading}
                style={{ flex: 1, padding: '10px 14px', borderRadius: 10, border: '1px solid var(--line)', fontSize: 14 }}
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
      ) : (
        <button className="btn-secondary btn" style={{ marginBottom: 16 }} onClick={() => setAiOpen(true)}>
          Generate with AI
        </button>
      )}

      <div className="card" style={{ padding: '18px 22px', marginBottom: 16 }}>
        <div style={{ fontWeight: 600, fontSize: 13.5, color: 'var(--mute)', marginBottom: 14 }}>Scheduling</div>
        <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <div className="field" style={{ margin: 0 }}>
            <label htmlFor="roadmap-start-date">Start Date</label>
            <input
              id="roadmap-start-date"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              style={{ width: 170 }}
            />
          </div>
          <div className="field" style={{ margin: 0 }}>
            <label htmlFor="roadmap-hours-per-day">Hours Per Day</label>
            <input
              id="roadmap-hours-per-day"
              value={hoursPerDay}
              onChange={(e) => setHoursPerDay(e.target.value)}
              placeholder="e.g. 2"
              style={{ width: 100 }}
            />
          </div>
          <div>
            <label style={{ display: 'block', fontWeight: 600, fontSize: 13.5, color: 'var(--mute)', marginBottom: 8 }}>
              Study Days
            </label>
            <div style={{ display: 'flex', gap: 6 }} role="group" aria-label="Study days">
              {WEEKDAY_LABELS.map((label, day) => {
                const active = weekdays.includes(day)
                return (
                  <button
                    key={day}
                    type="button"
                    aria-pressed={active}
                    onClick={() => toggleWeekday(day)}
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: 9,
                      border: '1px solid var(--line)',
                      background: active ? 'var(--rose)' : 'var(--ink-2)',
                      color: active ? 'var(--ink)' : 'var(--mute)',
                      fontWeight: 700,
                      fontSize: 12.5,
                      transition: 'background 0.15s ease, color 0.15s ease',
                    }}
                  >
                    {label}
                  </button>
                )
              })}
            </div>
          </div>
        </div>
      </div>

      <div className="outline-layout">
        <div>
          <OutlineTextEditor
            value={outlineText}
            onChange={setOutlineText}
            placeholder={`Web Development (2w)\n  Frontend Basics\n    HTML Basics (4h)\n    CSS Fundamentals (5h)\n  Shipping It\n    Deploy (2h)`}
            errors={parsed.errors}
          />
          <div style={{ display: 'flex', gap: 10, marginTop: 12, flexWrap: 'wrap' }}>
            <Button disabled={!canSave} onClick={handleSave}>
              {editingId ? 'Update Roadmap' : 'Save Roadmap'}
            </Button>
            {outlineText === '' && (
              <Button variant="secondary" onClick={() => setOutlineText(SAMPLE_OUTLINE)}>
                Example
              </Button>
            )}
            {(outlineText !== '' || editingId) && (
              <button className="btn-outline" style={{ color: 'var(--mute)' }} onClick={handleNew}>
                Start a New Roadmap
              </button>
            )}
            {outlineText !== '' && (
              <button className="btn-outline" onClick={handleExport}>
                Export .txt
              </button>
            )}
            <button className="btn-outline" onClick={() => fileInputRef.current?.click()}>
              Import .txt
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".txt,text/plain"
              onChange={handleImportFile}
              style={{ display: 'none' }}
            />
          </div>

          <AnimatePresence>
            {parsed.errors.length > 0 && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.2 }}
                className="outline-issues outline-issues-error"
                style={{ overflow: 'hidden' }}
              >
                {parsed.errors.map((err, i) => (
                  <div key={i}>⚠ Line {err.line}: {err.message}</div>
                ))}
              </motion.div>
            )}
            {parsed.warnings.length > 0 && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.2 }}
                className="outline-issues outline-issues-warning"
                style={{ overflow: 'hidden' }}
              >
                {parsed.warnings.map((w, i) => (
                  <div key={i}>Line {w.line}: {w.message}</div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="card outline-preview">
          {parsed.nodes.length === 0 ? (
            <p style={{ color: 'var(--mute)', fontSize: 14 }}>
              Start typing on the left — your roadmap will take shape here as you go.
            </p>
          ) : (
            <>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 6 }}>
                <span style={{ fontSize: 13, color: 'var(--mute)', fontWeight: 600 }}>
                  {parsed.nodes.length} topic{parsed.nodes.length === 1 ? '' : 's'}
                </span>
                <span style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 800, fontSize: 18, color: 'var(--cream)' }}>
                  <CountUp value={minutesToHours(totalMinutes)} decimals={totalMinutes % 60 === 0 ? 0 : 1} suffix="h" /> total
                </span>
              </div>
              <div style={{ marginBottom: 14, fontSize: 12.5, color: 'var(--mute)' }}>
                {schedule.finishDate ? (
                  <>
                    Estimated finish: <strong>{formatDateLabel(schedule.finishDate)}</strong> ·{' '}
                    <CountUp value={schedule.totalDays} /> study day
                    {schedule.totalDays === 1 ? '' : 's'}
                  </>
                ) : (
                  'Pick at least one study day and hours/day above to see a schedule.'
                )}
              </div>
              <p style={{ fontSize: 11.5, color: 'var(--mute)', marginBottom: 10 }}>
                Click a name or duration to edit it, drag ⠿ to reorder.
              </p>
              <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                <OutlineEditorContext.Provider value={editorApi}>
                  <SortableContext items={parsed.nodes.map((n) => n.id)} strategy={verticalListSortingStrategy}>
                    {parsed.nodes.map((node) => (
                      <OutlineNodeView key={node.id} node={node} scheduleIndex={scheduleIndex} />
                    ))}
                  </SortableContext>
                </OutlineEditorContext.Provider>
              </DndContext>
            </>
          )}
        </div>
      </div>

      {data.roadmapDocs.length > 0 && (
        <div style={{ marginTop: 40 }}>
          <h2 style={{ fontSize: 18, marginBottom: 16 }}>Your Saved Roadmaps</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {data.roadmapDocs.map((doc) => {
              const docParsed = parseOutline(doc.outlineText)
              const docMinutes = computeTotalMinutes(docParsed.nodes)
              const docSchedule = scheduleOutline(docParsed.nodes, {
                startDate: doc.startDate ?? toDateStr(new Date()),
                hoursPerDay: doc.hoursPerDay ?? 2,
                weekdays: doc.weekdays ?? DEFAULT_WEEKDAYS,
              })
              const docProgress = computeProgress(docParsed.nodes, doc.completedPaths)
              return (
                <div
                  key={doc.id}
                  className="card card-sweep outline-doc-card"
                  onClick={() => navigate(`/roadmap/${doc.id}`)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') navigate(`/roadmap/${doc.id}`)
                  }}
                  style={{ cursor: 'pointer' }}
                >
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 15 }}>{doc.title}</div>
                    <div style={{ fontSize: 12.5, color: 'var(--mute)', marginTop: 2 }}>
                      {docParsed.nodes.length} topic{docParsed.nodes.length === 1 ? '' : 's'} · {formatHours(docMinutes)} total
                      {docSchedule.finishDate && <> · finishes {formatDateLabel(docSchedule.finishDate)}</>}
                      {docProgress.totalCount > 0 && <> · {Math.round(docProgress.percent)}% done</>}
                    </div>
                  </div>
                  {confirmDeleteId === doc.id ? (
                    <div style={{ display: 'flex', gap: 10, alignItems: 'center' }} onClick={(e) => e.stopPropagation()}>
                      <span style={{ fontSize: 13, color: 'var(--mute)' }}>Delete this roadmap?</span>
                      <button className="btn btn-danger" style={{ padding: '7px 14px', fontSize: 12.5 }} onClick={() => handleDelete(doc.id)}>
                        Yes, delete
                      </button>
                      <button className="btn-outline" style={{ color: 'var(--mute)' }} onClick={() => setConfirmDeleteId(null)}>
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <button
                      className="btn-outline"
                      style={{ opacity: 0.75 }}
                      onClick={(e) => {
                        e.stopPropagation()
                        setConfirmDeleteId(doc.id)
                      }}
                    >
                      Delete
                    </button>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

export default RoadmapOutline
