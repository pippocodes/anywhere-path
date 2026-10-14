import type { PlanStep } from '../types'
import { toDateStr } from './habits'

// Same day-by-day budget-allocation algorithm as scheduler.ts/courseScheduler.ts
// (walk steps in order, spend a day's hour budget at a time, skip non-study
// weekdays) — kept as its own copy since a Plan's steps are already flat,
// so there's no tree to walk and no need to share code across the three.
const MAX_SCHEDULING_ITERATIONS = 20000

export interface PlanScheduleOptions {
  startDate: string // YYYY-MM-DD
  hoursPerDay: number
  weekdays: number[] // 0=Sun..6=Sat
}

export interface ScheduledPlanStep {
  stepId: string
  title: string
  seconds: number
  startDate: string
  endDate: string
}

export interface PlanScheduleResult {
  items: ScheduledPlanStep[]
  finishDate: string | null
  totalSeconds: number
  totalDays: number
}

export function parseDateStr(value: string): Date {
  const [y, m, d] = value.split('-').map(Number)
  return new Date(y, (m || 1) - 1, d || 1)
}

export function addCalendarDays(value: string, days: number): string {
  const d = parseDateStr(value)
  d.setDate(d.getDate() + days)
  return toDateStr(d)
}

function addDays(date: Date, days: number): Date {
  const next = new Date(date)
  next.setDate(next.getDate() + days)
  return next
}

/** How many of the `days` calendar days starting at `startDate` are study days per `weekdays`. */
export function countStudyDays(startDate: string, days: number, weekdays: number[]): number {
  if (days <= 0 || weekdays.length === 0) return 0
  let count = 0
  let cursor = parseDateStr(startDate)
  for (let i = 0; i < days; i++) {
    if (weekdays.includes(cursor.getDay())) count++
    cursor = addDays(cursor, 1)
  }
  return count
}

/** Smallest number of calendar days (from startDate) containing at least `targetStudyDays` qualifying weekdays. */
export function daysToReachStudyDays(startDate: string, targetStudyDays: number, weekdays: number[]): number {
  if (targetStudyDays <= 0) return 0
  if (weekdays.length === 0) return Infinity
  let count = 0
  let cursor = parseDateStr(startDate)
  let days = 0
  let iterations = 0
  while (count < targetStudyDays) {
    if (weekdays.includes(cursor.getDay())) count++
    if (count >= targetStudyDays) break
    cursor = addDays(cursor, 1)
    days++
    iterations++
    if (iterations > MAX_SCHEDULING_ITERATIONS) break
  }
  return days + 1
}

/**
 * Walks a plan's flat step list in order, allocating each step's duration
 * across study days from `startDate`, `hoursPerDay` at a time, skipping any
 * weekday not in `weekdays`. A step's duration can spill across multiple
 * days; a day's leftover budget carries into the next step.
 */
export function schedulePlanSteps(steps: PlanStep[], options: PlanScheduleOptions): PlanScheduleResult {
  const { startDate, hoursPerDay, weekdays } = options

  if (hoursPerDay <= 0 || weekdays.length === 0 || steps.length === 0) {
    return { items: [], finishDate: null, totalSeconds: 0, totalDays: 0 }
  }

  const items: ScheduledPlanStep[] = []
  const usedDays = new Set<string>()

  let cursor = parseDateStr(startDate)
  let dayBudgetSeconds = hoursPerDay * 3600
  let iterations = 0

  function advanceToValidDay(): void {
    while (!weekdays.includes(cursor.getDay())) {
      cursor = addDays(cursor, 1)
      iterations++
      if (iterations > MAX_SCHEDULING_ITERATIONS) {
        throw new Error('schedulePlanSteps: could not find a valid study day — check the weekday selection.')
      }
    }
  }

  advanceToValidDay()

  for (const step of steps) {
    let secondsLeft = step.estimatedSeconds
    let itemStart: string | null = null
    let itemEnd: string | null = null

    while (secondsLeft > 0) {
      if (dayBudgetSeconds <= 0) {
        cursor = addDays(cursor, 1)
        advanceToValidDay()
        dayBudgetSeconds = hoursPerDay * 3600
      }

      const allocation = Math.min(secondsLeft, dayBudgetSeconds)
      const dateStr = toDateStr(cursor)
      if (itemStart === null) itemStart = dateStr
      itemEnd = dateStr
      usedDays.add(dateStr)
      dayBudgetSeconds -= allocation
      secondsLeft -= allocation

      iterations++
      if (iterations > MAX_SCHEDULING_ITERATIONS) {
        throw new Error('schedulePlanSteps: exceeded the maximum number of scheduling steps.')
      }
    }

    items.push({
      stepId: step.id,
      title: step.title,
      seconds: step.estimatedSeconds,
      startDate: itemStart ?? toDateStr(cursor),
      endDate: itemEnd ?? toDateStr(cursor),
    })
  }

  return {
    items,
    finishDate: items.length > 0 ? items[items.length - 1].endDate : null,
    totalSeconds: items.reduce((sum, item) => sum + item.seconds, 0),
    totalDays: usedDays.size,
  }
}
