import RevealHeading from '../components/ui/RevealHeading'
import Reveal from '../components/ui/Reveal'

const PARAGRAPHS = [
  `Anywhere Path exists because most learning plans fail before they start — not from lack
  of ambition, but from a gap between "I want to learn this" and "here's exactly what I'll
  do today."`,
  `We help you break any skill into a plain-text outline, turn that outline into a realistic
  daily roadmap, and track it as a habit — one small, visible checkbox at a time.`,
  'Our mission is simple: make consistency easier than giving up.',
]

function About() {
  return (
    <div className="page" style={{ maxWidth: 680 }}>
      <RevealHeading as="h1" className="page-title" style={{ marginBottom: 24 }}>
        About Us
      </RevealHeading>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16, fontSize: 16, lineHeight: 1.8, color: 'var(--mute)' }}>
        {PARAGRAPHS.map((p, i) => (
          <Reveal key={i} delay={i * 0.08} as="section">
            <p style={{ margin: 0 }}>{p}</p>
          </Reveal>
        ))}
      </div>
    </div>
  )
}

export default About
