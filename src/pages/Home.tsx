import { Link } from 'react-router-dom'

const FEATURES = [
  { title: 'Course Building', desc: 'Break any skill into modules and topics with time estimates for each.', bg: 'var(--pink)' },
  { title: 'Realistic Roadmaps', desc: 'Turn a course and a deadline into a daily time commitment that actually fits your schedule.', bg: 'var(--cherry)' },
  { title: 'Daily Habit Tracking', desc: 'A simple calendar grid to mark each day done, partial, or skipped.', bg: 'var(--rose)' },
  { title: 'Progress Visualization', desc: 'Progress bars and monthly completion, so growth is easy to see.', bg: 'var(--plum)' },
]

const STEPS = [
  { n: 1, title: 'Add a Course', desc: 'Name it, then break it into modules and topics.' },
  { n: 2, title: 'Build Your Roadmap', desc: 'Set a deadline and get a daily time commitment.' },
  { n: 3, title: 'Track It Daily', desc: 'Mark each day in your habit tracker.' },
  { n: 4, title: 'Watch Progress Grow', desc: 'See completion rise, course by course.' },
]

function Home() {
  return (
    <div>
      <div
        style={{
          position: 'relative',
          overflow: 'hidden',
          background: 'linear-gradient(135deg,#590d22 0%,#800f2f 30%,#a4133c 55%,#ff4d6d 82%,#ff8fa3 100%)',
          padding: '130px 48px 140px',
          textAlign: 'center',
          color: 'var(--bg)',
        }}
      >
        <div
          style={{
            position: 'absolute',
            top: -140,
            right: -100,
            width: 420,
            height: 420,
            borderRadius: '50%',
            background: 'radial-gradient(circle,rgba(255,143,163,0.35),transparent 70%)',
            filter: 'blur(6px)',
            pointerEvents: 'none',
          }}
        />
        <div
          style={{
            position: 'relative',
            display: 'inline-block',
            padding: '8px 18px',
            borderRadius: 999,
            background: 'rgba(255,240,243,0.14)',
            border: '1px solid rgba(255,240,243,0.3)',
            fontSize: 13,
            fontWeight: 600,
            marginBottom: 26,
          }}
        >
          Skill-building, made habitual
        </div>
        <div
          style={{
            position: 'relative',
            fontFamily: "'Poppins', sans-serif",
            fontWeight: 800,
            fontSize: 64,
            letterSpacing: -2,
            marginBottom: 20,
            textShadow: '0 12px 40px rgba(89,13,34,0.35)',
          }}
        >
          Anywhere Path
        </div>
        <div style={{ position: 'relative', fontSize: 21, fontWeight: 500, maxWidth: 640, margin: '0 auto 12px' }}>
          Turn the skills you want to learn into habits you actually keep.
        </div>
        <div style={{ position: 'relative', fontSize: 16, maxWidth: 560, margin: '0 auto 44px', opacity: 0.85 }}>
          Build a course, get a realistic daily roadmap, and track it one day at a time — so
          progress stops depending on motivation.
        </div>
        <div style={{ position: 'relative', display: 'flex', justifyContent: 'center', gap: 16 }}>
          <Link
            to="/courses"
            className="btn"
            style={{ background: 'var(--bg)', color: 'var(--plum)', display: 'inline-block' }}
          >
            Get Started
          </Link>
          <Link
            to="/about"
            className="btn btn-secondary"
            style={{ borderColor: 'var(--bg)', color: 'var(--bg)', display: 'inline-block' }}
          >
            Learn More
          </Link>
        </div>
      </div>

      <div style={{ maxWidth: 1080, margin: '0 auto', padding: '90px 48px 20px' }}>
        <h2 style={{ fontSize: 32, textAlign: 'center', marginBottom: 12 }}>Why Anywhere Path</h2>
        <p style={{ textAlign: 'center', color: 'var(--rose)', fontSize: 16, marginBottom: 48 }}>
          Everything you need to go from "I should learn this" to "I did this, every day."
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(230px,1fr))', gap: 24 }}>
          {FEATURES.map((f) => (
            <div key={f.title} className="card">
              <div style={{ width: 52, height: 52, borderRadius: 14, background: f.bg, marginBottom: 18 }} />
              <h3 style={{ fontSize: 18, marginBottom: 8 }}>{f.title}</h3>
              <p style={{ fontSize: 14.5, lineHeight: 1.55, color: 'var(--plum)', margin: 0 }}>{f.desc}</p>
            </div>
          ))}
        </div>
      </div>

      <div style={{ maxWidth: 1080, margin: '0 auto', padding: '90px 48px 110px' }}>
        <h2 style={{ fontSize: 32, textAlign: 'center', marginBottom: 48 }}>How It Works</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(220px,1fr))', gap: 28 }}>
          {STEPS.map((s) => (
            <div key={s.n} style={{ textAlign: 'center' }}>
              <div
                style={{
                  width: 56,
                  height: 56,
                  borderRadius: '50%',
                  background: 'var(--pink)',
                  color: 'var(--bg)',
                  fontFamily: "'Poppins', sans-serif",
                  fontWeight: 700,
                  fontSize: 22,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 16px',
                }}
              >
                {s.n}
              </div>
              <h3 style={{ fontSize: 17, marginBottom: 6 }}>{s.title}</h3>
              <p style={{ fontSize: 14, color: 'var(--plum)', lineHeight: 1.5, margin: 0 }}>{s.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default Home
