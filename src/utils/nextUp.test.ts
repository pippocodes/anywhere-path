import { describe, it, expect } from 'vitest'
import { findNextUpItem } from './nextUp'
import type { Course, Plan, PlanStep } from '../types'

function plan(overrides: Partial<Plan> = {}): Plan {
  return {
    id: 'p1',
    title: 'Plan',
    categoryId: null,
    sourceType: 'custom',
    sourceCourseId: null,
    steps: [],
    startDate: '2024-01-10',
    days: 14,
    hoursPerDay: 1,
    weekdays: [0, 1, 2, 3, 4, 5, 6],
    createdAt: '',
    updatedAt: '',
    ...overrides,
  }
}

function step(overrides: Partial<PlanStep> = {}): PlanStep {
  return { id: 's1', title: 'Step', estimatedSeconds: 600, done: false, ...overrides }
}

function course(overrides: Partial<Course> = {}): Course {
  return {
    id: 'c1',
    name: 'Course',
    modules: [],
    startDate: '2024-01-10',
    hoursPerDay: 1,
    weekdays: [0, 1, 2, 3, 4, 5, 6],
    ...overrides,
  } as Course
}

describe('findNextUpItem', () => {
  it('returns null when nothing has a schedule set up', () => {
    expect(findNextUpItem({ courses: [course({ startDate: undefined })], plans: [] })).toBeNull()
  })

  it('picks the earliest-starting unfinished item across courses and plans', () => {
    const laterPlan = plan({ id: 'p1', startDate: '2024-02-01', steps: [step({ id: 's1', title: 'Later step' })] })
    const earlierCourse = course({
      id: 'c1',
      startDate: '2024-01-10',
      modules: [{ id: 'm1', name: 'Mod', topics: [{ id: 't1', name: 'Lecture one', hours: 0, done: false, durationSeconds: 300 }] }],
    })
    const result = findNextUpItem({ courses: [earlierCourse], plans: [laterPlan] })
    expect(result).toMatchObject({ kind: 'courseTopic', title: 'Lecture one', seconds: 300, href: '/courses/c1' })
  })

  it('skips already-done steps and topics', () => {
    const p = plan({ steps: [step({ id: 's1', done: true }), step({ id: 's2', title: 'Still open', done: false })] })
    const result = findNextUpItem({ courses: [], plans: [p] })
    expect(result).toMatchObject({ kind: 'planStep', title: 'Still open' })
  })
})
