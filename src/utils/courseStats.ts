import type { Course, CourseModule, Topic } from '../types'
import { getTopicSeconds } from './duration'

export interface CourseStats {
  totalSeconds: number
  watchedSeconds: number
  remainingSeconds: number
  lecturesDone: number
  lecturesTotal: number
  percent: number // 0-100, by watched time
}

/** Rolls up a course's lecture durations/watched-state into the numbers the summary row and progress ring need. */
export function computeCourseStats(course: Pick<Course, 'modules'>): CourseStats {
  const topics = course.modules.flatMap((m) => m.topics)

  let totalSeconds = 0
  let watchedSeconds = 0
  let lecturesDone = 0

  for (const t of topics) {
    const seconds = getTopicSeconds(t)
    totalSeconds += seconds
    if (t.done) {
      watchedSeconds += seconds
      lecturesDone++
    }
  }

  return {
    totalSeconds,
    watchedSeconds,
    remainingSeconds: totalSeconds - watchedSeconds,
    lecturesDone,
    lecturesTotal: topics.length,
    percent: totalSeconds > 0 ? Math.round((watchedSeconds / totalSeconds) * 100) : 0,
  }
}

/** Same rollup, scoped to one module/section — used for each section's own mini progress bar. */
export function computeModuleStats(module: Pick<CourseModule, 'topics'>): CourseStats {
  return computeCourseStats({ modules: [module as CourseModule] })
}

export function sumSeconds(topics: Pick<Topic, 'durationSeconds' | 'hours'>[]): number {
  return topics.reduce((sum, t) => sum + getTopicSeconds(t), 0)
}
