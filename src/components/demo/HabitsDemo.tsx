const DAYS = Array.from({ length: 20 }, (_, i) => i + 1)

const HABITS = [
  { name: 'Morning Run', marks: [1, 0, 1, 1, 0, 1, 0, 0, 1, 1, 0, 1, 1, 0, 1, 0, 0, 1, 1, 0] },
  { name: 'Read 20 minutes', marks: [2, 2, 2, 1, 2, 2, 2, 2, 1, 2, 2, 2, 2, 1, 2, 2, 2, 2, 1, 2] },
]

const MARK_COLOR: Record<number, string> = { 0: 'var(--ink-2)', 1: 'var(--gold)', 2: 'var(--rose)' }

/** Static, non-interactive stand-in for the habit tracker, shown (blurred) to signed-out visitors via DemoGate. */
function HabitsDemo() {
  return (
    <>
      <h1 className="page-title">Habit Tracker</h1>
      <p className="page-subtitle">Mark each day done, partial, or skipped — and watch the streaks build.</p>
      <div className="card" style={{ overflowX: 'auto' }}>
        <table style={{ borderCollapse: 'collapse', width: '100%' }}>
          <thead>
            <tr>
              <th style={{ textAlign: 'left', padding: '4px 10px 10px 0', fontSize: 12.5, color: 'var(--mute)' }}>Habit</th>
              {DAYS.map((d) => (
                <th key={d} style={{ padding: '4px 3px', fontSize: 10.5, color: 'var(--mute)', minWidth: 20 }}>
                  {d}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {HABITS.map((h) => (
              <tr key={h.name}>
                <td style={{ padding: '6px 10px 6px 0', fontSize: 13, fontWeight: 600, whiteSpace: 'nowrap' }}>{h.name}</td>
                {h.marks.map((m, i) => (
                  <td key={i} style={{ padding: 2 }}>
                    <div style={{ width: 18, height: 18, borderRadius: 5, background: MARK_COLOR[m], margin: '0 auto' }} />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  )
}

export default HabitsDemo
