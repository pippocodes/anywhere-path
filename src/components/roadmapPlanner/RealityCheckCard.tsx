import { useMemo, useState, type ReactNode } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import type { RealityCheckResult } from '../../utils/realityCheck'
import { previewFinishDate } from '../../utils/realityCheck'
import { formatDuration } from '../../utils/duration'
import { formatDateLabel } from '../../utils/scheduler'
import { addCalendarDays } from '../../utils/planScheduler'
import LogoStarIcon from '../ui/LogoStarIcon'
import type { PlanStep } from '../../types'

type SpeedMultiplier = 1.25 | 1.5

interface Props {
  result: RealityCheckResult
  includedSteps: PlanStep[]
  startDate: string
  days: number
  hoursPerDay: number
  weekdays: number[]
  onApplyHoursPerDay: (hours: number) => void
  onApplyDays: (days: number) => void
  onApplyLater: (laterIds: Set<string>) => void
  onApplySpeedUp: (multiplier: number) => void
  onApplyStartDate: (date: string) => void
}

type OptionKey = 'studyMore' | 'moreDays' | 'later' | 'faster' | 'startLater'

/** The "does this actually fit" summary — a calm card when it does, an honest one with exact numbers and exactly five one-click fixes (each showing the finish date it would give) when it doesn't. */
function RealityCheckCard({
  result,
  includedSteps,
  startDate,
  days,
  hoursPerDay,
  weekdays,
  onApplyHoursPerDay,
  onApplyDays,
  onApplyLater,
  onApplySpeedUp,
  onApplyStartDate,
}: Props) {
  const accent = result.fits ? 'var(--gold)' : 'var(--rose)'
  const [openOption, setOpenOption] = useState<OptionKey | null>(null)
  const [laterIds, setLaterIds] = useState<Set<string>>(new Set())
  const [speedMultiplier, setSpeedMultiplier] = useState<SpeedMultiplier>(1.25)
  const [previewStartDate, setPreviewStartDate] = useState(() => addCalendarDays(startDate, 3))

  function toggleOption(key: OptionKey) {
    setOpenOption((prev) => (prev === key ? null : key))
  }

  const coreRequiredSeconds = useMemo(
    () => includedSteps.filter((s) => !laterIds.has(s.id)).reduce((sum, s) => sum + s.estimatedSeconds, 0),
    [includedSteps, laterIds]
  )
  const coreFinishDate = useMemo(
    () => (laterIds.size > 0 ? previewFinishDate(coreRequiredSeconds, startDate, hoursPerDay, weekdays) : null),
    [coreRequiredSeconds, laterIds.size, startDate, hoursPerDay, weekdays]
  )

  const fasterFinishDate = useMemo(
    () => previewFinishDate(Math.ceil(result.requiredSeconds / speedMultiplier), startDate, hoursPerDay, weekdays),
    [result.requiredSeconds, speedMultiplier, startDate, hoursPerDay, weekdays]
  )

  const startLaterFinishDate = days > 0 ? addCalendarDays(previewStartDate, days - 1) : null

  if (result.fits) {
    return (
      <motion.div
        layout
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: [0.2, 0.8, 0.2, 1] }}
        className="card"
        style={{ border: `1px solid ${accent}` }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
          <LogoStarIcon size={18} />
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
      </motion.div>
    )
  }

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: [0.2, 0.8, 0.2, 1] }}
      className="card"
      style={{ border: `1px solid ${accent}` }}
    >
      <div style={{ fontWeight: 700, fontSize: 15, color: 'var(--rose)', marginBottom: 8 }}>Not enough time yet</div>
      <p style={{ fontSize: 13.5, color: 'var(--mute)', marginBottom: 16 }}>
        You need <strong style={{ color: 'var(--cream)' }}>{formatDuration(result.requiredSeconds)}</strong> but
        have <strong style={{ color: 'var(--cream)' }}>{formatDuration(result.availableSeconds)}</strong> across{' '}
        {result.studyDays} study day{result.studyDays === 1 ? '' : 's'} — short by{' '}
        <strong style={{ color: 'var(--rose)' }}>{formatDuration(result.shortfallSeconds)}</strong>.
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <FixOption
          label="Study more per day"
          preview={
            result.suggestedHoursPerDay !== null && result.finishDate
              ? `${result.suggestedHoursPerDay} h/day — finishes by ${formatDateLabel(result.finishDate)}`
              : 'Not computable with the current schedule'
          }
          disabled={result.suggestedHoursPerDay === null}
          onApply={() => result.suggestedHoursPerDay !== null && onApplyHoursPerDay(result.suggestedHoursPerDay)}
        />

        <FixOption
          label="More study days"
          preview={
            result.suggestedDays !== null && result.suggestedFinishDate
              ? `${result.suggestedDays} days — finishes by ${formatDateLabel(result.suggestedFinishDate)}`
              : 'Not computable with the current schedule'
          }
          disabled={result.suggestedDays === null}
          onApply={() => result.suggestedDays !== null && onApplyDays(result.suggestedDays)}
        />

        <FixOption
          label="Mark some modules as Later"
          preview={coreFinishDate ? `Core finishes by ${formatDateLabel(coreFinishDate)}` : 'Pick which steps can wait'}
          expandable
          open={openOption === 'later'}
          onToggleOpen={() => toggleOption('later')}
          disabled={laterIds.size === 0}
          applyLabel="Move Later steps to the end"
          onApply={() => {
            onApplyLater(laterIds)
            setLaterIds(new Set())
            setOpenOption(null)
          }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4, maxHeight: 180, overflowY: 'auto' }}>
            {includedSteps.map((step) => (
              <label key={step.id} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12.5, padding: '4px 2px' }}>
                <input
                  type="checkbox"
                  checked={laterIds.has(step.id)}
                  onChange={() =>
                    setLaterIds((prev) => {
                      const next = new Set(prev)
                      if (next.has(step.id)) next.delete(step.id)
                      else next.add(step.id)
                      return next
                    })
                  }
                />
                <span style={{ color: 'var(--cream)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{step.title}</span>
              </label>
            ))}
          </div>
        </FixOption>

        <FixOption
          label="Watch faster"
          preview={fasterFinishDate ? `${speedMultiplier}x — finishes by ${formatDateLabel(fasterFinishDate)}` : 'Not computable with the current schedule'}
          expandable
          open={openOption === 'faster'}
          onToggleOpen={() => toggleOption('faster')}
          disabled={fasterFinishDate === null}
          applyLabel={`Apply ${speedMultiplier}x`}
          onApply={() => {
            onApplySpeedUp(speedMultiplier)
            setOpenOption(null)
          }}
        >
          <div style={{ display: 'flex', gap: 8 }}>
            {([1.25, 1.5] as const).map((m) => (
              <button
                key={m}
                type="button"
                className="pill-toggle"
                aria-pressed={speedMultiplier === m}
                onClick={() => setSpeedMultiplier(m)}
                style={{
                  padding: '8px 16px',
                  borderRadius: 8,
                  border: speedMultiplier === m ? '1px solid var(--rose)' : '1px solid var(--line)',
                  background: speedMultiplier === m ? 'color-mix(in srgb, var(--rose) 16%, transparent)' : 'var(--surface)',
                  color: 'var(--cream)',
                  fontSize: 12.5,
                  fontWeight: 600,
                }}
              >
                {m}x
              </button>
            ))}
          </div>
        </FixOption>

        <FixOption
          label="Start later"
          preview={startLaterFinishDate ? `From ${formatDateLabel(previewStartDate)} — finishes by ${formatDateLabel(startLaterFinishDate)}` : 'Pick a new start date'}
          expandable
          open={openOption === 'startLater'}
          onToggleOpen={() => toggleOption('startLater')}
          applyLabel="Use this start date"
          onApply={() => {
            onApplyStartDate(previewStartDate)
            setOpenOption(null)
          }}
        >
          <input
            type="date"
            value={previewStartDate}
            onChange={(e) => setPreviewStartDate(e.target.value)}
            style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid var(--line)', fontSize: 13, background: 'var(--surface)', color: 'var(--cream)' }}
          />
        </FixOption>
      </div>
    </motion.div>
  )
}

function FixOption({
  label,
  preview,
  disabled,
  expandable,
  open,
  onToggleOpen,
  applyLabel,
  onApply,
  children,
}: {
  label: string
  preview: string
  disabled?: boolean
  expandable?: boolean
  open?: boolean
  onToggleOpen?: () => void
  applyLabel?: string
  onApply: () => void
  children?: ReactNode
}) {
  return (
    <div style={{ border: '1px solid var(--line)', borderRadius: 10, padding: '10px 12px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--cream)' }}>{label}</div>
          <div style={{ fontSize: 12, color: 'var(--mute)' }}>{preview}</div>
        </div>
        {expandable ? (
          <button type="button" className="btn-outline" style={{ fontSize: 12, flexShrink: 0 }} onClick={onToggleOpen}>
            {open ? 'Close' : 'Choose'}
          </button>
        ) : (
          <button type="button" className="btn-outline" style={{ fontSize: 12, flexShrink: 0 }} disabled={disabled} onClick={onApply}>
            Use this
          </button>
        )}
      </div>
      <AnimatePresence initial={false}>
        {expandable && open && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2, ease: [0.2, 0.8, 0.2, 1] }}
            style={{ overflow: 'hidden' }}
          >
            <div style={{ marginTop: 8, display: 'flex', flexDirection: 'column', gap: 8 }}>
              {children}
              <button type="button" className="btn-outline" style={{ fontSize: 12, alignSelf: 'flex-start' }} disabled={disabled} onClick={onApply}>
                {applyLabel}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default RealityCheckCard
