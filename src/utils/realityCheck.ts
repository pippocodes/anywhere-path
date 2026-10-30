import { addCalendarDays, countStudyDays, daysToReachStudyDays } from './planScheduler'

export interface RealityCheckInput {
  startDate: string // YYYY-MM-DD
  days: number // calendar days in the user's target window
  hoursPerDay: number
  weekdays: number[] // 0=Sun..6=Sat — which days count as study days
  requiredSeconds: number // total time the plan's steps need
}

export interface RealityCheckResult {
  requiredSeconds: number
  availableSeconds: number
  studyDays: number // qualifying weekdays within the `days` window
  fits: boolean
  shortfallSeconds: number // 0 when it fits
  finishDate: string | null // the target window's last day (start + days - 1)
  // One-click fixes — null when that fix can't be computed (e.g. no weekdays selected).
  suggestedHoursPerDay: number | null
  suggestedDays: number | null
  suggestedFinishDate: string | null
}

/**
 * Compares a plan's total required time against what start date + days +
 * hours/day + weekdays actually make available, and — when it doesn't fit —
 * works out the two "increase X instead" fixes ("Trim scope" is a UI-only
 * concern: deselecting steps just lowers requiredSeconds and this gets
 * recomputed).
 */
export function computeRealityCheck(input: RealityCheckInput): RealityCheckResult {
  const { startDate, days, hoursPerDay, weekdays, requiredSeconds } = input

  const studyDays = countStudyDays(startDate, days, weekdays)
  const availableSeconds = studyDays * hoursPerDay * 3600
  const fits = availableSeconds >= requiredSeconds
  const shortfallSeconds = fits ? 0 : requiredSeconds - availableSeconds
  const finishDate = days > 0 ? addCalendarDays(startDate, days - 1) : null

  let suggestedHoursPerDay: number | null = null
  if (studyDays > 0) {
    suggestedHoursPerDay = Math.ceil((requiredSeconds / (studyDays * 3600)) * 10) / 10
  }

  let suggestedDays: number | null = null
  let suggestedFinishDate: string | null = null
  if (hoursPerDay > 0 && weekdays.length > 0) {
    const targetStudyDays = Math.ceil(requiredSeconds / (hoursPerDay * 3600))
    const computedDays = daysToReachStudyDays(startDate, targetStudyDays, weekdays)
    if (Number.isFinite(computedDays)) {
      suggestedDays = computedDays
      suggestedFinishDate = addCalendarDays(startDate, computedDays - 1)
    }
  }

  return {
    requiredSeconds,
    availableSeconds,
    studyDays,
    fits,
    shortfallSeconds,
    finishDate,
    suggestedHoursPerDay,
    suggestedDays,
    suggestedFinishDate,
  }
}

/**
 * The finish date a given total of required seconds would produce at this
 * start date / hours-per-day / weekdays — the shared math behind the
 * Reality Check card's "mark some as Later" and "watch faster" options,
 * which each shrink requiredSeconds a different way but share this one
 * finish-date lookup (same formula computeRealityCheck itself uses for its
 * own suggestedDays/suggestedFinishDate).
 */
export function previewFinishDate(requiredSeconds: number, startDate: string, hoursPerDay: number, weekdays: number[]): string | null {
  if (hoursPerDay <= 0 || weekdays.length === 0) return null
  const targetStudyDays = Math.ceil(requiredSeconds / (hoursPerDay * 3600))
  const computedDays = daysToReachStudyDays(startDate, targetStudyDays, weekdays)
  return Number.isFinite(computedDays) ? addCalendarDays(startDate, computedDays - 1) : null
}
