import { useMemo } from 'react'
import { last7DayTrail, bestCurrentStreak } from '../../utils/habits'
import { formatDateLabel } from '../../utils/scheduler'
import LogoStarIcon from '../ui/LogoStarIcon'
import type { Habit } from '../../types'

interface Props {
  habits: Habit[]
}

const STONE_SIZE = 14

/** The last 7 days as a horizontal path: solid stone = done, lighter stone = partial, a gap = missed (never red) — ending today, marked with the brand star instead of a stone. */
function TrailHero({ habits }: Props) {
  const active = useMemo(() => habits.filter((h) => !h.archived), [habits])
  const trail = useMemo(() => last7DayTrail(active), [active])
  const streak = useMemo(() => bestCurrentStreak(active), [active])

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 20, flexWrap: 'wrap' }}>
      <div style={{ position: 'relative', flex: '1 1 260px', minWidth: 220, height: 28, display: 'flex', alignItems: 'center' }}>
        <div style={{ position: 'absolute', left: 7, right: 14, top: '50%', height: 1, background: 'var(--line)', transform: 'translateY(-50%)' }} />
        <div role="group" aria-label="Last 7 days" style={{ position: 'relative', display: 'flex', justifyContent: 'space-between', width: '100%' }}>
          {trail.map((day, i) => {
            const isToday = i === trail.length - 1
            if (isToday) {
              return (
                <span
                  key={day.date}
                  role="img"
                  aria-label={`Today, ${day.status}`}
                  title="Today"
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: STONE_SIZE + 8, height: STONE_SIZE + 8, flexShrink: 0 }}
                >
                  <LogoStarIcon size={STONE_SIZE + 8} />
                </span>
              )
            }
            return (
              <span
                key={day.date}
                role="img"
                aria-label={`${formatDateLabel(day.date)}: ${day.status}`}
                title={day.status}
                style={{
                  width: STONE_SIZE,
                  height: STONE_SIZE,
                  borderRadius: '50%',
                  flexShrink: 0,
                  background: day.status === 'done' ? 'var(--text)' : day.status === 'partial' ? 'color-mix(in srgb, var(--text) 40%, transparent)' : 'transparent',
                  border: day.status === 'missed' ? '1.5px dashed var(--line-strong)' : 'none',
                }}
              />
            )
          })}
        </div>
      </div>
      {streak > 0 && (
        <div style={{ textAlign: 'right', flexShrink: 0 }}>
          <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--cream)', lineHeight: 1 }}>{streak}</div>
          <div style={{ fontSize: 11, color: 'var(--mute)' }}>day streak</div>
        </div>
      )}
    </div>
  )
}

export default TrailHero
