import type { HabitMark, Habit } from '../types.js'

export function toDateStr(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

export function parseDateStr(value: string): Date {
  const [y, m, d] = value.split('-').map(Number)
  return new Date(y, (m || 1) - 1, d || 1)
}

function addDays(date: Date, days: number): Date {
  const next = new Date(date)
  next.setDate(next.getDate() + days)
  return next
}

export function daysInMonth(month: number, year: number): number {
  return new Date(year, month + 1, 0).getDate()
}

// Date strings (YYYY-MM-DD) for every day in the given month, in order.
export function monthDates(month: number, year: number): string[] {
  const count = daysInMonth(month, year)
  return Array.from({ length: count }, (_, i) => toDateStr(new Date(year, month, i + 1)))
}

export function cycleMark(mark: HabitMark | undefined): HabitMark {
  const current = mark ?? 0
  return ((current + 1) % 3) as HabitMark
}

export function monthCompletionPercent(habits: Habit[], month: number, year: number): number {
  const dates = monthDates(month, year)
  if (habits.length === 0 || dates.length === 0) return 0

  let total = 0
  let earned = 0
  for (const habit of habits) {
    for (const date of dates) {
      total++
      earned += (habit.marks[date] ?? 0) / 2
    }
  }
  return total === 0 ? 0 : Math.round((earned / total) * 100)
}

// Streaks only count fully-"done" (mark 2) days — a partial day doesn't
// extend a streak, matching the filled-in "Done" legend color.

/**
 * The streak currently in progress, ending at `today` — or at yesterday if
 * today isn't marked done yet, so an in-progress day doesn't read as a
 * broken streak before it's even over.
 */
export function computeCurrentStreak(habit: Habit, today: Date = new Date()): number {
  let cursor = today
  if ((habit.marks[toDateStr(cursor)] ?? 0) !== 2) {
    cursor = addDays(cursor, -1)
  }
  let streak = 0
  while ((habit.marks[toDateStr(cursor)] ?? 0) === 2) {
    streak++
    cursor = addDays(cursor, -1)
  }
  return streak
}

/** The longest run of consecutive "done" days anywhere in the habit's history. */
export function computeBestStreak(habit: Habit): number {
  const doneDates = Object.keys(habit.marks)
    .filter((d) => habit.marks[d] === 2)
    .sort()
  if (doneDates.length === 0) return 0

  let best = 1
  let run = 1
  for (let i = 1; i < doneDates.length; i++) {
    const prev = parseDateStr(doneDates[i - 1])
    const diffDays = Math.round((parseDateStr(doneDates[i]).getTime() - prev.getTime()) / 86_400_000)
    run = diffDays === 1 ? run + 1 : 1
    best = Math.max(best, run)
  }
  return best
}

/** One completion percentage per calendar month (Jan..Dec) for the given year. */
export function yearlyCompletion(habits: Habit[], year: number): number[] {
  return Array.from({ length: 12 }, (_, month) => monthCompletionPercent(habits, month, year))
}

/**
 * Completion percent over the first `dayCount` days of the given calendar
 * month — an "elapsed window", as opposed to `monthCompletionPercent`
 * which always divides by the whole month (right for a progress bar, wrong
 * for comparing an in-progress month to a finished one).
 */
export function elapsedCompletionPercent(habits: Habit[], year: number, month: number, dayCount: number): number {
  if (habits.length === 0 || dayCount <= 0) return 0
  let total = 0
  let earned = 0
  for (const habit of habits) {
    for (let d = 1; d <= dayCount; d++) {
      total++
      earned += (habit.marks[toDateStr(new Date(year, month, d))] ?? 0) / 2
    }
  }
  return total === 0 ? 0 : Math.round((earned / total) * 100)
}

export interface MonthComparison {
  thisMonthPercent: number
  lastMonthPercent: number
  deltaPercent: number // positive = ahead of last month
}

/**
 * Compares the same number of elapsed days in this month against last
 * month — e.g. on the 15th, the first 15 days of each — rather than this
 * month's (necessarily partial) total against last month's complete one,
 * which would always look like a decline simply because the month isn't
 * over yet.
 */
export function compareToLastMonth(habits: Habit[], referenceDate: Date): MonthComparison {
  const year = referenceDate.getFullYear()
  const month = referenceDate.getMonth()
  const dayOfMonth = referenceDate.getDate()

  const lastMonth = month === 0 ? 11 : month - 1
  const lastMonthYear = month === 0 ? year - 1 : year
  const lastMonthDayCount = Math.min(dayOfMonth, daysInMonth(lastMonth, lastMonthYear))

  const thisMonthPercent = elapsedCompletionPercent(habits, year, month, dayOfMonth)
  const lastMonthPercent = elapsedCompletionPercent(habits, lastMonthYear, lastMonth, lastMonthDayCount)
  return { thisMonthPercent, lastMonthPercent, deltaPercent: thisMonthPercent - lastMonthPercent }
}

/** True when every given habit is marked fully done for that one date. Empty input is never "perfect". */
export function isPerfectDay(habits: Habit[], date: string): boolean {
  return habits.length > 0 && habits.every((h) => h.marks[date] === 2)
}

/** True when every given habit was fully done on all 7 days ending at (and including) `endDate`. */
export function isPerfectWeek(habits: Habit[], endDate: string): boolean {
  if (habits.length === 0) return false
  const end = parseDateStr(endDate)
  for (let i = 0; i < 7; i++) {
    if (!isPerfectDay(habits, toDateStr(addDays(end, -i)))) return false
  }
  return true
}

/** True when every given habit was fully done on every day of that calendar month. */
export function isPerfectMonth(habits: Habit[], month: number, year: number): boolean {
  return habits.length > 0 && monthCompletionPercent(habits, month, year) === 100
}
