import { describe, it, expect } from 'vitest'
import { calculateTotalHours, checkFeasibility } from './roadmap'
import type { Course } from '../types'

const course: Course = {
  id: 'c1',
  name: 'Test Course',
  modules: [
    {
      id: 'm1',
      name: 'Module 1',
      topics: [
        { id: 't1', name: 'Topic A', hours: 5, done: false },
        { id: 't2', name: 'Topic B', hours: 3, done: false },
      ],
    },
  ],
}

describe('calculateTotalHours', () => {
  it('sums hours across all modules and topics', () => {
    expect(calculateTotalHours(course)).toBe(8)
  })
})

describe('checkFeasibility', () => {
  it('marks a plan feasible when available hours cover the total', () => {
    const result = checkFeasibility(8, 10, 1)
    expect(result.feasible).toBe(true)
    expect(result.availableHours).toBe(10)
  })

  it('marks a plan infeasible and computes the required pace', () => {
    const result = checkFeasibility(20, 5, 1)
    expect(result.feasible).toBe(false)
    expect(result.requiredDailyHours).toBe(4)
    expect(result.requiredDays).toBe(20)
  })
})
