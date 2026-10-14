import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import type { Habit } from '../../types'
import { computeCurrentStreak, toDateStr } from '../../utils/habits'
import HabitCell from '../HabitCell'

interface Props {
  habit: Habit
  dates: string[]
  referenceDate: Date
  onCycle: (habitId: string, date: string) => void
}

function HabitGridRow({ habit, dates, referenceDate, onCycle }: Props) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: habit.id })
  const streak = computeCurrentStreak(habit, referenceDate)
  const todayStr = toDateStr(referenceDate)

  return (
    <tr
      ref={setNodeRef}
      className="habit-grid-row"
      style={{ transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.6 : 1 }}
    >
      <td
        style={{
          padding: '8px 12px',
          fontSize: 13,
          fontWeight: 600,
          color: 'var(--cream)',
          whiteSpace: 'nowrap',
          position: 'sticky',
          left: 0,
          background: 'var(--ink-2)',
        }}
      >
        <span
          {...attributes}
          {...listeners}
          title="Drag to reorder"
          style={{ cursor: 'grab', color: 'var(--line)', marginRight: 6, touchAction: 'none' }}
        >
          ⠿
        </span>
        {habit.name}
        {streak > 0 && (
          <span style={{ marginLeft: 8, fontSize: 11, color: 'var(--gold)', fontWeight: 700 }}>{streak}d</span>
        )}
      </td>
      {dates.map((date) => (
        <td
          key={date}
          style={{ padding: 2, background: date === todayStr ? 'rgba(233,197,143,0.06)' : 'transparent' }}
        >
          <HabitCell date={date} mark={habit.marks[date] ?? 0} onClick={(d) => onCycle(habit.id, d)} today={date === todayStr} />
        </td>
      ))}
    </tr>
  )
}

export default HabitGridRow
