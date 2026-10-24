import { useState } from 'react'
import type { HabitMark } from '../../types'
import HabitCell from '../HabitCell'

// Sample data only — not a real habit. Uses the real HabitCell component
// (the same tap-to-cycle tri-state cell the Habit Tracker grid is built
// from), so this preview is genuinely interactive and theme-aware.
const SAMPLE_MARKS: HabitMark[] = [2, 2, 1, 2, 0, 2, 2, 1, 2, 2, 0, 2]

/** Home's Habit Tracker preview — a row of real HabitCells, click any day to cycle it. */
function HabitTrackerPreview() {
  const [marks, setMarks] = useState<HabitMark[]>(SAMPLE_MARKS)

  function cycle(index: number) {
    setMarks((prev) => prev.map((m, i) => (i === index ? (((m + 1) % 3) as HabitMark) : m)))
  }

  return (
    <div>
      <div style={{ fontSize: 13.5, fontWeight: 600, marginBottom: 10 }}>Morning run</div>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        {marks.map((mark, i) => (
          <HabitCell key={i} date={`preview-${i}`} mark={mark} onClick={() => cycle(i)} today={i === marks.length - 1} />
        ))}
      </div>
    </div>
  )
}

export default HabitTrackerPreview
