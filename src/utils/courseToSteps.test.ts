import { describe, it, expect } from 'vitest'
import { courseToSteps, groupStepsByModule } from './courseToSteps'
import type { Course, PlanStep } from '../types'

describe('courseToSteps', () => {
  it('flattens a nested subtopic/module tree into a flat step list with joined-path titles', () => {
    const course: Pick<Course, 'modules'> = {
      modules: [
        {
          id: 'sub1',
          name: 'Skeletal System',
          topics: [
            { id: 't1', name: 'Bones of the arm', hours: 0, done: false, durationSeconds: 322 },
            { id: 't2', name: 'Bones of the leg', hours: 0, done: false, durationSeconds: 430 },
          ],
        },
        {
          id: 'sub2',
          name: 'Muscular System',
          topics: [],
          modules: [
            {
              id: 'mod1',
              name: 'Upper Body',
              topics: [{ id: 't3', name: 'Biceps', hours: 0, done: false, durationSeconds: 100 }],
            },
          ],
        },
      ],
    }

    const steps = courseToSteps(course)
    expect(steps).toHaveLength(3)
    expect(steps[0]).toMatchObject({ title: 'Skeletal System / Bones of the arm', estimatedSeconds: 322, done: false, moduleTitle: 'Skeletal System' })
    expect(steps[1]).toMatchObject({ title: 'Skeletal System / Bones of the leg', estimatedSeconds: 430, moduleTitle: 'Skeletal System' })
    expect(steps[2]).toMatchObject({ title: 'Muscular System / Upper Body / Biceps', estimatedSeconds: 100, moduleTitle: 'Muscular System / Upper Body' })
  })

  it('returns an empty list for a course with no modules', () => {
    expect(courseToSteps({ modules: [] })).toEqual([])
  })
})

function step(overrides: Partial<PlanStep> = {}): PlanStep {
  return { id: 's', title: 'Step', estimatedSeconds: 60, done: false, ...overrides }
}

describe('groupStepsByModule', () => {
  it('buckets consecutive steps that share a moduleTitle into one group', () => {
    const steps = [
      step({ id: 'a', moduleTitle: 'Skeletal System' }),
      step({ id: 'b', moduleTitle: 'Skeletal System' }),
      step({ id: 'c', moduleTitle: 'Muscular System / Upper Body' }),
    ]
    const groups = groupStepsByModule(steps)
    expect(groups).toHaveLength(2)
    expect(groups[0].moduleTitle).toBe('Skeletal System')
    expect(groups[0].steps.map((s) => s.id)).toEqual(['a', 'b'])
    expect(groups[1].moduleTitle).toBe('Muscular System / Upper Body')
    expect(groups[1].steps.map((s) => s.id)).toEqual(['c'])
  })

  it('gives every step without a moduleTitle its own ungrouped bucket', () => {
    const steps = [step({ id: 'a' }), step({ id: 'b' })]
    const groups = groupStepsByModule(steps)
    expect(groups).toHaveLength(2)
    expect(groups.every((g) => g.moduleTitle === null)).toBe(true)
  })

  it('starts a new group when the same moduleTitle reappears non-consecutively', () => {
    const steps = [
      step({ id: 'a', moduleTitle: 'A' }),
      step({ id: 'b', moduleTitle: 'B' }),
      step({ id: 'c', moduleTitle: 'A' }),
    ]
    expect(groupStepsByModule(steps)).toHaveLength(3)
  })
})
