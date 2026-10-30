import type { AppData } from '../types'
import { scheduleCourse } from './courseScheduler'
import { schedulePlanSteps } from './planScheduler'
import { collectDoneTopicIds } from '../hooks/useTodayItems'

export interface NextUpItem {
  kind: 'courseTopic' | 'planStep'
  title: string
  seconds: number
  startDate: string // YYYY-MM-DD
  href: string
}

/**
 * The single nearest not-done scheduled item across every course and plan
 * that has a schedule set up — today's if something's due, otherwise the
 * next upcoming one. Picks by earliest startDate (YYYY-MM-DD sorts
 * lexically), so an overdue item surfaces before anything in the future.
 * Home's "Next up" card; null means nothing is scheduled anywhere yet.
 */
export function findNextUpItem(data: Pick<AppData, 'courses' | 'plans'>): NextUpItem | null {
  let best: NextUpItem | null = null

  for (const course of data.courses) {
    if (!course.startDate || !course.hoursPerDay || !course.weekdays?.length) continue
    const schedule = scheduleCourse(course.modules, {
      startDate: course.startDate,
      hoursPerDay: course.hoursPerDay,
      weekdays: course.weekdays,
    })
    const doneTopicIds = collectDoneTopicIds(course.modules)
    for (const item of schedule.items) {
      if (doneTopicIds.has(item.topicId)) continue
      if (!best || item.startDate < best.startDate) {
        best = { kind: 'courseTopic', title: item.name, seconds: item.seconds, startDate: item.startDate, href: `/courses/${course.id}` }
      }
    }
  }

  for (const plan of data.plans) {
    if (!plan.startDate || !plan.hoursPerDay || plan.weekdays.length === 0) continue
    const schedule = schedulePlanSteps(plan.steps, {
      startDate: plan.startDate,
      hoursPerDay: plan.hoursPerDay,
      weekdays: plan.weekdays,
    })
    const doneIds = new Set(plan.steps.filter((s) => s.done).map((s) => s.id))
    for (const item of schedule.items) {
      if (doneIds.has(item.stepId)) continue
      if (!best || item.startDate < best.startDate) {
        best = { kind: 'planStep', title: item.title, seconds: item.seconds, startDate: item.startDate, href: '/roadmap' }
      }
    }
  }

  return best
}
