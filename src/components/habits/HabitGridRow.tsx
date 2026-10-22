import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { useNavigate } from 'react-router-dom'
import type { Course, Habit, Plan } from '../../types'
import { computeCurrentStreak, toDateStr } from '../../utils/habits'
import { computeCourseStats } from '../../utils/courseStats'
import { computePlanProgress } from '../../utils/planProgress'
import { formatDuration } from '../../utils/duration'
import HabitCell from '../HabitCell'
import ProgressRing from './ProgressRing'

interface Props {
  habit: Habit
  courses: Course[]
  plans: Plan[]
  dates: string[]
  referenceDate: Date
  onCycle: (habitId: string, date: string) => void
  onShare?: (habitId: string) => void
}

function HabitGridRow({ habit, courses, plans, dates, referenceDate, onCycle, onShare }: Props) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: habit.id })
  const navigate = useNavigate()
  const streak = computeCurrentStreak(habit, referenceDate)
  const todayStr = toDateStr(referenceDate)

  const linkedCourse = habit.courseId ? courses.find((c) => c.id === habit.courseId) : null
  const linkedPlan = habit.planId ? plans.find((p) => p.id === habit.planId) : null

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
        {habit.targetSeconds && (
          <span style={{ marginLeft: 8, fontSize: 10.5, color: 'var(--mute)' }}>~{formatDuration(habit.targetSeconds)}/day</span>
        )}
        {linkedCourse && (
          <button
            type="button"
            onClick={() => navigate(`/courses/${linkedCourse.id}`)}
            title={`Open "${linkedCourse.name}"`}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 4, marginLeft: 8, background: 'none', border: 'none', padding: 0, cursor: 'pointer', verticalAlign: 'middle' }}
          >
            <ProgressRing percent={computeCourseStats(linkedCourse).percent} size={16} />
            <span style={{ fontSize: 10.5, color: 'var(--mute)', maxWidth: 90, overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {linkedCourse.name}
            </span>
          </button>
        )}
        {linkedPlan && (
          <button
            type="button"
            onClick={() => navigate(`/roadmap?editPlan=${linkedPlan.id}`)}
            title={`Open "${linkedPlan.title}"`}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 4, marginLeft: 8, background: 'none', border: 'none', padding: 0, cursor: 'pointer', verticalAlign: 'middle' }}
          >
            <ProgressRing percent={computePlanProgress(linkedPlan)} size={16} />
            <span style={{ fontSize: 10.5, color: 'var(--mute)', maxWidth: 90, overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {linkedPlan.title}
            </span>
          </button>
        )}
        {onShare && (
          <button
            type="button"
            onClick={() => onShare(habit.id)}
            title={`Share "${habit.name}" with a friend`}
            aria-label={`Share "${habit.name}" with a friend`}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 20,
              height: 20,
              marginLeft: 8,
              background: 'none',
              border: 'none',
              padding: 0,
              cursor: 'pointer',
              verticalAlign: 'middle',
              color: 'var(--mute)',
              opacity: 0.7,
            }}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="18" cy="5" r="3" />
              <circle cx="6" cy="12" r="3" />
              <circle cx="18" cy="19" r="3" />
              <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
              <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
            </svg>
          </button>
        )}
      </td>
      {dates.map((date) => (
        <td
          key={date}
          style={{ padding: 2, background: date === todayStr ? 'color-mix(in srgb, var(--accent) 6%, transparent)' : 'transparent' }}
        >
          <HabitCell date={date} mark={habit.marks[date] ?? 0} onClick={(d) => onCycle(habit.id, d)} today={date === todayStr} />
        </td>
      ))}
    </tr>
  )
}

export default HabitGridRow
