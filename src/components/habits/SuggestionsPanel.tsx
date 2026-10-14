import { motion } from 'framer-motion'
import type { Suggestion } from '../../utils/suggestions'

const LABEL: Record<Suggestion['type'], string> = {
  'weekend-skip': 'Weekday Pattern',
  'beat-streak': 'Streak to Beat',
  'category-decline': 'Slipping',
  'focus-habit': 'Focus',
}

const ACCENT: Record<Suggestion['type'], string> = {
  'weekend-skip': 'var(--violet)',
  'beat-streak': 'var(--gold)',
  'category-decline': 'var(--rose)',
  'focus-habit': 'var(--gold)',
}

/** Rule-based insight cards — same `generateSuggestions` data, restyled away from emoji badges to quiet gold-accented cards. */
function SuggestionsPanel({ suggestions }: { suggestions: Suggestion[] }) {
  if (suggestions.length === 0) return null

  return (
    <div style={{ marginBottom: 28 }}>
      <div className="micro-label" style={{ marginBottom: 12 }}>
        Insights
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 12 }}>
        {suggestions.map((s, i) => (
          <motion.div
            key={s.id}
            className="card"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: i * 0.06, ease: [0.2, 0.8, 0.2, 1] }}
            style={{
              padding: '16px 18px',
              borderLeft: `3px solid ${ACCENT[s.type]}`,
            }}
          >
            <div style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase', color: ACCENT[s.type], marginBottom: 6 }}>
              {LABEL[s.type]}
            </div>
            <div style={{ fontSize: 13.5, color: 'var(--cream)', lineHeight: 1.5 }}>{s.message}</div>
          </motion.div>
        ))}
      </div>
    </div>
  )
}

export default SuggestionsPanel
