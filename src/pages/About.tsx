function About() {
  return (
    <div className="page" style={{ maxWidth: 680 }}>
      <h1 className="page-title" style={{ marginBottom: 24 }}>About Us</h1>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16, fontSize: 16, lineHeight: 1.8, color: 'var(--plum)' }}>
        <p style={{ margin: 0 }}>
          Anywhere Path exists because most learning plans fail before they start — not from lack
          of ambition, but from a gap between "I want to learn this" and "here's exactly what I'll
          do today."
        </p>
        <p style={{ margin: 0 }}>
          We help you break any skill into a course, turn that course into a realistic daily
          roadmap, and track it as a habit — one small, visible checkbox at a time.
        </p>
        <p style={{ margin: 0 }}>Our mission is simple: make consistency easier than giving up.</p>
      </div>
    </div>
  )
}

export default About
