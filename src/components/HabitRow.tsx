import { useCallback } from 'react'
import type { Habit } from '../types'
import HabitCell from './HabitCell'

interface Props {
  habit: Habit
  dates: string[]
  onCycle: (habitId: string, date: string) => void
  onDelete: (habitId: string) => void
}

function HabitRow({ habit, dates, onCycle, onDelete }: Props) {
  const handleCellClick = useCallback((date: string) => onCycle(habit.id, date), [habit.id, onCycle])

  return (
    <tr>
      <td
        style={{
          padding: '8px 12px',
          fontSize: 13,
          fontWeight: 600,
          color: 'var(--ink)',
          whiteSpace: 'nowrap',
          position: 'sticky',
          left: 0,
          background: 'var(--card-bg)',
        }}
      >
        {habit.name}
        <button
          onClick={() => onDelete(habit.id)}
          className="btn-outline"
          style={{ marginLeft: 8, color: 'var(--plum)', fontSize: 11 }}
        >
          ✕
        </button>
      </td>
      {dates.map((date) => (
        <td key={date} style={{ padding: 2 }}>
          <HabitCell date={date} mark={habit.marks[date] ?? 0} onClick={handleCellClick} />
        </td>
      ))}
    </tr>
  )
}

export default HabitRow
