import packageJson from '../../package.json'
import { creatorStory } from '../content/about'
import RevealHeading from '../components/ui/RevealHeading'
import Reveal from '../components/ui/Reveal'
import Avatar from '../components/ui/Avatar'

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

const STACK = [
  { name: 'React + TypeScript', note: 'the UI, type-checked end to end' },
  { name: 'Vite', note: 'dev server and build' },
  { name: 'React Router', note: 'routing' },
  { name: 'Framer Motion', note: 'the animation throughout the app' },
  { name: 'dnd-kit', note: 'drag-and-drop reordering' },
  { name: 'Recharts', note: 'the Habit Tracker\'s charts' },
  { name: 'Supabase', note: 'Postgres, auth, and row-level security' },
  { name: 'Vercel', note: 'hosting and the serverless functions behind the AI features' },
  { name: 'Anthropic Claude', note: 'the optional AI roadmap generation and habit insights' },
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

      <Reveal as="section" delay={0.16} style={{ marginBottom: 40 }}>
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

      <Reveal as="section" delay={0.2} style={{ marginBottom: 40 }}>
        <div className="micro-label" style={{ marginBottom: 14 }}>
          Built with
        </div>
        <div className="card" style={{ padding: '18px 20px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {STACK.map((s) => (
              <div key={s.name} style={{ display: 'flex', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap', fontSize: 13.5 }}>
                <span style={{ fontWeight: 600, color: 'var(--cream)' }}>{s.name}</span>
                <span style={{ color: 'var(--mute)', textAlign: 'right' }}>{s.note}</span>
              </div>
            ))}
          </div>
          <p style={{ fontSize: 11.5, color: 'var(--mute)', marginTop: 14, marginBottom: 0 }}>
            Straight from this project's own package.json — version {packageJson.version}.
          </p>
        </div>
      </Reveal>

      <Reveal as="section" delay={0.24}>
        <div className="micro-label" style={{ marginBottom: 14 }}>
          The person behind it
        </div>
        <div className="card" style={{ padding: '20px 22px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 14 }}>
            <Avatar label={creatorStory.name} size={48} />
            <div>
              <div style={{ fontSize: 15.5, fontWeight: 600 }}>{creatorStory.name}</div>
              <div style={{ fontSize: 12.5, color: 'var(--mute)' }}>{creatorStory.role}</div>
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {creatorStory.paragraphs.map((p, i) => (
              <p key={i} style={{ fontSize: 14, color: 'var(--mute)', lineHeight: 1.7, margin: 0 }}>
                {p}
              </p>
            ))}
          </div>
        </div>
      </Reveal>
    </div>
  )
}

export default About
