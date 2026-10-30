import type { Habit, Course, Plan } from '../types'
import { parseDateStr } from './habits'

/**
 * Whether a habit's linked course or plan (if any) has actually reached its
 * start date yet. A habit with no link, or linked to something with no
 * startDate set, is always "started". Root cause of the notification-spam
 * bug: a freshly linked habit had marks[today] unset, so it looked "due
 * today" in useTodayItems from day one, even when the plan it was linked to
 * hadn't started — showing up in the bell and the daily catch-up popup
 * every day until the plan's start date arrived.
 */
export function isHabitStarted(
  habit: Pick<Habit, 'courseId' | 'planId'>,
  courses: Pick<Course, 'id' | 'startDate'>[],
  plans: Pick<Plan, 'id' | 'startDate'>[],
  today: string
): boolean {
  if (habit.courseId) {
    const course = courses.find((c) => c.id === habit.courseId)
    if (course?.startDate && course.startDate > today) return false
  }
  if (habit.planId) {
    const plan = plans.find((p) => p.id === habit.planId)
    if (plan?.startDate && plan.startDate > today) return false
  }
  return true
}

/**
 * True once at least one full day was skipped between the catch-up popup's
 * last appearance and today — the signal to collapse the missed days into
 * one warm "welcome back" framing instead of the routine daily title.
 */
export function isReturningAfterGap(lastShown: string | null, today: string): boolean {
  if (!lastShown) return false
  const gapDays = Math.round((parseDateStr(today).getTime() - parseDateStr(lastShown).getTime()) / 86_400_000)
  return gapDays >= 2
}
