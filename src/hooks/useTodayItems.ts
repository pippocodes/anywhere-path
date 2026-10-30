import { useMemo } from 'react'
import { useApp } from './useApp'
import { useAuth } from '../context/AuthContext'
import { useSharedItems } from './useSharedItems'
import { toDateStr } from '../utils/habits'
import { schedulePlanSteps } from '../utils/planScheduler'
import { scheduleCourse } from '../utils/courseScheduler'
import { scheduleOutline } from '../utils/scheduler'
import { parseOutline } from '../utils/outlineParser'
import { isDueToday } from '../utils/dueToday'
import { stateFor } from '../utils/sharedTracking'
import { collectDoneTopicIds } from '../utils/nextIncomplete'
import { isHabitStarted } from '../utils/reminders'

export type TodayItemKind = 'habit' | 'planStep' | 'courseTopic' | 'roadmapStep' | 'sharedItem'

export interface TodayItem {
  kind: TodayItemKind
  id: string
  title: string
  href: string
}

/**
 * Aggregates everything "due today" from data that's already loaded — habit
 * marks, plan/course/roadmap-outline schedules, shared-tracker logs — with
 * no extra fetches or backend state of its own. Computed fresh on every
 * render via useMemo rather than cached, since these schedulers are cheap
 * pure functions over data already in memory.
 */
export function useTodayItems(): TodayItem[] {
  const { data } = useApp()
  const { user } = useAuth()
  const { items: sharedItems } = useSharedItems()

  return useMemo(() => {
    if (!user) return []
    const today = toDateStr(new Date())
    const result: TodayItem[] = []

    for (const habit of data.habits) {
      if (habit.archived) continue
      if (!isHabitStarted(habit, data.courses, data.plans, today)) continue
      if ((habit.marks[today] ?? 0) !== 2) {
        result.push({ kind: 'habit', id: habit.id, title: habit.name, href: '/habits' })
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
        if (isDueToday(item, today)) {
          result.push({ kind: 'planStep', id: `${plan.id}:${item.stepId}`, title: item.title, href: '/roadmap' })
        }
      }
    }

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
        if (isDueToday(item, today)) {
          result.push({
            kind: 'courseTopic',
            id: `${course.id}:${item.topicId}`,
            title: item.name,
            href: `/courses/${course.id}`,
          })
        }
      }
    }

    for (const doc of data.roadmapDocs) {
      if (!doc.startDate || !doc.hoursPerDay || !doc.weekdays?.length) continue
      const parsed = parseOutline(doc.outlineText)
      if (parsed.errors.length > 0 || parsed.nodes.length === 0) continue
      const schedule = scheduleOutline(parsed.nodes, {
        startDate: doc.startDate,
        hoursPerDay: doc.hoursPerDay,
        weekdays: doc.weekdays,
      })
      const completed = new Set(doc.completedPaths ?? [])
      for (const item of schedule.items) {
        if (completed.has(item.nodeId)) continue
        if (isDueToday(item, today)) {
          result.push({
            kind: 'roadmapStep',
            id: `${doc.id}:${item.nodeId}`,
            title: item.name,
            href: `/roadmap/${doc.id}`,
          })
        }
      }
    }

    for (const detail of sharedItems) {
      if (detail.myStatus !== 'owner' && detail.myStatus !== 'accepted') continue
      if (stateFor(detail.logs, user.id, today) !== 2) {
        result.push({
          kind: 'sharedItem',
          id: detail.item.id,
          title: detail.item.title,
          href: '/habits#shared-trackers',
        })
      }
    }

    return result
  }, [data, user, sharedItems])
}
