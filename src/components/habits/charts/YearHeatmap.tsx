import { useState } from 'react'
import { motion } from 'framer-motion'
import type { HeatmapDay } from '../../../utils/habitStats'
import { parseDateStr } from '../../../utils/habits'

const MONTH_LABELS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
const CELL = 12
const GAP = 3

function intensityColor(count: number, maxCount: number): string {
  if (maxCount === 0 || count === 0) return 'var(--surface)'
  const t = Math.min(count / maxCount, 1)
  // gold -> rose ramp by interpolating between the two accent colors' rgb
  const gold = [233, 197, 143]
  const rose = [232, 121, 155]
  const rgb = gold.map((g, i) => Math.round(g + (rose[i] - g) * t))
  return `rgba(${rgb[0]}, ${rgb[1]}, ${rgb[2]}, ${0.25 + t * 0.75})`
}

/** GitHub-style contribution heatmap for the whole year — one column per week, gold->rose intensity by day. */
function YearHeatmap({ days, year }: { days: HeatmapDay[]; year: number }) {
  const [hovered, setHovered] = useState<HeatmapDay | null>(null)

  // Lay out into weeks (columns), Sunday-first, padding the first week so
  // Jan 1 lands in its correct weekday row.
  const firstWeekday = new Date(year, 0, 1).getDay()
  const cells: (HeatmapDay | null)[] = [...Array(firstWeekday).fill(null), ...days]
  const weeks: (HeatmapDay | null)[][] = []
  for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7))

  // Which week-column each month label should sit above.
  const monthLabelPositions: { label: string; week: number }[] = []
  let lastMonth = -1
  weeks.forEach((week, w) => {
    const firstDay = week.find((d) => d !== null)
    if (!firstDay) return
    const m = parseDateStr(firstDay.date).getMonth()
    if (m !== lastMonth) {
      monthLabelPositions.push({ label: MONTH_LABELS[m], week: w })
      lastMonth = m
    }
  })

  const width = weeks.length * (CELL + GAP)

  return (
    <div style={{ position: 'relative' }}>
      <div className="micro-label" style={{ marginBottom: 12 }}>
        {year} Activity
      </div>
      <div style={{ overflowX: 'auto', paddingBottom: 4 }}>
        <div style={{ minWidth: width, position: 'relative', height: 14, marginBottom: 4 }}>
          {monthLabelPositions.map(({ label, week }) => (
            <span
              key={week + label}
              style={{
                position: 'absolute',
                left: week * (CELL + GAP),
                fontSize: 10,
                color: 'var(--mute)',
              }}
            >
              {label}
            </span>
          ))}
        </div>
        <div style={{ display: 'flex', gap: GAP, minWidth: width }}>
          {weeks.map((week, w) => (
            <div key={w} style={{ display: 'flex', flexDirection: 'column', gap: GAP }}>
              {week.map((day, d) =>
                day ? (
                  <motion.div
                    key={d}
                    initial={{ opacity: 0, scale: 0.5 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.3, delay: Math.min(w * 0.004, 1) }}
                    onMouseEnter={() => setHovered(day)}
                    onMouseLeave={() => setHovered((h) => (h === day ? null : h))}
                    style={{
                      width: CELL,
                      height: CELL,
                      borderRadius: 3,
                      background: intensityColor(day.count, day.maxCount),
                      cursor: 'default',
                    }}
                  />
                ) : (
                  <div key={d} style={{ width: CELL, height: CELL }} />
                )
              )}
            </div>
          ))}
        </div>
      </div>
      {hovered && (
        <div
          style={{
            marginTop: 10,
            display: 'inline-block',
            background: 'var(--ink-2)',
            border: '1px solid var(--line)',
            borderRadius: 8,
            padding: '6px 12px',
            fontSize: 12,
            color: 'var(--cream)',
          }}
        >
          <strong>{hovered.count}</strong> tick{hovered.count === 1 ? '' : 's'} on{' '}
          {parseDateStr(hovered.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
        </div>
      )}
    </div>
  )
}

export default YearHeatmap
