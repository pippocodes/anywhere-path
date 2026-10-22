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
// Partial's half-ring is a static CSS conic-gradient (masked into an
// annulus) rather than an animated SVG ring for the same cost reason —
// TriStateRing's per-cell SVG+motion approach is fine for a shared-item
// card with a handful of rows, not for this grid.
function HabitCell({ date, mark, onClick, today }: Props) {
  const [popping, setPopping] = useState(false)

  function activate() {
    onClick(date)
    setPopping(true)
  }

  return (
    <div
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
        width: 44,
        height: 44,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
        margin: '0 auto',
      }}
    >
      <div
        className={`habit-cell habit-tick${popping ? ' habit-cell-pop' : ''}`}
        onAnimationEnd={() => setPopping(false)}
        style={{
          width: 32,
          height: 32,
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: mark === 2 ? 'var(--gradient-primary)' : 'transparent',
          border: mark === 0 ? `1px solid ${today ? 'var(--gold)' : 'var(--line-strong)'}` : 'none',
          boxShadow: today && mark === 0 ? '0 0 0 2px color-mix(in srgb, var(--accent) 15%, transparent)' : 'none',
          fontSize: 11,
          color: 'var(--ink)',
          transition: 'background 0.15s ease, transform 0.1s ease, border-color 0.15s ease',
          ...(mark === 1
            ? {
                background: 'conic-gradient(var(--accent) 0deg 180deg, transparent 180deg 360deg)',
                WebkitMask: 'radial-gradient(circle, transparent 54%, black 56%)',
                mask: 'radial-gradient(circle, transparent 54%, black 56%)',
              }
            : null),
        }}
      >
        {mark === 2 && '✦'}
      </div>
    </div>
  )
}

export default memo(HabitCell)
