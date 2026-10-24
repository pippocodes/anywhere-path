import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import CourseTrackerPreview from '../components/home/CourseTrackerPreview'
import RoadmapBuilderPreview from '../components/home/RoadmapBuilderPreview'
import HabitTrackerPreview from '../components/home/HabitTrackerPreview'
import FriendsPreview from '../components/home/FriendsPreview'

const FEATURES = [
  {
    title: 'Course Tracker',
    desc: 'Track lectures from Udemy, YouTube, or anywhere else — nested modules, exact durations, and a progress ring that fills as you go.',
    preview: CourseTrackerPreview,
  },
  {
    title: 'Roadmap Builder',
    desc: 'Write any skill as an indented outline and get a realistic daily schedule back — with a one-click fix the moment the math doesn\'t add up.',
    preview: RoadmapBuilderPreview,
  },
  {
    title: 'Habit Tracker',
    desc: 'Turn a course or a roadmap into a daily tri-state check-in — not done, partial, or done — so a partial day never reads as a failure.',
    preview: HabitTrackerPreview,
  },
  {
    title: 'Friends & Shared Trackers',
    desc: 'Connect with people you trust and share a habit tracker together — everyone ticks their own days, side by side.',
    preview: FriendsPreview,
  },
]

const STEPS = [
  {
    n: 1,
    title: 'Add a course or write a roadmap',
    desc: 'Bring in lectures you\'re already watching, or write out a custom skill as a plain-text outline.',
  },
  {
    n: 2,
    title: 'Turn it into a daily habit',
    desc: 'The Habit Tracker turns either one into a tri-state daily check-in — showing up becomes the whole game.',
  },
  {
    n: 3,
    title: 'Track it, see it grow — alone or together',
    desc: 'Progress rings and streaks show the compounding effect, and shared trackers let you do it alongside a friend.',
  },
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
        <p style={{ textAlign: 'center', color: 'var(--mute)', fontSize: 16, maxWidth: 680, margin: '0 auto 48px' }}>
          Anywhere Path ties four tools together — course tracking, roadmap planning, daily habits, and friends to
          share them with — so you always know not just what to learn, but what to do today.
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(260px,1fr))', gap: 24 }}>
          {FEATURES.map((f, i) => {
            const Preview = f.preview
            return (
              <motion.div
                key={f.title}
                className="card"
                initial={{ opacity: 0, y: 24, filter: 'blur(5px)' }}
                whileInView={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                viewport={{ once: true, margin: '-60px' }}
                transition={{ duration: 0.6, delay: i * 0.08, ease: [0.2, 0.8, 0.2, 1] }}
                style={{ display: 'flex', flexDirection: 'column', gap: 16 }}
              >
                <div>
                  <h3 style={{ fontSize: 18, marginBottom: 8 }}>{f.title}</h3>
                  <p style={{ fontSize: 14, lineHeight: 1.55, color: 'var(--mute)', margin: 0 }}>{f.desc}</p>
                </div>
                <div
                  style={{
                    background: 'var(--surface-2)',
                    border: '1px solid var(--line)',
                    borderRadius: 12,
                    padding: 16,
                  }}
                >
                  <Preview />
                </div>
              </motion.div>
            )
          })}
        </div>
      </div>

      <div style={{ maxWidth: 1080, margin: '0 auto', padding: '90px 48px 20px' }}>
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

      <div style={{ maxWidth: 680, margin: '0 auto', padding: '70px 48px 130px', textAlign: 'center' }}>
        <motion.div
          className="card"
          initial={{ opacity: 0, y: 24, filter: 'blur(5px)' }}
          whileInView={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
          viewport={{ once: true, margin: '-60px' }}
          transition={{ duration: 0.6, ease: [0.2, 0.8, 0.2, 1] }}
          style={{ padding: '44px 40px' }}
        >
          <h2 style={{ fontSize: 26, marginBottom: 10 }}>Ready to stop planning and start tracking?</h2>
          <p style={{ fontSize: 14.5, color: 'var(--mute)', marginBottom: 24 }}>
            It's free to start — write your first outline or add your first course in a couple of minutes.
          </p>
          <Link to="/signup" className="btn" style={{ display: 'inline-block' }}>
            Get Started
          </Link>
        </motion.div>
      </div>
    </div>
  )
}

export default Home
