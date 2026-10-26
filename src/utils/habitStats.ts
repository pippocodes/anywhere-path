import type { Habit } from '../types.js'
import { daysInMonth, isPerfectDay, monthDates, parseDateStr, toDateStr, yearlyCompletion } from './habits.js'

const WEEKDAY_LABELS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa']

/** One completion percentage per day of the given month — the daily-completion chart's series. */
export function dailyCompletionSeries(habits: Habit[], month: number, year: number) {
  const dates = monthDates(month, year)
  return dates.map((date, i) => {
    if (habits.length === 0) return { day: i + 1, date, percent: 0 }
    const earned = habits.reduce((sum, h) => sum + (h.marks[date] ?? 0) / 2, 0)
    return { day: i + 1, date, percent: Math.round((earned / habits.length) * 100) }
  })
}

/** Completion percentage per habit for the given month — the per-habit bar chart's series. */
export function perHabitCompletion(habits: Habit[], month: number, year: number) {
  const dates = monthDates(month, year)
  return habits.map((h) => {
    const earned = dates.reduce((sum, d) => sum + (h.marks[d] ?? 0) / 2, 0)
    return { habit: h, percent: dates.length === 0 ? 0 : Math.round((earned / dates.length) * 100) }
  })
}

/** Average completion percentage per weekday across the given month — the weekday-pattern chart's series. */
export function weekdayPattern(habits: Habit[], month: number, year: number) {
  const dates = monthDates(month, year)
  const totals = Array.from({ length: 7 }, () => ({ earned: 0, count: 0 }))

  for (const date of dates) {
    const weekday = parseDateStr(date).getDay()
    for (const h of habits) {
      totals[weekday].earned += (h.marks[date] ?? 0) / 2
      totals[weekday].count++
    }
  }

  return WEEKDAY_LABELS.map((label, i) => ({
    weekday: i,
    label,
    percent: totals[i].count === 0 ? 0 : Math.round((totals[i].earned / totals[i].count) * 100),
  }))
}

/** Count of fully-perfect days (every habit done) in the given month. */
export function countPerfectDays(habits: Habit[], month: number, year: number): number {
  return monthDates(month, year).filter((d) => isPerfectDay(habits, d)).length
}

export interface HeatmapDay {
  date: string
  count: number // sum of mark values (0/1/2) across all habits that day
  maxCount: number // habits.length * 2, for intensity normalization
}

/** One entry per day of the given year — the GitHub-style contribution heatmap's data. */
export function yearHeatmapData(habits: Habit[], year: number): HeatmapDay[] {
  const days: HeatmapDay[] = []
  for (let month = 0; month < 12; month++) {
    const count = daysInMonth(month, year)
    for (let d = 1; d <= count; d++) {
      const date = toDateStr(new Date(year, month, d))
      const sum = habits.reduce((s, h) => s + (h.marks[date] ?? 0), 0)
      days.push({ date, count: sum, maxCount: habits.length * 2 })
    }
  }
  return days
}

/** The single best-performing month of the year, or null if every month is at 0%. */
export function bestMonthOfYear(habits: Habit[], year: number): { month: number; percent: number } | null {
  const monthly = yearlyCompletion(habits, year)
  let best = { month: 0, percent: monthly[0] }
  for (let i = 1; i < monthly.length; i++) {
    if (monthly[i] > best.percent) best = { month: i, percent: monthly[i] }
  }
  return best.percent > 0 ? best : null
}

/** Total number of non-empty ticks (partial + done) logged across the given year. */
export function totalTicksInYear(habits: Habit[], year: number): number {
  let total = 0
  for (const h of habits) {
    for (const date in h.marks) {
      if (date.startsWith(String(year)) && h.marks[date] > 0) total++
    }
  }
  return total
}

/** Total number of non-empty ticks (partial + done) logged across the given month — the Month tab's "Check-ins" stat. */
export function totalTicksInMonth(habits: Habit[], month: number, year: number): number {
  const dates = new Set(monthDates(month, year))
  let total = 0
  for (const h of habits) {
    for (const date in h.marks) {
      if (dates.has(date) && h.marks[date] > 0) total++
    }
  }
  return total
}

/** Yearly completion percentage for one category's habits — for the per-category yearly rings. */
export function categoryYearlyPercent(habits: Habit[], year: number): number {
  const monthly = yearlyCompletion(habits, year)
  if (monthly.length === 0) return 0
  return Math.round(monthly.reduce((a, b) => a + b, 0) / monthly.length)
}
