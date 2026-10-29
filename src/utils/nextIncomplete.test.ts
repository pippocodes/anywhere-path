import { describe, it, expect } from 'vitest'
import { findNextIncompleteTopic, findNextIncompletePlanStep, findModuleIdForTopic } from './nextIncomplete'
import type { Course, Plan } from '../types'

describe('findNextIncompleteTopic', () => {
  it('finds the first not-done topic depth-first, skipping done ones', () => {
    const course: Pick<Course, 'modules'> = {
      modules: [
        {
          id: 'sub1',
          name: 'Skeletal System',
          topics: [
            { id: 't1', name: 'Bones of the arm', hours: 0, done: true },
            { id: 't2', name: 'Bones of the leg', hours: 0, done: false },
          ],
        },
        {
          id: 'sub2',
          name: 'Muscular System',
          topics: [],
          modules: [{ id: 'mod1', name: 'Upper Body', topics: [{ id: 't3', name: 'Biceps', hours: 0, done: false }] }],
        },
      ],
    }
    expect(findNextIncompleteTopic(course)).toEqual({ moduleId: 'sub1', topicId: 't2', title: 'Bones of the leg' })
  })

  it('returns null when every topic is done', () => {
    const course: Pick<Course, 'modules'> = {
      modules: [{ id: 'sub1', name: 'A', topics: [{ id: 't1', name: 'X', hours: 0, done: true }] }],
    }
    expect(findNextIncompleteTopic(course)).toBeNull()
  })
})

describe('findModuleIdForTopic', () => {
  const course: Pick<Course, 'modules'> = {
    modules: [
      {
        id: 'sub1',
        name: 'Skeletal System',
        topics: [
          { id: 't1', name: 'Bones of the arm', hours: 0, done: true },
          { id: 't2', name: 'Bones of the leg', hours: 0, done: false },
        ],
      },
      {
        id: 'sub2',
        name: 'Muscular System',
        topics: [],
        modules: [{ id: 'mod1', name: 'Upper Body', topics: [{ id: 't3', name: 'Biceps', hours: 0, done: false }] }],
      },
    ],
  }

  it('finds the module that directly holds a top-level topic', () => {
    expect(findModuleIdForTopic(course, 't2')).toBe('sub1')
  })

  it('finds the module that holds a topic nested inside a sub-module', () => {
    expect(findModuleIdForTopic(course, 't3')).toBe('mod1')
  })

  it('returns null for a topic id that does not exist anywhere', () => {
    expect(findModuleIdForTopic(course, 'nope')).toBeNull()
  })
})

describe('findNextIncompletePlanStep', () => {
  it('finds the first not-done step', () => {
    const plan: Pick<Plan, 'steps'> = {
      steps: [
        { id: 's1', title: 'Draft outline', estimatedSeconds: 100, done: true },
        { id: 's2', title: 'Write intro', estimatedSeconds: 100, done: false },
      ],
    }
    expect(findNextIncompletePlanStep(plan)).toEqual({ stepId: 's2', title: 'Write intro' })
  })

  it('returns null when every step is done or there are no steps', () => {
    expect(findNextIncompletePlanStep({ steps: [] })).toBeNull()
    expect(findNextIncompletePlanStep({ steps: [{ id: 's1', title: 'X', estimatedSeconds: 1, done: true }] })).toBeNull()
  })
})
