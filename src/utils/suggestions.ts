import type { Habit, HabitCategory } from '../types'
import { toDateStr, parseDateStr, computeBestStreak, compareToLastMonth, elapsedCompletionPercent } from './habits'

export type SuggestionType = 'weekend-skip' | 'beat-streak' | 'category-decline' | 'focus-habit'

export interface Suggestion {
  id: string
  type: SuggestionType
  message: string
}

const WEEKEND_DAYS = new Set([0, 6]) // Sun, Sat

function addDays(date: Date, days: number): Date {
  const next = new Date(date)
  next.setDate(next.getDate() + days)
  return next
}

/** Every date from a habit's first mark through `referenceDate`, inclusive — its "active history". */
function historyDates(habit: Habit, referenceDate: Date): string[] {
  const marked = Object.keys(habit.marks).sort()
  if (marked.length === 0) return []
  const start = parseDateStr(marked[0])
  const dates: string[] = []
  for (let d = start; d <= referenceDate; d = addDays(d, 1)) {
    dates.push(toDateStr(d))
  }
  return dates
}

/** "You skip <habit> most on weekends" — the habit with the largest weekend-vs-weekday skip gap. */
function suggestWeekendSkip(habits: Habit[], referenceDate: Date): Suggestion | null {
  let best: { habit: Habit; gap: number } | null = null

  for (const habit of habits) {
    const dates = historyDates(habit, referenceDate)
    const weekend = dates.filter((d) => WEEKEND_DAYS.has(parseDateStr(d).getDay()))
    const weekday = dates.filter((d) => !WEEKEND_DAYS.has(parseDateStr(d).getDay()))
    // Require a meaningful sample on both sides before trusting the pattern.
    if (weekend.length < 4 || weekday.length < 4) continue

    const skipRate = (days: string[]) => days.filter((d) => (habit.marks[d] ?? 0) === 0).length / days.length
    const gap = skipRate(weekend) - skipRate(weekday)
    if (gap >= 0.25 && (!best || gap > best.gap)) best = { habit, gap }
  }

  if (!best) return null
  return {
    id: `weekend-skip-${best.habit.id}`,
    type: 'weekend-skip',
    message: `You skip "${best.habit.name}" most on weekends.`,
  }
}

/** "Your longest streak is N days — beat it" — the active habit with the best-ever streak. */
function suggestBeatStreak(habits: Habit[]): Suggestion | null {
  let best: { habit: Habit; streak: number } | null = null
  for (const habit of habits) {
    const streak = computeBestStreak(habit)
    if (streak >= 3 && (!best || streak > best.streak)) best = { habit, streak }
  }
  if (!best) return null
  return {
    id: `beat-streak-${best.habit.id}`,
    type: 'beat-streak',
    message: `Your longest streak (${best.habit.name}) is ${best.streak} days — beat it!`,
  }
}

/** "<Category> habits are X% below last month" — the category with the sharpest decline. */
function suggestCategoryDecline(
  habits: Habit[],
  categories: HabitCategory[],
  referenceDate: Date
): Suggestion | null {
  let worst: { category: HabitCategory; delta: number } | null = null

  for (const category of categories.filter((c) => !c.archived)) {
    const categoryHabits = habits.filter((h) => h.categoryId === category.id)
    if (categoryHabits.length === 0) continue
    const { lastMonthPercent, deltaPercent } = compareToLastMonth(categoryHabits, referenceDate)
    if (lastMonthPercent <= 0) continue // nothing to compare against yet
    if (deltaPercent <= -10 && (!worst || deltaPercent < worst.delta)) worst = { category, delta: deltaPercent }
  }

  if (!worst) return null
  return {
    id: `category-decline-${worst.category.id}`,
    type: 'category-decline',
    message: `${worst.category.name} habits are ${Math.abs(worst.delta)}% below last month.`,
  }
}

/** "Consider focusing on <habit>" — the active habit furthest behind so far this month. */
function suggestFocusHabit(habits: Habit[], referenceDate: Date): Suggestion | null {
  const dayOfMonth = referenceDate.getDate()
  if (dayOfMonth < 5) return null // too early in the month for this to mean anything

  const year = referenceDate.getFullYear()
  const month = referenceDate.getMonth()

  let worst: { habit: Habit; percent: number } | null = null
  for (const habit of habits) {
    const percent = elapsedCompletionPercent([habit], year, month, dayOfMonth)
    if (percent < 50 && (!worst || percent < worst.percent)) worst = { habit, percent }
  }

  if (!worst) return null
  return {
    id: `focus-habit-${worst.habit.id}`,
    type: 'focus-habit',
    message: `Consider focusing on "${worst.habit.name}" — it's your least consistent habit this month.`,
  }
}

/**
 * Deterministic, rule-based habit suggestions from the user's own data — no
 * AI involved. Always returns the same suggestions for the same inputs and
 * reference date, in a fixed rule order, with at most one suggestion per
 * rule so the list stays short and worth reading.
 */
export function generateSuggestions(
  habits: Habit[],
  categories: HabitCategory[],
  referenceDate: Date = new Date()
): Suggestion[] {
  const active = habits.filter((h) => !h.archived)

  return [
    suggestWeekendSkip(active, referenceDate),
    suggestBeatStreak(active),
    suggestCategoryDecline(active, categories, referenceDate),
    suggestFocusHabit(active, referenceDate),
  ].filter((s): s is Suggestion => s !== null)
}
