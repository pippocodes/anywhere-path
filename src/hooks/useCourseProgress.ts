import { useMemo } from 'react'
import type { Course, CourseModule } from '../types'

export interface Progress {
  done: number
  total: number
  percent: number
}

function progressOf(topics: { done: boolean }[]): Progress {
  const total = topics.length
  const done = topics.filter((t) => t.done).length
  return { done, total, percent: total === 0 ? 0 : Math.round((done / total) * 100) }
}

export function useCourseProgress(course: Course): Progress {
  return useMemo(() => progressOf(course.modules.flatMap((m) => m.topics)), [course])
}

export function useModuleProgress(courseModule: CourseModule): Progress {
  return useMemo(() => progressOf(courseModule.topics), [courseModule])
}
