import { useState } from 'react'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import type { Habit } from '../../types'
import { computeCurrentStreak } from '../../utils/habits'
import HabitCell from '../HabitCell'

interface Props {
  habit: Habit
  dates: string[]
  referenceDate: Date
  onCycle: (habitId: string, date: string) => void
  onRename: (habitId: string, name: string) => void
  onArchive: (habitId: string) => void
}

function HabitGridRow({ habit, dates, referenceDate, onCycle, onRename, onArchive }: Props) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(habit.name)
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: habit.id })
  const streak = computeCurrentStreak(habit, referenceDate)

  function commit() {
    const trimmed = draft.trim()
    setEditing(false)
    if (trimmed && trimmed !== habit.name) onRename(habit.id, trimmed)
    else setDraft(habit.name)
  }

  return (
    <tr
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.6 : 1 }}
    >
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
        <span
          {...attributes}
          {...listeners}
          title="Drag to reorder"
          style={{ cursor: 'grab', color: 'var(--pink-pale)', marginRight: 6, touchAction: 'none' }}
        >
          ⠿
        </span>
        {editing ? (
          <input
            autoFocus
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onBlur={commit}
            onKeyDown={(e) => {
              if (e.key === 'Enter') commit()
              if (e.key === 'Escape') {
                setDraft(habit.name)
                setEditing(false)
              }
            }}
            style={{ fontSize: 13, padding: '2px 6px', borderRadius: 6, border: '1px solid var(--pink)', width: 110 }}
          />
        ) : (
          <span onClick={() => setEditing(true)} style={{ cursor: 'text' }}>
            {habit.name}
          </span>
        )}
        {streak > 0 && (
          <span style={{ marginLeft: 6, fontSize: 11.5, color: 'var(--cherry)', fontWeight: 700 }}>🔥{streak}</span>
        )}
        <button
          onClick={() => onArchive(habit.id)}
          className="btn-outline"
          style={{ marginLeft: 8, color: 'var(--plum)', fontSize: 11, opacity: 0.7 }}
          aria-label={`Archive ${habit.name}`}
          title="Archive habit"
        >
          ⤵
        </button>
      </td>
      {dates.map((date) => (
        <td key={date} style={{ padding: 2 }}>
          <HabitCell date={date} mark={habit.marks[date] ?? 0} onClick={(d) => onCycle(habit.id, d)} />
        </td>
      ))}
    </tr>
  )
}

export default HabitGridRow
