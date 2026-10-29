import type { Course, CourseModule, Habit, Plan } from '../types'
import { computeCurrentStreak, toDateStr } from './habits'

export type PostSuggestionRule =
  | 'course-finished'
  | 'module-finished'
  | 'streak-7'
  | 'streak-30'
  | 'plan-completed'
  | 'comeback'
  | 'strong-week'

export interface PostSuggestion {
  // Stable across re-evaluations of the SAME achievement (e.g. the same
  // finished course) — used to remember "already suggested this one" so a
  // long-since-finished course doesn't resurface every day forever.
  id: string
  rule: PostSuggestionRule
  draft: string
}

function addDays(date: Date, days: number): Date {
  const next = new Date(date)
  next.setDate(next.getDate() + days)
  return next
}

/** The Monday on/before `date` — used to key the "strong week" suggestion so it fires once per calendar week, not once per qualifying day. */
function mondayOf(date: Date): string {
  const day = date.getDay() // 0=Sun..6=Sat
  const diffToMonday = day === 0 ? -6 : 1 - day
  return toDateStr(addDays(date, diffToMonday))
}

function countTopics(module: CourseModule): { total: number; done: number } {
  let total = module.topics.length
  let done = module.topics.filter((t) => t.done).length
  for (const child of module.modules ?? []) {
    const childCount = countTopics(child)
    total += childCount.total
    done += childCount.done
  }
  return { total, done }
}

/** "You finished a course!" — every topic (including nested sub-modules) is done, and there's at least one topic. */
function suggestCourseFinished(courses: Course[]): PostSuggestion | null {
  for (const course of courses) {
    const { total, done } = course.modules.reduce(
      (sum, m) => {
        const c = countTopics(m)
        return { total: sum.total + c.total, done: sum.done + c.done }
      },
      { total: 0, done: 0 }
    )
    if (total > 0 && done === total) {
      return {
        id: `course-finished:${course.id}`,
        rule: 'course-finished',
        draft: `Just finished "${course.name}"! 🎓`,
      }
    }
  }
  return null
}

/** "You finished a module!" — a leaf module (no sub-modules) is fully done, but its course as a whole isn't (otherwise "course finished" already covers it). */
function suggestModuleFinished(courses: Course[]): PostSuggestion | null {
  for (const course of courses) {
    const courseTotals = course.modules.reduce(
      (sum, m) => {
        const c = countTopics(m)
        return { total: sum.total + c.total, done: sum.done + c.done }
      },
      { total: 0, done: 0 }
    )
    if (courseTotals.total === 0 || courseTotals.done === courseTotals.total) continue

    const stack: CourseModule[] = [...course.modules]
    while (stack.length > 0) {
      const module = stack.shift()!
      const children = module.modules ?? []
      if (children.length === 0) {
        if (module.topics.length > 0 && module.topics.every((t) => t.done)) {
          return {
            id: `module-finished:${course.id}:${module.id}`,
            rule: 'module-finished',
            draft: `Just finished the "${module.name}" module in "${course.name}"! 📘`,
          }
        }
      } else {
        stack.push(...children)
      }
    }
  }
  return null
}

/** A streak reached exactly `target` days today (not ">= target", so it fires once, the day the streak hits that number, not every day after). */
function suggestStreakMilestone(habits: Habit[], referenceDate: Date, target: 7 | 30): PostSuggestion | null {
  for (const habit of habits) {
    if (computeCurrentStreak(habit, referenceDate) === target) {
      return {
        id: `streak-${target}:${habit.id}:${toDateStr(referenceDate)}`,
        rule: target === 30 ? 'streak-30' : 'streak-7',
        draft: `${target}-day streak on "${habit.name}"! 🔥`,
      }
    }
  }
  return null
}

/** "You completed a plan!" — every step done, at least one step. */
function suggestPlanCompleted(plans: Plan[]): PostSuggestion | null {
  for (const plan of plans) {
    if (plan.steps.length > 0 && plan.steps.every((s) => s.done)) {
      return {
        id: `plan-completed:${plan.id}`,
        rule: 'plan-completed',
        draft: `Finished my plan "${plan.title}"! ✅`,
      }
    }
  }
  return null
}

/** True if NO active habit has any mark (partial or done) on `date`. */
function isFullyInactive(habits: Habit[], date: string): boolean {
  return habits.every((h) => (h.marks[date] ?? 0) === 0)
}

/**
 * "Welcome back" — today has at least one habit marked, and every one of
 * the 7 days strictly before today was fully inactive across all active
 * habits. Keyed by today's date, so it only ever fires on the comeback day
 * itself: tomorrow, today (now active) falls inside the "7 days before"
 * window, which breaks the all-inactive condition.
 */
function suggestComeback(habits: Habit[], referenceDate: Date): PostSuggestion | null {
  if (habits.length === 0) return null
  const today = toDateStr(referenceDate)
  const todayActive = !isFullyInactive(habits, today)
  if (!todayActive) return null

  for (let i = 1; i <= 7; i++) {
    const date = toDateStr(addDays(referenceDate, -i))
    if (!isFullyInactive(habits, date)) return null
  }

  return {
    id: `comeback:${today}`,
    rule: 'comeback',
    draft: `Back at it after a break — let's go! 💪`,
  }
}

/** The 7 days ending at `referenceDate`, inclusive. */
function trailingWeek(referenceDate: Date): string[] {
  return Array.from({ length: 7 }, (_, i) => toDateStr(addDays(referenceDate, -6 + i)))
}

/**
 * "Strong study week" — at least 85% average completion (partial = half
 * credit, same convention as monthCompletionPercent) across active habits
 * over the trailing 7 days. Keyed by the week's Monday, so a week that
 * stays strong for several days in a row only suggests once.
 */
function suggestStrongWeek(habits: Habit[], referenceDate: Date): PostSuggestion | null {
  if (habits.length === 0) return null
  const dates = trailingWeek(referenceDate)
  let earned = 0
  const total = habits.length * dates.length
  for (const habit of habits) {
    for (const date of dates) {
      earned += (habit.marks[date] ?? 0) / 2
    }
  }
  const percent = total === 0 ? 0 : Math.round((earned / total) * 100)
  if (percent < 85) return null

  return {
    id: `strong-week:${mondayOf(referenceDate)}`,
    rule: 'strong-week',
    draft: `Strong week — ${percent}% completion across my habits! ⭐`,
  }
}

/**
 * Deterministic, rule-based suggestions for what to post about — no AI.
 * Returns at most one, in a fixed priority order (rarest/biggest
 * achievement first): course finished, plan completed, 30-day streak,
 * module finished, 7-day streak, comeback, strong week. Which specific
 * suggestion is already-seen/never-suggest filtering is NOT this
 * function's job — see usePostSuggestion, which wraps this with that
 * local, per-device state.
 */
export function evaluatePostSuggestions(
  data: { courses: Course[]; habits: Habit[]; plans: Plan[] },
  referenceDate: Date = new Date()
): PostSuggestion | null {
  const activeHabits = data.habits.filter((h) => !h.archived)

  return (
    suggestCourseFinished(data.courses) ??
    suggestPlanCompleted(data.plans) ??
    suggestStreakMilestone(activeHabits, referenceDate, 30) ??
    suggestModuleFinished(data.courses) ??
    suggestStreakMilestone(activeHabits, referenceDate, 7) ??
    suggestComeback(activeHabits, referenceDate) ??
    suggestStrongWeek(activeHabits, referenceDate) ??
    null
  )
}
