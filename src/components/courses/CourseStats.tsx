import { motion } from 'framer-motion'
import type { CourseStats as CourseStatsData } from '../../utils/courseStats'
import { formatDuration } from '../../utils/duration'
import ProgressRing from '../habits/ProgressRing'
import CountUp from '../motion/CountUp'

/** Course summary: progress ring + total/watched/remaining time and lecture count — rolls up automatically from the course's lectures. */
function CourseStats({ stats }: { stats: CourseStatsData }) {
  return (
    <div className="card" style={{ display: 'flex', alignItems: 'center', gap: 32, flexWrap: 'wrap', marginBottom: 24 }}>
      <ProgressRing percent={stats.percent} label="watched" />
      <div style={{ display: 'flex', gap: 32, flexWrap: 'wrap' }}>
        <Stat value={formatDuration(stats.totalSeconds)} label="Total" />
        <Stat value={formatDuration(stats.watchedSeconds)} label="Watched" />
        <Stat value={formatDuration(stats.remainingSeconds)} label="Remaining" />
        <Stat value={`${stats.lecturesDone}/${stats.lecturesTotal}`} label="Lectures" isCount countValue={stats.lecturesDone} countTotal={stats.lecturesTotal} />
      </div>
    </div>
  )
}

function Stat({
  value,
  label,
  isCount,
  countValue,
  countTotal,
}: {
  value: string
  label: string
  isCount?: boolean
  countValue?: number
  countTotal?: number
}) {
  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
      <div style={{ fontFamily: 'var(--font-display)', fontStyle: 'italic', fontWeight: 600, fontSize: 26, fontVariantNumeric: 'tabular-nums' }}>
        {isCount && countValue !== undefined && countTotal !== undefined ? (
          <>
            <CountUp value={countValue} />/{countTotal}
          </>
        ) : (
          value
        )}
      </div>
      <div className="micro-label" style={{ marginTop: 4 }}>
        {label}
      </div>
    </motion.div>
  )
}

export default CourseStats
