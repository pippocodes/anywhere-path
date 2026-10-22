import { memo, useState } from 'react'
import type { HabitMark } from '../types'

interface Props {
  date: string
  mark: HabitMark
  onClick: (date: string) => void
  today?: boolean
}

const MARK_LABEL: Record<HabitMark, string> = { 0: 'not done', 1: 'partial', 2: 'done' }

// A month grid can have 30+ cells per habit row, so this is memoized —
// clicking one cell shouldn't re-render every other day in the row. The
// pop-on-tick uses a plain CSS keyframe (not framer-motion) for the same
// reason: a grid can have hundreds of these, and a per-cell motion
// component would add real overhead at that scale for one small flourish.
function HabitCell({ date, mark, onClick, today }: Props) {
  const [popping, setPopping] = useState(false)

  function activate() {
    onClick(date)
    setPopping(true)
  }

  return (
    <div
      className={`habit-cell habit-tick${popping ? ' habit-cell-pop' : ''}`}
      onAnimationEnd={() => setPopping(false)}
      onClick={activate}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          activate()
        }
      }}
      role="button"
      tabIndex={0}
      title={date}
      aria-label={`${date}: ${MARK_LABEL[mark]}`}
      style={{
        width: 22,
        height: 22,
        borderRadius: '50%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: mark === 2 ? 'var(--gradient-primary)' : mark === 1 ? 'color-mix(in srgb, var(--accent) 25%, transparent)' : 'transparent',
        border: mark === 0 ? `1px solid ${today ? 'var(--gold)' : 'var(--line-strong)'}` : 'none',
        boxShadow: today && mark === 0 ? '0 0 0 2px color-mix(in srgb, var(--accent) 15%, transparent)' : 'none',
        cursor: 'pointer',
        margin: '0 auto',
        fontSize: 10,
        color: 'var(--ink)',
        transition: 'background 0.15s ease, transform 0.1s ease, border-color 0.15s ease',
      }}
    >
      {mark === 2 && '✦'}
    </div>
  )
}

export default memo(HabitCell)
