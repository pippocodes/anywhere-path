const SAMPLE_NODES = [
  { label: 'Linear Structures', hours: 16, level: 0 },
  { label: 'Arrays', hours: 5, level: 1 },
  { label: 'Linked Lists', hours: 6, level: 1 },
  { label: 'Stacks & Queues', hours: 5, level: 1 },
  { label: 'Algorithms', hours: 17, level: 0 },
  { label: 'Sorting', hours: 5, level: 1 },
  { label: 'Searching', hours: 4, level: 1 },
  { label: 'Dynamic Programming', hours: 8, level: 1 },
]

/** Static, non-interactive stand-in for the roadmap builder, shown (blurred) to signed-out visitors via DemoGate. */
function RoadmapDemo() {
  return (
    <>
      <h1 className="page-title">Roadmap Builder</h1>
      <p className="page-subtitle">
        Type or paste an outline — indent with 2 spaces per level. Add a duration at the end of any line.
      </p>
      <div className="outline-layout">
        <div className="card outline-textarea" style={{ fontSize: 13, lineHeight: 1.8 }}>
          Data Structures &amp; Algorithms (8w)
          <br />
          &nbsp;&nbsp;Linear Structures
          <br />
          &nbsp;&nbsp;&nbsp;&nbsp;Arrays (5h)
          <br />
          &nbsp;&nbsp;&nbsp;&nbsp;Linked Lists (6h)
          <br />
          &nbsp;&nbsp;Algorithms
          <br />
          &nbsp;&nbsp;&nbsp;&nbsp;Sorting (5h)
          <br />
          &nbsp;&nbsp;&nbsp;&nbsp;Dynamic Programming (8h)
        </div>
        <div className="card outline-preview">
          <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 4 }}>Data Structures &amp; Algorithms</div>
          <div style={{ fontSize: 12, color: 'var(--mute)', marginBottom: 16 }}>33h total · finishes in 8 weeks</div>
          {SAMPLE_NODES.map((n, i) => (
            <div
              key={i}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                padding: '7px 0',
                paddingLeft: n.level * 18,
                fontSize: 13.5,
                borderBottom: '1px solid var(--line)',
              }}
            >
              <span>{n.label}</span>
              <span className="outline-badge">{n.hours}h</span>
            </div>
          ))}
        </div>
      </div>
    </>
  )
}

export default RoadmapDemo
