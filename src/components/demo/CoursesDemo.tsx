const SAMPLE_LECTURES = [
  { name: 'Intro to Arrays', duration: '5:22', done: true },
  { name: 'Linked Lists', duration: '12:07', done: true },
  { name: 'Stacks & Queues', duration: '9:40', done: false },
  { name: 'Trees', duration: '1:03:45', done: false },
]

/** Static, non-interactive stand-in for the Course Tracker, shown (blurred) to signed-out visitors via DemoGate. */
function CoursesDemo() {
  return (
    <>
      <h1 className="page-title">Course Tracker</h1>
      <p className="page-subtitle">Track lectures and watched progress for courses you're taking elsewhere.</p>
      <div className="card" style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
        <div
          style={{
            width: 64,
            height: 64,
            borderRadius: '50%',
            border: '6px solid var(--line)',
            borderTopColor: 'var(--gold)',
            flexShrink: 0,
          }}
        />
        <div>
          <div style={{ fontWeight: 700, fontSize: 18, marginBottom: 4 }}>Data Structures & Algorithms</div>
          <div style={{ fontSize: 12.5, color: 'var(--mute)' }}>Udemy · 2/4 lectures · 1:30:54 total</div>
        </div>
      </div>
      <div className="card" style={{ marginTop: 16 }}>
        {SAMPLE_LECTURES.map((l) => (
          <div
            key={l.name}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              padding: '10px 4px',
              borderBottom: '1px solid var(--line)',
            }}
          >
            <div
              style={{
                width: 22,
                height: 22,
                borderRadius: '50%',
                background: l.done ? 'var(--gradient-primary)' : 'transparent',
                border: l.done ? 'none' : '1px solid var(--line)',
              }}
            />
            <span style={{ flex: 1, fontSize: 14, color: l.done ? 'var(--mute)' : 'var(--cream)', textDecoration: l.done ? 'line-through' : 'none' }}>
              {l.name}
            </span>
            <span className="outline-badge">{l.duration}</span>
          </div>
        ))}
      </div>
    </>
  )
}

export default CoursesDemo
