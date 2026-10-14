import { motion } from 'framer-motion'
import CountUp from '../motion/CountUp'

interface Stat {
  value: number
  suffix?: string
  label: string
}

interface Props {
  completionPercent: number
  currentStreak: number
  bestStreak: number
  perfectDays: number
}

/** The four-up count-up stat row at the top of the Month view — Cormorant numerals, gold micro-labels. */
function MonthStats({ completionPercent, currentStreak, bestStreak, perfectDays }: Props) {
  const stats: Stat[] = [
    { value: completionPercent, suffix: '%', label: 'Completion' },
    { value: currentStreak, label: 'Current Streak' },
    { value: bestStreak, label: 'Best Streak' },
    { value: perfectDays, label: 'Perfect Days' },
  ]

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 20, marginBottom: 24 }}>
      {stats.map((s, i) => (
        <motion.div
          key={s.label}
          className="card"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: i * 0.06, ease: [0.2, 0.8, 0.2, 1] }}
          style={{ padding: '20px 22px' }}
        >
          <div style={{ fontFamily: 'var(--font-display)', fontStyle: 'italic', fontWeight: 600, fontSize: 34, lineHeight: 1 }}>
            <CountUp value={s.value} suffix={s.suffix ?? ''} />
          </div>
          <div className="micro-label" style={{ marginTop: 8 }}>
            {s.label}
          </div>
        </motion.div>
      ))}
    </div>
  )
}

export default MonthStats
