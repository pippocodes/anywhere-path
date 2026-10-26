import ChartEmptyState from './ChartEmptyState'

interface Props {
  data: { name: string; percent: number; color: string }[]
}

/**
 * One row per habit, showing this month's completion — plain HTML, not a
 * chart library. Recharts' bars filled the whole card and triggered a
 * stuck hover tooltip with only a couple of habits; a fixed-height row list
 * has no such failure mode and its height naturally follows the habit
 * count instead of stretching to fill a fixed chart area.
 */
function PerHabitBarChart({ data }: Props) {
  const hasData = data.length > 0

  return (
    <div>
      <div className="micro-label" style={{ marginBottom: 12 }}>
        Per-Habit Completion
      </div>
      {!hasData ? (
        <ChartEmptyState height={280} message="Add a habit to see how each one's doing" />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {data.map((d) => (
            <div key={d.name} style={{ display: 'flex', alignItems: 'center', gap: 12, height: 44 }}>
              <div
                style={{
                  flex: '0 1 40%',
                  minWidth: 0,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  fontSize: 13,
                  color: 'var(--cream)',
                }}
              >
                {d.name}
              </div>
              <div style={{ flex: 1, minWidth: 0, height: 8, borderRadius: 4, background: 'var(--line)', overflow: 'hidden' }}>
                <div style={{ width: `${d.percent}%`, height: '100%', borderRadius: 4, background: d.color }} />
              </div>
              <div
                style={{
                  width: 38,
                  flexShrink: 0,
                  textAlign: 'right',
                  fontSize: 12,
                  color: 'var(--mute)',
                  fontVariantNumeric: 'tabular-nums',
                }}
              >
                {d.percent}%
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default PerHabitBarChart
