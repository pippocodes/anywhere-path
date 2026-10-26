import { motion } from 'framer-motion'
import CountUp from '../motion/CountUp'
import Sparkline from './Sparkline'
import type { MonthComparison } from '../../utils/habits'

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
  comparison: MonthComparison
  dailyValues: number[] // this month's daily completion %, for the sparkline
  // Renders the same 4 numbers as plain tiles (no per-tile card chrome, no
  // sparkline/delta) meant to sit inside a parent card next to the month
  // ring — used on phones (see Habits.tsx) where the full card-grid version
  // below is too tall. Desktop/tablet always get the full version.
  compact?: boolean
}

/** The four-up count-up stat row at the top of the Month view — big Cormorant numerals, gold micro-labels; Completion also gets a vs-last-month delta and a trend sparkline, since those are the only two metrics here with a meaningful comparison. */
function MonthStats({ completionPercent, currentStreak, bestStreak, perfectDays, comparison, dailyValues, compact = false }: Props) {
  const stats: Stat[] = [
    { value: completionPercent, suffix: '%', label: 'Completion' },
    { value: currentStreak, label: 'Current Streak' },
    { value: bestStreak, label: 'Best Streak' },
    { value: perfectDays, label: 'Perfect Days' },
  ]

  if (compact) {
    return (
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 14 }}>
        {stats.map((s) => (
          <div key={s.label} style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <div style={{ fontFamily: 'var(--font-display)', fontStyle: 'italic', fontWeight: 600, fontSize: 24, lineHeight: 1 }}>
              <CountUp value={s.value} suffix={s.suffix ?? ''} />
            </div>
            <div className="micro-label" style={{ fontSize: 9.5 }}>
              {s.label}
            </div>
          </div>
        ))}
      </div>
    )
  }

  const delta = comparison.deltaPercent
  const deltaLabel = delta === 0 ? 'Even with last month' : `${delta > 0 ? '+' : ''}${delta}% vs last month`

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: 20, marginBottom: 24 }}>
      <motion.div
        className="card"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.2, 0.8, 0.2, 1] }}
        style={{ padding: '24px 26px', display: 'flex', flexDirection: 'column', gap: 10 }}
      >
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 12 }}>
          <div style={{ fontFamily: 'var(--font-display)', fontStyle: 'italic', fontWeight: 600, fontSize: 'clamp(40px, 5vw, 52px)', lineHeight: 1 }}>
            <CountUp value={completionPercent} suffix="%" />
          </div>
          <Sparkline values={dailyValues} />
        </div>
        <div>
          <div className="micro-label" style={{ marginBottom: 4 }}>
            Completion
          </div>
          <div style={{ fontSize: 12, color: delta >= 0 ? 'var(--success)' : 'var(--danger)', fontWeight: 600 }}>
            {delta !== 0 && (delta > 0 ? '↑ ' : '↓ ')}
            {deltaLabel}
          </div>
        </div>
      </motion.div>

      {stats.slice(1).map((s, i) => (
        <motion.div
          key={s.label}
          className="card"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: (i + 1) * 0.06, ease: [0.2, 0.8, 0.2, 1] }}
          style={{ padding: '24px 26px', display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 10 }}
        >
          <div style={{ fontFamily: 'var(--font-display)', fontStyle: 'italic', fontWeight: 600, fontSize: 'clamp(40px, 5vw, 52px)', lineHeight: 1 }}>
            <CountUp value={s.value} suffix={s.suffix ?? ''} />
          </div>
          <div className="micro-label">{s.label}</div>
        </motion.div>
      ))}
    </div>
  )
}

export default MonthStats
