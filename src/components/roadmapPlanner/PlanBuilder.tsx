import { useMemo, useRef, useState, type FormEvent } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useApp } from '../../hooks/useApp'
import { useAuth } from '../../context/AuthContext'
import { useIsPhone } from '../../hooks/useIsPhone'
import { useToast } from '../ui/Toast'
import Pills from '../ui/Pills'
import CategorySelect from '../categories/CategorySelect'
import CategoryChip from '../categories/CategoryChip'
import RealityCheckCard from './RealityCheckCard'
import { courseToSteps } from '../../utils/courseToSteps'
import { parseCourseOutline, courseOutlineNodeToCourse } from '../../utils/courseOutlineParser'
import { computeRealityCheck } from '../../utils/realityCheck'
import { schedulePlanSteps, parseDateStr, addCalendarDays } from '../../utils/planScheduler'
import { parseDuration, formatDuration } from '../../utils/duration'
import { formatDateLabel } from '../../utils/scheduler'
import { toDateStr } from '../../utils/habits'
import { makeId } from '../../utils/id'
import { categoryColor } from '../../utils/courseCategory'
import type { Plan, PlanSourceType, PlanStep } from '../../types'

const DEFAULT_WEEKDAYS = [0, 1, 2, 3, 4, 5, 6]
const WEEKDAY_LABELS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa']

const SOURCE_OPTIONS: { value: PlanSourceType; label: string }[] = [
  { value: 'course', label: 'From my courses' },
  { value: 'ai', label: 'Generate with AI' },
  { value: 'custom', label: 'Custom goal' },
]

function blankState() {
  return {
    categoryId: null as string | null,
    sourceType: 'course' as PlanSourceType,
    sourceCourseId: null as string | null,
    title: '',
    steps: [] as PlanStep[],
    excludedIds: new Set<string>(),
    startDate: toDateStr(new Date()),
    days: '14',
    hoursPerDay: '2',
    weekdays: DEFAULT_WEEKDAYS,
  }
}

interface Props {
  editingPlan: Plan | null
  onDoneEditing: () => void
}

/** The "plan how to finish something" builder — category → source (course/AI/custom) → schedule → reality check → day-by-day output → save. */
function PlanBuilder({ editingPlan, onDoneEditing }: Props) {
  const { data, addPlan, updatePlan, addHabitCategory, renameHabitCategory, setHabitCategoryColor, deleteHabitCategory } = useApp()
  const { session } = useAuth()
  const { show: showToast } = useToast()
  const isPhone = useIsPhone()

  const init = editingPlan
    ? {
        categoryId: editingPlan.categoryId,
        sourceType: editingPlan.sourceType,
        sourceCourseId: editingPlan.sourceCourseId,
        title: editingPlan.title,
        steps: editingPlan.steps,
        excludedIds: new Set<string>(),
        startDate: editingPlan.startDate,
        days: String(editingPlan.days),
        hoursPerDay: String(editingPlan.hoursPerDay),
        weekdays: editingPlan.weekdays,
      }
    : blankState()

  const [categoryId, setCategoryId] = useState(init.categoryId)
  const [sourceType, setSourceType] = useState<PlanSourceType>(init.sourceType)
  const [sourceCourseId, setSourceCourseId] = useState(init.sourceCourseId)
  const [title, setTitle] = useState(init.title)
  const [steps, setSteps] = useState<PlanStep[]>(init.steps)
  const [excludedIds, setExcludedIds] = useState<Set<string>>(init.excludedIds)
  const [startDate, setStartDate] = useState(init.startDate)
  const [days, setDays] = useState(init.days)
  const [hoursPerDay, setHoursPerDay] = useState(init.hoursPerDay)
  const [weekdays, setWeekdays] = useState<number[]>(init.weekdays)

  const [aiTopic, setAiTopic] = useState('')
  const [aiDescription, setAiDescription] = useState('')
  const [aiLoading, setAiLoading] = useState(false)
  const [aiError, setAiError] = useState<string | null>(null)

  const [newStepTitle, setNewStepTitle] = useState('')
  const [newStepDuration, setNewStepDuration] = useState('')
  const newStepTitleRef = useRef<HTMLInputElement>(null)

  const [scheduleCollapsed, setScheduleCollapsed] = useState(true)
  const stepsRef = useRef<HTMLDivElement>(null)

  function categoryUsageCount(id: string) {
    return data.courses.filter((c) => c.categoryId === id).length + data.plans.filter((p) => p.categoryId === id).length
  }

  const includedSteps = useMemo(() => steps.filter((s) => !excludedIds.has(s.id)), [steps, excludedIds])
  const requiredSeconds = useMemo(() => includedSteps.reduce((sum, s) => sum + s.estimatedSeconds, 0), [includedSteps])

  const realityResult = useMemo(
    () =>
      computeRealityCheck({
        startDate,
        days: Number(days) || 0,
        hoursPerDay: Number(hoursPerDay) || 0,
        weekdays,
        requiredSeconds,
      }),
    [startDate, days, hoursPerDay, weekdays, requiredSeconds]
  )

  const schedule = useMemo(
    () => schedulePlanSteps(includedSteps, { startDate, hoursPerDay: Number(hoursPerDay) || 0, weekdays }),
    [includedSteps, startDate, hoursPerDay, weekdays]
  )

  const endDate = Number(days) > 0 ? addCalendarDays(startDate, Number(days) - 1) : startDate

  function handleEndDateChange(value: string) {
    const diffDays = Math.round((parseDateStr(value).getTime() - parseDateStr(startDate).getTime()) / 86400000) + 1
    setDays(String(Math.max(1, diffDays)))
  }

  function toggleWeekday(day: number) {
    setWeekdays((prev) => (prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day].sort()))
  }

  function toggleStepIncluded(id: string) {
    setExcludedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function updateStepTitle(id: string, value: string) {
    setSteps((prev) => prev.map((s) => (s.id === id ? { ...s, title: value } : s)))
  }

  function updateStepDuration(id: string, seconds: number) {
    setSteps((prev) => prev.map((s) => (s.id === id ? { ...s, estimatedSeconds: seconds } : s)))
  }

  function removeStep(id: string) {
    setSteps((prev) => prev.filter((s) => s.id !== id))
    setExcludedIds((prev) => {
      const next = new Set(prev)
      next.delete(id)
      return next
    })
  }

  function addCustomStep() {
    const trimmedTitle = newStepTitle.trim()
    if (!trimmedTitle) return
    const seconds = parseDuration(newStepDuration) ?? 0
    setSteps((prev) => [...prev, { id: makeId('step'), title: trimmedTitle, estimatedSeconds: seconds, done: false }])
    setNewStepTitle('')
    setNewStepDuration('')
    newStepTitleRef.current?.focus()
  }

  function handlePickCourse(courseId: string) {
    const course = data.courses.find((c) => c.id === courseId)
    if (!course) return
    setSourceCourseId(courseId)
    setSteps(courseToSteps(course))
    setExcludedIds(new Set())
    if (!title.trim()) setTitle(course.name)
    if (categoryId === null && course.categoryId) setCategoryId(course.categoryId)
  }

  async function handleGenerateAI(e: FormEvent) {
    e.preventDefault()
    if (aiLoading) return
    const topic = aiTopic.trim()
    const description = aiDescription.trim()
    if (!topic && !description) return

    setAiLoading(true)
    setAiError(null)
    try {
      const categoryName = categoryId ? data.habitCategories.find((c) => c.id === categoryId)?.name : null
      const goal = [categoryName, topic, description].filter(Boolean).join(' — ')
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}),
        },
        body: JSON.stringify({ goal }),
      })
      const body = await res.json().catch(() => null)
      if (!res.ok) {
        setAiError(body?.message || 'Something went wrong generating this plan.')
        return
      }
      const parsed = parseCourseOutline(body.outlineText)
      const firstCourse = parsed.courses[0]
      if (!firstCourse || parsed.errors.length > 0) {
        setAiError("Couldn't turn that into a usable plan — try rephrasing your goal.")
        return
      }
      const built = courseOutlineNodeToCourse(firstCourse)
      setSteps(courseToSteps(built))
      setExcludedIds(new Set())
      if (!title.trim()) setTitle(built.name)
    } catch {
      setAiError('Could not reach the server — check your connection and try again.')
    } finally {
      setAiLoading(false)
    }
  }

  function handleFixIncreaseHours() {
    if (realityResult.suggestedHoursPerDay !== null) setHoursPerDay(String(realityResult.suggestedHoursPerDay))
  }

  function handleFixExtendDays() {
    if (realityResult.suggestedDays !== null) setDays(String(realityResult.suggestedDays))
  }

  function handleFixTrimScope() {
    stepsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }

  function resetBuilder() {
    const fresh = blankState()
    setCategoryId(fresh.categoryId)
    setSourceType(fresh.sourceType)
    setSourceCourseId(fresh.sourceCourseId)
    setTitle(fresh.title)
    setSteps(fresh.steps)
    setExcludedIds(fresh.excludedIds)
    setStartDate(fresh.startDate)
    setDays(fresh.days)
    setHoursPerDay(fresh.hoursPerDay)
    setWeekdays(fresh.weekdays)
    setAiTopic('')
    setAiDescription('')
    setAiError(null)
    setNewStepTitle('')
    setNewStepDuration('')
  }

  const canSave = includedSteps.length > 0 && Number(days) > 0 && Number(hoursPerDay) > 0 && weekdays.length > 0

  function handleSave() {
    if (!canSave) return
    const fields: Omit<Plan, 'id' | 'createdAt' | 'updatedAt'> = {
      title: title.trim() || 'Untitled plan',
      categoryId,
      sourceType,
      sourceCourseId: sourceType === 'course' ? sourceCourseId : null,
      steps: includedSteps,
      startDate,
      days: Number(days),
      hoursPerDay: Number(hoursPerDay),
      weekdays,
    }
    if (editingPlan) {
      updatePlan(editingPlan.id, fields)
      showToast('Plan updated')
      onDoneEditing()
    } else {
      addPlan(fields)
      showToast('Plan saved')
      resetBuilder()
    }
  }

  return (
    <div className="card" style={{ padding: '22px 24px', display: 'flex', flexDirection: 'column', gap: 22 }}>
      {editingPlan && (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span className="micro-label">Editing "{editingPlan.title}"</span>
          <button type="button" className="btn-outline" style={{ fontSize: 12 }} onClick={onDoneEditing}>
            Cancel edit
          </button>
        </div>
      )}

      <div>
        <div className="micro-label" style={{ marginBottom: 8 }}>
          1. Category
        </div>
        <CategorySelect
          categories={data.habitCategories}
          value={categoryId}
          onChange={setCategoryId}
          usageCount={categoryUsageCount}
          onCreateCategory={addHabitCategory}
          onRenameCategory={renameHabitCategory}
          onSetCategoryColor={setHabitCategoryColor}
          onDeleteCategory={deleteHabitCategory}
        />
      </div>

      <div>
        <div className="micro-label" style={{ marginBottom: 8 }}>
          2. Source
        </div>
        <Pills
          options={SOURCE_OPTIONS}
          value={sourceType}
          onChange={(v) => setSourceType(v as PlanSourceType)}
          layoutId="plan-source-pills"
        />

        <div style={{ marginTop: 16 }}>
          {sourceType === 'course' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 260, overflowY: 'auto' }}>
              {data.courses.length === 0 ? (
                <p style={{ fontSize: 13, color: 'var(--mute)' }}>
                  You don't have any courses yet — add one on the Courses page first, or pick "Custom goal" / "Generate with AI" instead.
                </p>
              ) : (
                data.courses.map((course) => {
                  const active = course.id === sourceCourseId
                  const courseSteps = courseToSteps(course)
                  const total = courseSteps.reduce((sum, s) => sum + s.estimatedSeconds, 0)
                  return (
                    <button
                      key={course.id}
                      type="button"
                      onClick={() => handlePickCourse(course.id)}
                      className="card card-sweep"
                      style={{
                        textAlign: 'left',
                        padding: '12px 14px',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        gap: 10,
                        border: active ? '1px solid var(--gold)' : undefined,
                      }}
                    >
                      <span style={{ minWidth: 0 }}>
                        <span style={{ fontWeight: 600, fontSize: 13.5 }}>{course.name}</span>{' '}
                        <CategoryChip categories={data.habitCategories} categoryId={course.categoryId} />
                      </span>
                      <span style={{ fontSize: 12, color: 'var(--mute)', flexShrink: 0 }}>
                        {courseSteps.length} module{courseSteps.length === 1 ? '' : 's'} · {formatDuration(total)}
                      </span>
                    </button>
                  )
                })
              )}
            </div>
          )}

          {sourceType === 'ai' && (
            <form onSubmit={handleGenerateAI} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {aiError && (
                <div className="auth-notice auth-notice-error">
                  <div style={{ marginBottom: 10 }}>{aiError}</div>
                  <button
                    type="button"
                    className="btn-outline"
                    style={{ fontSize: 12.5 }}
                    onClick={() => {
                      setAiError(null)
                      setSourceType('custom')
                    }}
                  >
                    Switch to Custom goal
                  </button>
                </div>
              )}
              <input
                value={aiTopic}
                onChange={(e) => setAiTopic(e.target.value)}
                placeholder="Topic — e.g. Spanish for travel"
                disabled={aiLoading}
              />
              <textarea
                value={aiDescription}
                onChange={(e) => setAiDescription(e.target.value)}
                placeholder="Describe what you want to be able to do and any constraints…"
                disabled={aiLoading}
                rows={3}
                style={{ resize: 'vertical' }}
              />
              <div>
                <button className="btn" type="submit" disabled={aiLoading || (!aiTopic.trim() && !aiDescription.trim())}>
                  {aiLoading ? 'Generating…' : 'Generate'}
                </button>
              </div>
            </form>
          )}

          {sourceType === 'custom' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <p style={{ fontSize: 12.5, color: 'var(--mute)', margin: 0 }}>
                Add your own steps below, or let AI suggest a starting list you can edit.
              </p>
              {aiError && <div className="auth-notice auth-notice-error">{aiError}</div>}
              <form onSubmit={handleGenerateAI} style={{ display: 'flex', gap: 8 }}>
                <input
                  value={aiTopic}
                  onChange={(e) => setAiTopic(e.target.value)}
                  placeholder="Goal — e.g. Finish my thesis draft"
                  disabled={aiLoading}
                  style={{ flex: 1, padding: '9px 12px', fontSize: 13.5 }}
                />
                <button className="btn-secondary btn" type="submit" disabled={aiLoading || !aiTopic.trim()}>
                  {aiLoading ? 'Generating…' : 'Generate with AI'}
                </button>
              </form>
            </div>
          )}
        </div>
      </div>

      <div className="field" style={{ margin: 0 }}>
        <label htmlFor="plan-title">Plan title</label>
        <input id="plan-title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Name this plan" />
      </div>

      <div ref={stepsRef}>
        <div className="micro-label" style={{ marginBottom: 8 }}>
          Steps {steps.length > 0 && `(${includedSteps.length} of ${steps.length} included — ${formatDuration(requiredSeconds)} total)`}
        </div>
        {steps.length === 0 ? (
          <p style={{ fontSize: 13, color: 'var(--mute)' }}>Pick a source above to fill this in, or add steps manually below.</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 10 }}>
            {steps.map((step) => (
              <StepRow
                key={step.id}
                step={step}
                included={!excludedIds.has(step.id)}
                onToggleIncluded={() => toggleStepIncluded(step.id)}
                onTitleChange={(v) => updateStepTitle(step.id, v)}
                onDurationChange={(seconds) => updateStepDuration(step.id, seconds)}
                onRemove={() => removeStep(step.id)}
              />
            ))}
          </div>
        )}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          <input
            ref={newStepTitleRef}
            value={newStepTitle}
            onChange={(e) => setNewStepTitle(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault()
                addCustomStep()
              }
            }}
            placeholder="Add a step…"
            style={{ flex: '1 1 160px', minWidth: 0, padding: '8px 12px', borderRadius: 8, border: '1px solid var(--line)', fontSize: 13 }}
          />
          <input
            value={newStepDuration}
            onChange={(e) => setNewStepDuration(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault()
                addCustomStep()
              }
            }}
            placeholder="e.g. 1h 30m"
            style={{ flex: '0 1 120px', minWidth: 0, padding: '8px 12px', borderRadius: 8, border: '1px solid var(--line)', fontSize: 13 }}
          />
          <button type="button" className="btn-outline" onClick={addCustomStep} disabled={!newStepTitle.trim()}>
            Add
          </button>
        </div>
      </div>

      <div className="card" style={{ padding: '16px 18px' }}>
        <button
          type="button"
          onClick={() => setScheduleCollapsed((v) => !v)}
          style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'none', border: 'none', padding: 0, cursor: 'pointer', textAlign: 'left' }}
          aria-expanded={!scheduleCollapsed}
        >
          <span className="micro-label">3. Schedule</span>
          <motion.span animate={{ rotate: scheduleCollapsed ? 0 : 180 }} transition={{ duration: 0.2 }} style={{ color: 'var(--mute)', fontSize: 14 }}>
            ▾
          </motion.span>
        </button>
        <AnimatePresence initial={false}>
          {!scheduleCollapsed && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.25, ease: [0.2, 0.8, 0.2, 1] }}
              style={{ overflow: 'hidden' }}
            >
              <div style={{ marginTop: 16, display: 'flex', gap: 20, flexWrap: 'wrap', alignItems: 'flex-end' }}>
                <div className="field" style={{ margin: 0 }}>
                  <label htmlFor="plan-start-date">Start date</label>
                  <input id="plan-start-date" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} style={{ width: 170 }} />
                </div>
                <div className="field" style={{ margin: 0 }}>
                  <label htmlFor="plan-days">Days to finish in</label>
                  <input id="plan-days" value={days} onChange={(e) => setDays(e.target.value)} style={{ width: 90 }} />
                </div>
                <div className="field" style={{ margin: 0 }}>
                  <label htmlFor="plan-end-date">Finish by</label>
                  <input id="plan-end-date" type="date" value={endDate} onChange={(e) => handleEndDateChange(e.target.value)} style={{ width: 170 }} />
                </div>
                <div className="field" style={{ margin: 0 }}>
                  <label htmlFor="plan-hours-per-day">Hours per day</label>
                  <input id="plan-hours-per-day" value={hoursPerDay} onChange={(e) => setHoursPerDay(e.target.value)} style={{ width: 100 }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontWeight: 600, fontSize: 13.5, color: 'var(--mute)', marginBottom: 8 }}>Study days</label>
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
                          }}
                        >
                          {label}
                        </button>
                      )
                    })}
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div>
        <div className="micro-label" style={{ marginBottom: 8 }}>
          4. Reality check
        </div>
        {includedSteps.length === 0 ? (
          <p style={{ fontSize: 13, color: 'var(--mute)' }}>Add some steps above to see whether this plan fits.</p>
        ) : (
          <RealityCheckCard
            result={realityResult}
            onIncreaseHours={handleFixIncreaseHours}
            onExtendDays={handleFixExtendDays}
            onTrimScope={handleFixTrimScope}
          />
        )}
      </div>

      {schedule.items.length > 0 && (
        <div>
          <div className="micro-label" style={{ marginBottom: 8 }}>
            5. Day-by-day schedule
          </div>
          <div
            className="card"
            style={{ borderLeft: `3px solid ${categoryColor(data.habitCategories, categoryId)}`, display: 'flex', flexDirection: 'column', gap: 6 }}
          >
            {schedule.items.map((item) => (
              <div
                key={item.stepId}
                style={{
                  display: 'flex',
                  flexDirection: isPhone ? 'column' : 'row',
                  justifyContent: isPhone ? 'flex-start' : 'space-between',
                  alignItems: isPhone ? 'flex-start' : 'center',
                  gap: isPhone ? 4 : 12,
                  padding: '8px 4px',
                  borderBottom: '1px solid var(--line)',
                  fontSize: 13,
                }}
              >
                <span style={{ color: 'var(--cream)', minWidth: 0 }}>{item.title}</span>
                <span style={{ flexShrink: 0, display: 'flex', gap: 10, alignItems: 'center' }}>
                  <span style={{ color: 'var(--mute)', fontSize: 12 }}>
                    {item.startDate === item.endDate ? formatDateLabel(item.startDate) : `${formatDateLabel(item.startDate)} – ${formatDateLabel(item.endDate)}`}
                  </span>
                  <span className="outline-badge" style={{ fontSize: 11 }}>{formatDuration(item.seconds)}</span>
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div style={{ display: 'flex', gap: 10 }}>
        <button type="button" className="btn" disabled={!canSave} onClick={handleSave}>
          {editingPlan ? 'Update plan' : 'Save plan'}
        </button>
        {!editingPlan && (steps.length > 0 || title.trim()) && (
          <button type="button" className="btn-outline" style={{ color: 'var(--mute)' }} onClick={resetBuilder}>
            Start over
          </button>
        )}
      </div>
    </div>
  )
}

function StepRow({
  step,
  included,
  onToggleIncluded,
  onTitleChange,
  onDurationChange,
  onRemove,
}: {
  step: PlanStep
  included: boolean
  onToggleIncluded: () => void
  onTitleChange: (value: string) => void
  onDurationChange: (seconds: number) => void
  onRemove: () => void
}) {
  const [durationDraft, setDurationDraft] = useState(formatDuration(step.estimatedSeconds))

  function commitDuration() {
    const parsed = parseDuration(durationDraft)
    if (parsed !== null) onDurationChange(parsed)
    else setDurationDraft(formatDuration(step.estimatedSeconds))
  }

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        padding: '6px 4px',
        opacity: included ? 1 : 0.45,
      }}
    >
      <input type="checkbox" checked={included} onChange={onToggleIncluded} aria-label={`Include "${step.title}"`} />
      <input
        value={step.title}
        onChange={(e) => onTitleChange(e.target.value)}
        style={{ flex: 1, minWidth: 0, padding: '6px 8px', borderRadius: 6, border: '1px solid var(--line)', background: 'transparent', color: 'var(--cream)', fontSize: 13 }}
      />
      <input
        value={durationDraft}
        onChange={(e) => setDurationDraft(e.target.value)}
        onBlur={commitDuration}
        onKeyDown={(e) => e.key === 'Enter' && commitDuration()}
        style={{ width: 90, padding: '6px 8px', borderRadius: 6, border: '1px solid var(--line)', background: 'transparent', color: 'var(--cream)', fontSize: 13 }}
      />
      <button type="button" className="btn-outline" style={{ fontSize: 11, padding: '4px 8px' }} onClick={onRemove} aria-label={`Remove "${step.title}"`}>
        ✕
      </button>
    </div>
  )
}

export default PlanBuilder
