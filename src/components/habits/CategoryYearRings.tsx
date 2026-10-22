import { motion } from 'framer-motion'
import type { Habit, HabitCategory } from '../../types'
import { categoryYearlyPercent } from '../../utils/habitStats'
import ProgressRing from './ProgressRing'

interface Props {
  categories: HabitCategory[]
  habitsByCategory: Map<string, Habit[]>
  year: number
}

/** One small progress ring per category, showing that category's completion for the whole year. */
function CategoryYearRings({ categories, habitsByCategory, year }: Props) {
  if (categories.length === 0) return null

  return (
    <div>
      <div className="micro-label" style={{ marginBottom: 12 }}>
        By Category
      </div>
      <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
        {categories.map((cat, i) => {
          const percent = categoryYearlyPercent(habitsByCategory.get(cat.id) ?? [], year)
          return (
            <motion.div
              key={cat.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: i * 0.08, ease: [0.2, 0.8, 0.2, 1] }}
              style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}
            >
              <ProgressRing percent={percent} size={96} color={cat.color} />
              <span style={{ fontSize: 12, color: 'var(--mute)' }}>{cat.name}</span>
            </motion.div>
          )
        })}
      </div>
    </div>
  )
}

export default CategoryYearRings
