import { memo, useState } from 'react'
import type { HabitMark } from '../types'

interface Props {
  date: string
  mark: HabitMark
  onClick: (date: string) => void
}

const COLORS: Record<HabitMark, string> = {
  0: 'var(--bg)',
  1: 'var(--pink-light)',
  2: 'var(--rose)',
}

const MARK_LABEL: Record<HabitMark, string> = { 0: 'not done', 1: 'partial', 2: 'done' }

// A month grid can have 30+ cells per habit row, so this is memoized —
// clicking one cell shouldn't re-render every other day in the row. The
// pop-on-tick uses a plain CSS keyframe (not framer-motion) for the same
// reason: a grid can have hundreds of these, and a per-cell motion
// component would add real overhead at that scale for one small flourish.
function HabitCell({ date, mark, onClick }: Props) {
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
        width: 20,
        height: 20,
        borderRadius: 5,
        background: COLORS[mark],
        border: '1px solid var(--pink-pale)',
        cursor: 'pointer',
        margin: '0 auto',
        transition: 'background 0.15s ease, transform 0.1s ease',
      }}
    />
  )
}

export default memo(HabitCell)
