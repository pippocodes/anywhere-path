import { useMemo } from 'react'
import { cycleMarkDoneFirst } from '../../utils/habits'
import TriDot from './TriDot'
import type { Habit } from '../../types'

interface Props {
  habits: Habit[]
  today: string
  onMark: (habitId: string, next: 0 | 1 | 2) => void
}

/** Today's habits as a quiet list — tap cycles done -> partial -> none, the reverse of the rest of the app, since the first tap here is almost always "yes, I did it." */
function TodayHabitsList({ habits, today, onMark }: Props) {
  const active = useMemo(() => habits.filter((h) => !h.archived), [habits])
  const doneCount = active.filter((h) => (h.marks[today] ?? 0) === 2).length

  if (active.length === 0) return null

  return (
    <div>
      <div className="micro-label" style={{ color: 'var(--mute)', marginBottom: 12 }}>
        Habits — {doneCount} of {active.length} today
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        {active.map((h) => {
          const mark = h.marks[today] ?? 0
          return (
            <div key={h.id} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '9px 2px' }}>
              <TriDot mark={mark} onClick={() => onMark(h.id, cycleMarkDoneFirst(mark))} />
              <span style={{ fontSize: 14, color: mark === 2 ? 'var(--mute)' : 'var(--cream)', flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {h.name}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default TodayHabitsList
