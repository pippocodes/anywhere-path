// Builds the aggregated stats payload sent to /api/habit-insights. Kept
// framework-free and imported by both the client (to build the request
// body) and api/_lib/habitInsights.ts (for the shared type) — see
// tsconfig.api.json's `include`. Deliberately only ever includes habit
// names, category names, and numeric stats — never notes, emails, or
// friends' data, since this is the only data that reaches the model.
import type { Habit, HabitCategory } from '../types.js'
import { computeCurrentStreak, computeBestStreak, compareToLastMonth, monthCompletionPercent, toDateStr } from './habits.js'
import { weekdayPattern, countPerfectDays } from './habitStats.js'

export const MIN_DAYS_OF_DATA = 3
const MAX_HABITS_SENT = 20

export interface HabitInsightInput {
  name: string
  category: string | null
  currentStreak: number
  bestStreak: number
  monthCompletionPercent: number
  monthDeltaPercent: number
}

export interface HabitInsightStats {
  referenceDate: string
  daysOfData: number
  overallMonthPercent: number
  overallMonthDeltaPercent: number
  bestCurrentStreak: number
  perfectDaysThisMonth: number
  weekdayPattern: { label: string; percent: number }[]
  habits: HabitInsightInput[]
}

/** Count of distinct dates the user has touched across any habit — a proxy for "how much tracking history exists yet." */
export function daysOfData(habits: Habit[]): number {
  const dates = new Set<string>()
  for (const h of habits) {
    for (const date of Object.keys(h.marks)) dates.add(date)
  }
  return dates.size
}

export function hasEnoughDataForInsights(habits: Habit[]): boolean {
  return daysOfData(habits.filter((h) => !h.archived)) >= MIN_DAYS_OF_DATA
}

/** Aggregates one user's active habits into the stats payload the AI insights endpoint consumes. */
export function buildHabitInsightStats(habits: Habit[], categories: HabitCategory[], referenceDate: Date): HabitInsightStats {
  const active = habits.filter((h) => !h.archived)
  const categoryName = new Map(categories.map((c) => [c.id, c.name]))
  const month = referenceDate.getMonth()
  const year = referenceDate.getFullYear()
  const overall = compareToLastMonth(active, referenceDate)

  const habitInputs: HabitInsightInput[] = active.slice(0, MAX_HABITS_SENT).map((h) => ({
    name: h.name.slice(0, 80),
    category: h.categoryId ? (categoryName.get(h.categoryId) ?? null) : null,
    currentStreak: computeCurrentStreak(h, referenceDate),
    bestStreak: computeBestStreak(h),
    monthCompletionPercent: monthCompletionPercent([h], month, year),
    monthDeltaPercent: compareToLastMonth([h], referenceDate).deltaPercent,
  }))

  return {
    referenceDate: toDateStr(referenceDate),
    daysOfData: daysOfData(active),
    overallMonthPercent: overall.thisMonthPercent,
    overallMonthDeltaPercent: overall.deltaPercent,
    bestCurrentStreak: active.reduce((max, h) => Math.max(max, computeCurrentStreak(h, referenceDate)), 0),
    perfectDaysThisMonth: countPerfectDays(active, month, year),
    weekdayPattern: weekdayPattern(active, month, year).map(({ label, percent }) => ({ label, percent })),
    habits: habitInputs,
  }
}
