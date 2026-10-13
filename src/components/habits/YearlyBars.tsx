import { motion } from 'framer-motion'

const MONTH_LABELS = ['J', 'F', 'M', 'A', 'M', 'J', 'J', 'A', 'S', 'O', 'N', 'D']

interface Props {
  values: number[] // 12 completion percentages, Jan..Dec
  color?: string
  activeMonth?: number
}

/** 12 simple bars — satisfies "12-month bars or a GitHub-style heatmap" without a charting library. */
function YearlyBars({ values, color = 'var(--pink)', activeMonth }: Props) {
  return (
    <div style={{ display: 'flex', gap: 5, alignItems: 'flex-end' }}>
      {values.map((v, i) => (
        <div
          key={i}
          title={`${MONTH_LABELS[i]}: ${v}%`}
          style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, minWidth: 0 }}
        >
          <div
            style={{
              width: '100%',
              height: 48,
              background: 'var(--pink-paler)',
              borderRadius: 4,
              display: 'flex',
              alignItems: 'flex-end',
              overflow: 'hidden',
            }}
          >
            <motion.div
              initial={{ height: 0 }}
              animate={{ height: `${Math.max(2, v)}%` }}
              transition={{ duration: 0.5, delay: i * 0.03, ease: [0.16, 1, 0.3, 1] }}
              style={{ width: '100%', background: color, borderRadius: 4 }}
            />
          </div>
          <span
            style={{
              fontSize: 9.5,
              fontWeight: i === activeMonth ? 800 : 500,
              color: i === activeMonth ? 'var(--cherry)' : 'var(--rose)',
            }}
          >
            {MONTH_LABELS[i]}
          </span>
        </div>
      ))}
    </div>
  )
}

export default YearlyBars
