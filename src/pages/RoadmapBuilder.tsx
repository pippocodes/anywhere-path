import { useMemo, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useApp } from '../hooks/useApp'
import { calculateTotalHours, checkFeasibility, targetDateFromDays, type Feasibility } from '../utils/roadmap'
import type { RoadmapPlan } from '../types'

function RoadmapBuilder() {
  const { courseId: routeCourseId } = useParams()
  const navigate = useNavigate()
  const { data, setRoadmap, addHabit } = useApp()

  const [courseId, setCourseId] = useState(routeCourseId ?? data.courses[0]?.id ?? '')
  const [targetDays, setTargetDays] = useState('')
  const [dailyHours, setDailyHours] = useState('')
  const [feasibility, setFeasibility] = useState<Feasibility | null>(null)
  const [added, setAdded] = useState(false)

  const course = data.courses.find((c) => c.id === courseId)
  const totalHours = useMemo(() => (course ? calculateTotalHours(course) : 0), [course])
  const saved = courseId ? data.roadmaps[courseId] : undefined

  function handleCourseChange(id: string) {
    setCourseId(id)
    setFeasibility(null)
    setAdded(false)
    navigate(`/roadmap/${id}`, { replace: true })
  }

  function generate() {
    const days = Number(targetDays)
    const hours = Number(dailyHours)
    if (!course || !days || !hours || days <= 0 || hours <= 0) return
    setFeasibility(checkFeasibility(totalHours, days, hours))
    setAdded(false)
  }

  function commitPlan(plan: RoadmapPlan) {
    if (!course) return
    setRoadmap(course.id, plan)
    addHabit(`${course.name} — Daily Practice`, course.id)
    setAdded(true)
  }

  if (data.courses.length === 0) {
    return (
      <div className="page">
        <h1 className="page-title">Roadmap Builder</h1>
        <p className="page-subtitle">Add a course first, then come back here to plan it out.</p>
      </div>
    )
  }

  return (
    <div className="page" style={{ maxWidth: 640 }}>
      <h1 className="page-title">Roadmap Builder</h1>
      <p className="page-subtitle">Pick a course, tell us your timeline, and we'll turn it into a daily plan.</p>

      <div className="card">
        <div className="field">
          <label>Course</label>
          <select value={courseId} onChange={(e) => handleCourseChange(e.target.value)}>
            {data.courses.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        <p style={{ fontSize: 13.5, color: 'var(--mute)', marginTop: -8, marginBottom: 20 }}>
          This course needs about <strong>{totalHours}h</strong> total, based on its topics.
        </p>

        <div style={{ display: 'flex', gap: 16 }}>
          <div className="field" style={{ flex: 1 }}>
            <label>Days Until Target Date</label>
            <input value={targetDays} onChange={(e) => setTargetDays(e.target.value)} placeholder="e.g. 14" />
          </div>
          <div className="field" style={{ flex: 1 }}>
            <label>Hours You Can Give Per Day</label>
            <input value={dailyHours} onChange={(e) => setDailyHours(e.target.value)} placeholder="e.g. 2" />
          </div>
        </div>

        <button className="btn" style={{ width: '100%', padding: 14 }} onClick={generate}>
          Generate Roadmap
        </button>
      </div>

      {feasibility && feasibility.feasible && (
        <div className="card" style={{ marginTop: 24, borderLeft: '4px solid var(--pink)' }}>
          <h3 style={{ fontSize: 18, marginBottom: 10 }}>Your Plan</h3>
          <p style={{ fontSize: 15, color: 'var(--plum)', marginBottom: 6 }}>
            Target date: <strong>{targetDateFromDays(Number(targetDays))}</strong>
          </p>
          <div style={{ fontSize: 28, fontWeight: 800, color: 'var(--mute)', fontFamily: "'Poppins', sans-serif", margin: '10px 0' }}>
            {Number(dailyHours)} hrs/day
          </div>
          <button
            className="btn btn-danger"
            disabled={added}
            onClick={() =>
              commitPlan({
                courseId,
                targetDays: Number(targetDays),
                dailyHours: Number(dailyHours),
                totalHours,
                option: 'direct',
              })
            }
          >
            {added ? 'Added ✓' : 'Add to Habit Tracker'}
          </button>
        </div>
      )}

      {feasibility && !feasibility.feasible && (
        <div style={{ marginTop: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ fontWeight: 600, fontSize: 14, color: 'var(--plum)' }}>
            That pace is intense — here are two options:
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div className="card" style={{ padding: 22, borderLeft: '4px solid var(--plum)' }}>
              <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--plum)', marginBottom: 10 }}>
                Option A · Stay on Deadline
              </div>
              <div style={{ fontSize: 13, color: 'var(--mute)', marginBottom: 6 }}>
                Target date: {targetDateFromDays(Number(targetDays))}
              </div>
              <div style={{ fontSize: 24, fontWeight: 800, color: 'var(--plum)', fontFamily: "'Poppins', sans-serif", marginBottom: 14 }}>
                {feasibility.requiredDailyHours} hrs/day
              </div>
              <button
                className="btn btn-danger"
                style={{ width: '100%' }}
                disabled={added}
                onClick={() =>
                  commitPlan({
                    courseId,
                    targetDays: Number(targetDays),
                    dailyHours: feasibility.requiredDailyHours,
                    totalHours,
                    option: 'A',
                  })
                }
              >
                {added ? 'Added ✓' : 'Choose This'}
              </button>
            </div>
            <div className="card" style={{ padding: 22, borderLeft: '4px solid var(--pink)' }}>
              <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--cherry)', marginBottom: 10 }}>
                Option B · Extend Timeline
              </div>
              <div style={{ fontSize: 13, color: 'var(--mute)', marginBottom: 6 }}>
                New target date: {targetDateFromDays(feasibility.requiredDays)} ({feasibility.requiredDays} days)
              </div>
              <div style={{ fontSize: 24, fontWeight: 800, color: 'var(--cherry)', fontFamily: "'Poppins', sans-serif", marginBottom: 14 }}>
                {Number(dailyHours)} hrs/day
              </div>
              <button
                className="btn"
                style={{ width: '100%' }}
                disabled={added}
                onClick={() =>
                  commitPlan({
                    courseId,
                    targetDays: feasibility.requiredDays,
                    dailyHours: Number(dailyHours),
                    totalHours,
                    option: 'B',
                  })
                }
              >
                {added ? 'Added ✓' : 'Choose This'}
              </button>
            </div>
          </div>
        </div>
      )}

      {!feasibility && saved && (
        <p style={{ marginTop: 20, fontSize: 13.5, color: 'var(--mute)' }}>
          Current plan: {saved.targetDays} days at {saved.dailyHours}h/day.
        </p>
      )}
    </div>
  )
}

export default RoadmapBuilder
