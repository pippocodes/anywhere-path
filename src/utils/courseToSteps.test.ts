import { describe, it, expect } from 'vitest'
import { courseToSteps } from './courseToSteps'
import type { Course } from '../types'

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
    expect(steps[0]).toMatchObject({ title: 'Skeletal System / Bones of the arm', estimatedSeconds: 322, done: false })
    expect(steps[1]).toMatchObject({ title: 'Skeletal System / Bones of the leg', estimatedSeconds: 430 })
    expect(steps[2]).toMatchObject({ title: 'Muscular System / Upper Body / Biceps', estimatedSeconds: 100 })
  })

  it('returns an empty list for a course with no modules', () => {
    expect(courseToSteps({ modules: [] })).toEqual([])
  })
})
