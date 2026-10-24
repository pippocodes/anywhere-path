import RevealHeading from '../components/ui/RevealHeading'
import Reveal from '../components/ui/Reveal'

const PRINCIPLES = [
  {
    title: 'A real deadline, not a wish',
    desc: 'The roadmap\'s reality check compares what your outline needs against what your hours and days actually add up to — and offers a fix the moment it doesn\'t fit, instead of a plan that quietly lies to you.',
  },
  {
    title: 'Partial counts',
    desc: 'Habits are tracked tri-state — not done, partial, or done — because most days are partial days, and a tracker that only understands "pass or fail" teaches you to quit.',
  },
  {
    title: 'Private by default',
    desc: 'Every profile starts private. Nothing about you is discoverable until you choose to make it public, and your email is never shown to anyone but you.',
  },
  {
    title: 'AI sees only what it needs',
    desc: 'The optional AI features (roadmap generation, habit insights) receive only the short goal you type or aggregated numbers computed from your own data — never your notes, friends, or anyone else\'s data.',
  },
]

function About() {
  return (
    <div className="page" style={{ maxWidth: 720 }}>
      <RevealHeading as="h1" className="page-title" style={{ marginBottom: 24 }}>
        About Us
      </RevealHeading>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 16, fontSize: 16, lineHeight: 1.8, color: 'var(--mute)', marginBottom: 40 }}>
        <Reveal as="section">
          <div className="micro-label" style={{ marginBottom: 8 }}>
            Why
          </div>
          <p style={{ margin: 0 }}>
            Most learning plans fail before they start — not from lack of ambition, but from the gap between
            "I want to learn this" and "here's exactly what I'll do today." Anywhere Path exists to close that gap.
          </p>
        </Reveal>
        <Reveal as="section" delay={0.06}>
          <div className="micro-label" style={{ marginBottom: 8 }}>
            What
          </div>
          <p style={{ margin: 0 }}>
            It's four connected tools: a Course Tracker for lectures you're already watching, a Roadmap Builder
            that turns a plain-text outline into a realistic daily schedule, a Habit Tracker that turns either one
            into a daily tri-state check-in, and Friends, for the handful of people you want to do it alongside.
          </p>
        </Reveal>
        <Reveal as="section" delay={0.12}>
          <div className="micro-label" style={{ marginBottom: 8 }}>
            Who it's for
          </div>
          <p style={{ margin: 0 }}>
            Anyone turning a course, a book, or a skill into something they actually finish — whether that means
            tracking lectures you've already bought, planning a skill from scratch, or just wanting one habit
            tracker that doesn't shame a partial day.
          </p>
        </Reveal>
      </div>

      <Reveal as="section" delay={0.16}>
        <div className="micro-label" style={{ marginBottom: 14 }}>
          Principles
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16 }}>
          {PRINCIPLES.map((p) => (
            <div key={p.title} className="card" style={{ padding: '16px 18px' }}>
              <h3 style={{ fontSize: 14.5, marginBottom: 8 }}>{p.title}</h3>
              <p style={{ fontSize: 13, color: 'var(--mute)', lineHeight: 1.6, margin: 0 }}>{p.desc}</p>
            </div>
          ))}
        </div>
      </Reveal>
    </div>
  )
}

export default About
