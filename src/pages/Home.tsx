import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'

const FEATURES = [
  { title: 'Outline Your Path', desc: 'Write a skill as a simple indented outline — topics, hours, and durations.', bg: 'var(--gold)' },
  { title: 'Realistic Roadmaps', desc: 'Turn that outline and a deadline into a daily time commitment that actually fits your schedule.', bg: 'var(--rose)' },
  { title: 'Daily Habit Tracking', desc: 'A calendar grid to mark each day done, partial, or skipped.', bg: 'var(--violet)' },
  { title: 'Progress Visualization', desc: 'Progress rings and monthly completion, so growth is easy to see.', bg: 'var(--mute)' },
]

const STEPS = [
  { n: 1, title: 'Write the Outline', desc: 'Type the skill as an indented list — the preview builds itself as you type.' },
  { n: 2, title: 'Set a Deadline', desc: 'Pick a target date and get a realistic daily time commitment.' },
  { n: 3, title: 'Track It Daily', desc: 'Mark each day done in your habit tracker.' },
  { n: 4, title: 'Watch Progress Grow', desc: 'See completion rise, topic by topic.' },
]

function Home() {
  return (
    <div>
      <div
        style={{
          position: 'relative',
          overflow: 'hidden',
          padding: '150px 48px 150px',
          textAlign: 'center',
          color: 'var(--cream)',
        }}
      >
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="micro-label"
          style={{
            position: 'relative',
            display: 'inline-block',
            padding: '8px 20px',
            borderRadius: 999,
            background: 'var(--surface)',
            border: '1px solid var(--line)',
            marginBottom: 28,
          }}
        >
          Skill-building, made habitual
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          style={{
            position: 'relative',
            fontFamily: 'var(--font-display)',
            fontStyle: 'italic',
            fontWeight: 600,
            fontSize: 72,
            letterSpacing: '-0.01em',
            lineHeight: 1.05,
            marginBottom: 22,
            backgroundImage: 'var(--gradient-primary)',
            backgroundClip: 'text',
            WebkitBackgroundClip: 'text',
            color: 'transparent',
          }}
        >
          Anywhere Path
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.18 }}
          style={{ position: 'relative', fontSize: 21, fontWeight: 500, maxWidth: 640, margin: '0 auto 12px', color: 'var(--cream)' }}
        >
          Turn the skills you want to learn into habits you actually keep.
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.24 }}
          style={{ position: 'relative', fontSize: 16, maxWidth: 560, margin: '0 auto 44px', color: 'var(--mute)' }}
        >
          Write a skill as an outline, get a realistic daily roadmap, and track it one day at a
          time — so progress stops depending on motivation.
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          style={{ position: 'relative', display: 'flex', justifyContent: 'center', gap: 16 }}
        >
          <Link to="/roadmap" className="btn" style={{ display: 'inline-block' }}>
            Get Started
          </Link>
          <Link to="/about" className="btn btn-secondary" style={{ display: 'inline-block' }}>
            Learn More
          </Link>
        </motion.div>
      </div>

      <div style={{ maxWidth: 1080, margin: '0 auto', padding: '90px 48px 20px' }}>
        <div className="micro-label" style={{ textAlign: 'center', marginBottom: 10 }}>
          The Difference
        </div>
        <h2 style={{ fontSize: 34, textAlign: 'center', marginBottom: 12 }}>Why Anywhere Path</h2>
        <p style={{ textAlign: 'center', color: 'var(--mute)', fontSize: 16, marginBottom: 48 }}>
          Everything you need to go from "I should learn this" to "I did this, every day."
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(230px,1fr))', gap: 24 }}>
          {FEATURES.map((f, i) => (
            <motion.div
              key={f.title}
              className="card"
              initial={{ opacity: 0, y: 24, filter: 'blur(5px)' }}
              whileInView={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
              viewport={{ once: true, margin: '-60px' }}
              transition={{ duration: 0.6, delay: i * 0.08, ease: [0.2, 0.8, 0.2, 1] }}
            >
              <div style={{ width: 44, height: 44, borderRadius: 12, background: f.bg, marginBottom: 20, opacity: 0.9 }} />
              <h3 style={{ fontSize: 18, marginBottom: 8 }}>{f.title}</h3>
              <p style={{ fontSize: 14.5, lineHeight: 1.55, color: 'var(--mute)', margin: 0 }}>{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>

      <div style={{ maxWidth: 1080, margin: '0 auto', padding: '90px 48px 110px' }}>
        <div className="micro-label" style={{ textAlign: 'center', marginBottom: 10 }}>
          The Method
        </div>
        <h2 style={{ fontSize: 34, textAlign: 'center', marginBottom: 48 }}>How It Works</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(220px,1fr))', gap: 28 }}>
          {STEPS.map((s, i) => (
            <motion.div
              key={s.n}
              initial={{ opacity: 0, y: 24, filter: 'blur(5px)' }}
              whileInView={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
              viewport={{ once: true, margin: '-60px' }}
              transition={{ duration: 0.6, delay: i * 0.08, ease: [0.2, 0.8, 0.2, 1] }}
              style={{ textAlign: 'center' }}
            >
              <div
                style={{
                  width: 52,
                  height: 52,
                  borderRadius: '50%',
                  border: '1px solid var(--line)',
                  background: 'var(--surface)',
                  color: 'var(--gold)',
                  fontFamily: 'var(--font-display)',
                  fontStyle: 'italic',
                  fontWeight: 600,
                  fontSize: 24,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 16px',
                }}
              >
                {s.n}
              </div>
              <h3 style={{ fontSize: 17, marginBottom: 6 }}>{s.title}</h3>
              <p style={{ fontSize: 14, color: 'var(--mute)', lineHeight: 1.5, margin: 0 }}>{s.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default Home
