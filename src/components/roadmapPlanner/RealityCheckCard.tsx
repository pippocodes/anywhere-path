import { motion } from 'framer-motion'
import type { RealityCheckResult } from '../../utils/realityCheck'
import { formatDuration } from '../../utils/duration'
import { formatDateLabel } from '../../utils/scheduler'

interface Props {
  result: RealityCheckResult
  onIncreaseHours: () => void
  onExtendDays: () => void
  onTrimScope: () => void
}

/** The "does this actually fit" summary — a calm green card when it does, an honest amber one with exact numbers and one-click fixes when it doesn't. */
function RealityCheckCard({ result, onIncreaseHours, onExtendDays, onTrimScope }: Props) {
  const accent = result.fits ? 'var(--gold)' : 'var(--rose)'

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: [0.2, 0.8, 0.2, 1] }}
      className="card"
      style={{ borderLeft: `3px solid ${accent}` }}
    >
      {result.fits ? (
        <>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
            <span style={{ fontSize: 18, color: 'var(--gold)' }}>✦</span>
            <span style={{ fontWeight: 700, fontSize: 15 }}>This plan fits</span>
          </div>
          <p style={{ fontSize: 13.5, color: 'var(--mute)', margin: 0 }}>
            You need {formatDuration(result.requiredSeconds)} and have {formatDuration(result.availableSeconds)}{' '}
            available across {result.studyDays} study day{result.studyDays === 1 ? '' : 's'}.
            {result.finishDate && (
              <>
                {' '}
                Estimated finish: <strong style={{ color: 'var(--cream)' }}>{formatDateLabel(result.finishDate)}</strong>.
              </>
            )}
          </p>
        </>
      ) : (
        <>
          <div style={{ fontWeight: 700, fontSize: 15, color: 'var(--rose)', marginBottom: 6 }}>Not enough time yet</div>
          <p style={{ fontSize: 13.5, color: 'var(--mute)', marginBottom: 14 }}>
            You need <strong style={{ color: 'var(--cream)' }}>{formatDuration(result.requiredSeconds)}</strong> but
            have <strong style={{ color: 'var(--cream)' }}>{formatDuration(result.availableSeconds)}</strong> across{' '}
            {result.studyDays} study day{result.studyDays === 1 ? '' : 's'} — short by{' '}
            <strong style={{ color: 'var(--rose)' }}>{formatDuration(result.shortfallSeconds)}</strong>.
          </p>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            {result.suggestedHoursPerDay !== null && (
              <button type="button" className="btn-outline" onClick={onIncreaseHours}>
                Increase hours per day to {result.suggestedHoursPerDay}
              </button>
            )}
            {result.suggestedDays !== null && result.suggestedFinishDate && (
              <button type="button" className="btn-outline" onClick={onExtendDays}>
                Extend to {result.suggestedDays} days (finish by {formatDateLabel(result.suggestedFinishDate)})
              </button>
            )}
            <button type="button" className="btn-outline" onClick={onTrimScope}>
              Trim scope
            </button>
          </div>
        </>
      )}
    </motion.div>
  )
}

export default RealityCheckCard
