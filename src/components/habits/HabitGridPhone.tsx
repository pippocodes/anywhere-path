import { useEffect, useRef } from 'react'
import { SortableContext, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import type { Course, Habit, Plan } from '../../types'
import { computeCurrentStreak, toDateStr } from '../../utils/habits'
import HabitCell from '../HabitCell'

const HEADER_H = 32
const ROW_H = 56
const DAY_W = 44

interface Props {
  habits: Habit[]
  dates: string[]
  dayNumbers: number[]
  referenceDate: Date
  onCycle: (habitId: string, date: string) => void
  onShare?: (habitId: string) => void
}

/**
 * Phone-only (<768px) replacement for the desktop table's sticky name
 * column: position:sticky inside a shared horizontal scroll container was
 * visually unreliable on Android Chrome (day circles painting over the
 * translucent sticky cell during scroll). Two real sibling elements — a
 * non-scrolling name column and its own independent overflow-x:auto day
 * column — can't be drawn over each other since neither one scrolls behind
 * the other. Desktop/iPad keep the original table (see CategorySection).
 */
function HabitGridPhone({ habits, dates, dayNumbers, referenceDate, onCycle, onShare }: Props) {
  const scrollRef = useRef<HTMLDivElement | null>(null)
  const todayStr = toDateStr(referenceDate)

  useEffect(() => {
    const el = scrollRef.current
    const idx = dates.indexOf(todayStr)
    if (!el || idx < 0) return
    el.scrollLeft = Math.max(0, idx * DAY_W - el.clientWidth / 2 + DAY_W / 2)
  }, [dates, todayStr])

  return (
    <div style={{ display: 'flex' }}>
      <div style={{ flex: '0 0 clamp(110px, 38%, 150px)', minWidth: 0 }}>
        <div style={{ height: HEADER_H, display: 'flex', alignItems: 'center', fontSize: 12.5, color: 'var(--mute)', fontWeight: 600 }}>
          Habit
        </div>
        <SortableContext items={habits.map((h) => h.id)} strategy={verticalListSortingStrategy}>
          {habits.map((habit) => (
            <HabitNameRow key={habit.id} habit={habit} referenceDate={referenceDate} onShare={onShare} />
          ))}
        </SortableContext>
      </div>

      <div
        ref={scrollRef}
        className="habit-grid-days-scroll"
        style={{
          flex: 1,
          minWidth: 0,
          overflowX: 'auto',
          overflowY: 'hidden',
          maskImage: 'linear-gradient(to right, transparent, black 14px)',
          WebkitMaskImage: 'linear-gradient(to right, transparent, black 14px)',
        }}
      >
        <div style={{ display: 'flex', height: HEADER_H }}>
          {dayNumbers.map((d, i) => (
            <div
              key={d}
              style={{
                width: DAY_W,
                flexShrink: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 10.5,
                fontWeight: 600,
                color: dates[i] === todayStr ? 'var(--gold)' : 'var(--mute)',
              }}
            >
              {d}
            </div>
          ))}
        </div>
        {habits.map((habit) => (
          <div key={habit.id} style={{ display: 'flex', height: ROW_H }}>
            {dates.map((date) => (
              <div
                key={date}
                style={{
                  width: DAY_W,
                  flexShrink: 0,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: date === todayStr ? 'color-mix(in srgb, var(--accent) 6%, transparent)' : 'transparent',
                }}
              >
                <HabitCell date={date} mark={habit.marks[date] ?? 0} onClick={(d) => onCycle(habit.id, d)} today={date === todayStr} />
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}

interface NameRowProps {
  habit: Habit
  referenceDate: Date
  onShare?: (habitId: string) => void
}

// Only the name row is a sortable node (drag handle lives here) — the day
// row for the same habit is a plain, unanimated sibling in the other
// column that simply re-renders in the new order once a drop completes.
function HabitNameRow({ habit, referenceDate, onShare }: NameRowProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: habit.id })
  const streak = computeCurrentStreak(habit, referenceDate)

  return (
    <div
      ref={setNodeRef}
      style={{
        height: ROW_H,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        gap: 2,
        minWidth: 0,
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.6 : 1,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 0 }}>
        <span
          {...attributes}
          {...listeners}
          title="Drag to reorder"
          style={{ cursor: 'grab', color: 'var(--line)', touchAction: 'none', flexShrink: 0 }}
        >
          ⠿
        </span>
        <span
          style={{
            fontSize: 13,
            fontWeight: 600,
            color: 'var(--cream)',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            minWidth: 0,
          }}
        >
          {habit.name}
        </span>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 10.5, paddingLeft: 18 }}>
        {streak > 0 && <span style={{ color: 'var(--gold)', fontWeight: 700 }}>{streak}d</span>}
        {onShare && (
          <button
            type="button"
            onClick={() => onShare(habit.id)}
            title={`Share "${habit.name}" with a friend`}
            aria-label={`Share "${habit.name}" with a friend`}
            style={{ display: 'inline-flex', background: 'none', border: 'none', padding: 0, cursor: 'pointer', color: 'var(--mute)', opacity: 0.8 }}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="18" cy="5" r="3" />
              <circle cx="6" cy="12" r="3" />
              <circle cx="18" cy="19" r="3" />
              <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
              <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
            </svg>
          </button>
        )}
      </div>
    </div>
  )
}

export default HabitGridPhone
