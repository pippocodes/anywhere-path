import { useState } from 'react'
import AnimatedCheckbox from '../motion/AnimatedCheckbox'

// Sample data only — not a real roadmap. Uses the same AnimatedCheckbox
// the Course Tracker's own topic rows use, so this preview is genuinely
// interactive and theme-aware, not a screenshot.
const SAMPLE_STEPS = [
  { id: 's1', label: 'Arrays', duration: '5h', done: true },
  { id: 's2', label: 'Linked Lists', duration: '6h', done: true },
  { id: 's3', label: 'Sorting', duration: '5h', done: false },
  { id: 's4', label: 'Dynamic Programming', duration: '8h', done: false },
]

/** Home's Roadmap Builder preview — a small checklist of a scheduled outline's steps, click to try it. */
function RoadmapBuilderPreview() {
  const [doneIds, setDoneIds] = useState(() => new Set(SAMPLE_STEPS.filter((s) => s.done).map((s) => s.id)))

  function toggle(id: string) {
    setDoneIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  return (
    <div>
      <div style={{ fontSize: 12.5, color: 'var(--mute)', marginBottom: 12 }}>Data Structures &amp; Algorithms · 8 weeks</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {SAMPLE_STEPS.map((s) => {
          const done = doneIds.has(s.id)
          return (
            <div key={s.id} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <AnimatedCheckbox checked={done} onChange={() => toggle(s.id)} ariaLabel={`Mark "${s.label}" ${done ? 'not done' : 'done'}`} />
              <span style={{ flex: 1, fontSize: 13.5, color: done ? 'var(--mute)' : 'var(--cream)', textDecoration: done ? 'line-through' : 'none' }}>
                {s.label}
              </span>
              <span className="outline-badge" style={{ fontSize: 11 }}>
                {s.duration}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default RoadmapBuilderPreview
