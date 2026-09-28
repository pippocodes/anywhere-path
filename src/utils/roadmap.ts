import type { Course } from '../types'

export function calculateTotalHours(course: Course): number {
  return course.modules.reduce(
    (sum, mod) => sum + mod.topics.reduce((s, t) => s + t.hours, 0),
    0
  )
}

export interface Feasibility {
  feasible: boolean
  totalHours: number
  availableHours: number
  requiredDailyHours: number
  requiredDays: number
}

export function checkFeasibility(
  totalHours: number,
  targetDays: number,
  dailyHours: number
): Feasibility {
  const availableHours = targetDays * dailyHours
  return {
    feasible: availableHours >= totalHours,
    totalHours,
    availableHours,
    requiredDailyHours: Math.ceil((totalHours / targetDays) * 10) / 10,
    requiredDays: Math.ceil(totalHours / dailyHours),
  }
}

export function targetDateFromDays(days: number): string {
  const d = new Date()
  d.setDate(d.getDate() + days)
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}
