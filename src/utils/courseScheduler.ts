import type { CourseModule, Topic } from '../types'
import { getTopicSeconds } from './duration'
import { toDateStr } from './habits'

// Parallel to scheduler.ts's scheduleOutline(), targeting Course/CourseModule/Topic
// instead of RoadmapDoc/OutlineNode — scheduleOutline() and this never share
// a tree shape, so this is a separate implementation rather than a generic
// one, but the algorithm (walk leaves in order, allocate a day's budget at a
// time, skip non-study weekdays) is intentionally identical.
const MAX_SCHEDULING_ITERATIONS = 20000

export interface CourseScheduleOptions {
  startDate: string // YYYY-MM-DD
  hoursPerDay: number
  weekdays: number[] // 0=Sun..6=Sat
}

export interface ScheduledTopic {
  topicId: string
  name: string
  path: string[] // ancestor module names, outermost first
  seconds: number
  startDate: string
  endDate: string
}

export interface CourseScheduleResult {
  items: ScheduledTopic[]
  finishDate: string | null
  totalSeconds: number
  totalDays: number
}

function parseDateStr(value: string): Date {
  const [y, m, d] = value.split('-').map(Number)
  return new Date(y, (m || 1) - 1, d || 1)
}

function addDays(date: Date, days: number): Date {
  const next = new Date(date)
  next.setDate(next.getDate() + days)
  return next
}

/**
 * Walks a course's module tree depth-first (a module's own lectures before
 * its nested sub-modules), allocating each lecture's duration across study
 * days from `startDate`, `hoursPerDay` at a time, skipping any weekday not
 * in `weekdays`. A lecture's duration can spill across multiple days; a
 * day's leftover budget carries into the next lecture.
 */
export function scheduleCourse(modules: CourseModule[], options: CourseScheduleOptions): CourseScheduleResult {
  const { startDate, hoursPerDay, weekdays } = options

  if (hoursPerDay <= 0 || weekdays.length === 0 || modules.length === 0) {
    return { items: [], finishDate: null, totalSeconds: 0, totalDays: 0 }
  }

  const items: ScheduledTopic[] = []
  const usedDays = new Set<string>()

  let cursor = parseDateStr(startDate)
  let dayBudgetSeconds = hoursPerDay * 3600
  let iterations = 0

  function advanceToValidDay(): void {
    while (!weekdays.includes(cursor.getDay())) {
      cursor = addDays(cursor, 1)
      iterations++
      if (iterations > MAX_SCHEDULING_ITERATIONS) {
        throw new Error('scheduleCourse: could not find a valid study day — check the weekday selection.')
      }
    }
  }

  advanceToValidDay()

  function visitTopic(topic: Topic, path: string[]): void {
    let secondsLeft = getTopicSeconds(topic)
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
        throw new Error('scheduleCourse: exceeded the maximum number of scheduling steps.')
      }
    }

    items.push({
      topicId: topic.id,
      name: topic.name,
      path,
      seconds: getTopicSeconds(topic),
      startDate: itemStart ?? toDateStr(cursor),
      endDate: itemEnd ?? toDateStr(cursor),
    })
  }

  function visitModule(module: CourseModule, path: string[]): void {
    const nextPath = [...path, module.name]
    for (const topic of module.topics) visitTopic(topic, nextPath)
    for (const child of module.modules ?? []) visitModule(child, nextPath)
  }

  modules.forEach((m) => visitModule(m, []))

  return {
    items,
    finishDate: items.length > 0 ? items[items.length - 1].endDate : null,
    totalSeconds: items.reduce((sum, item) => sum + item.seconds, 0),
    totalDays: usedDays.size,
  }
}

export function buildCourseScheduleIndex(items: ScheduledTopic[]): Map<string, ScheduledTopic> {
  return new Map(items.map((item) => [item.topicId, item]))
}
