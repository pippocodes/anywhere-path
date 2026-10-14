import { describe, it, expect } from 'vitest'
import type { Course, Topic } from '../types'
import { computeCourseStats } from './courseStats'
import { formatDuration, parseDuration } from './duration'

function topic(name: string, durationSeconds: number, done = false): Topic {
  return { id: name, name, hours: durationSeconds / 3600, done, durationSeconds }
}

describe('computeCourseStats', () => {
  it('rolls up total/watched/remaining seconds and lecture counts across modules', () => {
    const course: Course = {
      id: 'c1',
      name: 'Test Course',
      modules: [
        {
          id: 'm1',
          name: 'Section 1',
          topics: [topic('Intro to Arrays', parseDuration('5:22')!, true), topic('Linked Lists', parseDuration('12:07')!, false)],
        },
        {
          id: 'm2',
          name: 'Section 2',
          topics: [topic('Trees', parseDuration('1:03:45')!, true)],
        },
      ],
    }

    const stats = computeCourseStats(course)

    // Exactly the example from the Course Tracker spec: 5:22 + 12:07 + 1:03:45 = 1:21:14
    expect(stats.totalSeconds).toBe(4874)
    expect(formatDuration(stats.totalSeconds)).toBe('1:21:14')

    expect(stats.watchedSeconds).toBe(322 + 3825) // Intro to Arrays + Trees
    expect(stats.remainingSeconds).toBe(727) // Linked Lists
    expect(stats.lecturesDone).toBe(2)
    expect(stats.lecturesTotal).toBe(3)
    expect(stats.percent).toBe(Math.round(((322 + 3825) / 4874) * 100))
  })

  it('returns zeros for a course with no lectures yet', () => {
    const stats = computeCourseStats({ modules: [] })
    expect(stats).toEqual({
      totalSeconds: 0,
      watchedSeconds: 0,
      remainingSeconds: 0,
      lecturesDone: 0,
      lecturesTotal: 0,
      percent: 0,
    })
  })

  it('falls back to the legacy hours field for a topic with no durationSeconds', () => {
    const course: Course = {
      id: 'c2',
      name: 'Legacy Course',
      modules: [{ id: 'm1', name: 'Section', topics: [{ id: 't1', name: 'Old Topic', hours: 2, done: false }] }],
    }
    expect(computeCourseStats(course).totalSeconds).toBe(7200)
  })
})
