import { useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
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
import { parseOutline, serializeOutline, computeTotalMinutes, formatHours } from '../utils/outlineParser'
import { scheduleOutline, buildScheduleIndex, formatDateLabel } from '../utils/scheduler'
import { renameNode, setNodeDuration, deleteNode, moveSibling } from '../utils/outlineTree'
import { toDateStr } from '../utils/habits'
import { OutlineEditorContext, type OutlineEditorApi } from '../context/OutlineEditorContext'
import type { DurationUnit, OutlineNode } from '../types'
import OutlineNodeView from '../components/OutlineNodeView'

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
  const { data, addRoadmapDoc, updateRoadmapDoc, deleteRoadmapDoc } = useApp()

  const [title, setTitle] = useState('')
  const [outlineText, setOutlineText] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)

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

  function handleSave() {
    if (!canSave) return
    const finalTitle = title.trim() || parsed.nodes[0].name
    const fields = { title: finalTitle, outlineText, startDate, hoursPerDay: Number(hoursPerDay) || 0, weekdays }
    if (editingId) {
      updateRoadmapDoc(editingId, fields)
    } else {
      const doc = addRoadmapDoc(fields)
      setEditingId(doc.id)
    }
    setTitle(finalTitle)
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

  return (
    <div className="page" style={{ maxWidth: 1100 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 className="page-title">Roadmap Builder</h1>
          <p className="page-subtitle" style={{ marginBottom: 20 }}>
            Type or paste an outline — indent with 2 spaces or a tab per level. Topic → Subtopic → Module →
            Sub-module, up to 4 levels deep. Add a duration at the end of any line, like{' '}
            <code>(2h)</code>, <code>(45m)</code>, <code>(3d)</code> or <code>(2w)</code>.
          </p>
        </div>
        <p style={{ fontSize: 13, color: 'var(--rose)' }}>
          Have an existing course? <Link to="/courses" style={{ textDecoration: 'underline' }}>Build its roadmap the classic way</Link>.
        </p>
      </div>

      <input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Roadmap name (defaults to your first topic)"
        style={{
          width: '100%',
          padding: '12px 14px',
          borderRadius: 10,
          border: '1px solid var(--pink-pale)',
          fontSize: 15,
          marginBottom: 16,
        }}
      />

      <div className="card" style={{ padding: '18px 22px', marginBottom: 16 }}>
        <div style={{ fontWeight: 600, fontSize: 13.5, color: 'var(--rose)', marginBottom: 14 }}>Scheduling</div>
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
            <label style={{ display: 'block', fontWeight: 600, fontSize: 13.5, color: 'var(--plum)', marginBottom: 8 }}>
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
                      border: '1px solid var(--pink-pale)',
                      background: active ? 'var(--pink)' : 'var(--card-bg)',
                      color: active ? 'var(--bg)' : 'var(--rose)',
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
          <textarea
            className="outline-textarea"
            value={outlineText}
            onChange={(e) => setOutlineText(e.target.value)}
            placeholder={`Web Development (2w)\n  Frontend Basics\n    HTML Basics (4h)\n    CSS Fundamentals (5h)\n  Shipping It\n    Deploy (2h)`}
            spellCheck={false}
          />
          <div style={{ display: 'flex', gap: 10, marginTop: 12, flexWrap: 'wrap' }}>
            <button className="btn" disabled={!canSave} onClick={handleSave}>
              {editingId ? 'Update Roadmap' : 'Save Roadmap'}
            </button>
            {outlineText === '' && (
              <button className="btn-secondary btn" onClick={() => setOutlineText(SAMPLE_OUTLINE)}>
                Load an Example
              </button>
            )}
            {(outlineText !== '' || editingId) && (
              <button className="btn-outline" style={{ color: 'var(--plum)' }} onClick={handleNew}>
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

          {parsed.errors.length > 0 && (
            <div className="outline-issues outline-issues-error">
              {parsed.errors.map((err, i) => (
                <div key={i}>⚠ Line {err.line}: {err.message}</div>
              ))}
            </div>
          )}
          {parsed.warnings.length > 0 && (
            <div className="outline-issues outline-issues-warning">
              {parsed.warnings.map((w, i) => (
                <div key={i}>Line {w.line}: {w.message}</div>
              ))}
            </div>
          )}
        </div>

        <div className="card outline-preview">
          {parsed.nodes.length === 0 ? (
            <p style={{ color: 'var(--rose)', fontSize: 14 }}>
              Start typing on the left — your roadmap will take shape here as you go.
            </p>
          ) : (
            <>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 6 }}>
                <span style={{ fontSize: 13, color: 'var(--rose)', fontWeight: 600 }}>
                  {parsed.nodes.length} topic{parsed.nodes.length === 1 ? '' : 's'}
                </span>
                <span style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 800, fontSize: 18, color: 'var(--ink)' }}>
                  {formatHours(totalMinutes)} total
                </span>
              </div>
              <div style={{ marginBottom: 14, fontSize: 12.5, color: 'var(--plum)' }}>
                {schedule.finishDate ? (
                  <>
                    Estimated finish: <strong>{formatDateLabel(schedule.finishDate)}</strong> · {schedule.totalDays} study day
                    {schedule.totalDays === 1 ? '' : 's'}
                  </>
                ) : (
                  'Pick at least one study day and hours/day above to see a schedule.'
                )}
              </div>
              <p style={{ fontSize: 11.5, color: 'var(--rose)', marginBottom: 10 }}>
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
              return (
                <div key={doc.id} className="card outline-doc-card">
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 15 }}>{doc.title}</div>
                    <div style={{ fontSize: 12.5, color: 'var(--rose)', marginTop: 2 }}>
                      {docParsed.nodes.length} topic{docParsed.nodes.length === 1 ? '' : 's'} · {formatHours(docMinutes)} total
                      {docSchedule.finishDate && <> · finishes {formatDateLabel(docSchedule.finishDate)}</>}
                    </div>
                  </div>
                  {confirmDeleteId === doc.id ? (
                    <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                      <span style={{ fontSize: 13, color: 'var(--plum)' }}>Delete this roadmap?</span>
                      <button className="btn btn-danger" style={{ padding: '7px 14px', fontSize: 12.5 }} onClick={() => handleDelete(doc.id)}>
                        Yes, delete
                      </button>
                      <button className="btn-outline" style={{ color: 'var(--rose)' }} onClick={() => setConfirmDeleteId(null)}>
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', gap: 16 }}>
                      <button className="btn-outline" onClick={() => handleEdit(doc.id)}>
                        Edit
                      </button>
                      <button className="btn-outline" style={{ opacity: 0.75 }} onClick={() => setConfirmDeleteId(doc.id)}>
                        Delete
                      </button>
                    </div>
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
