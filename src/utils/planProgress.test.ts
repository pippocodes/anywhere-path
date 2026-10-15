import { describe, it, expect } from 'vitest'
import { computePlanProgress } from './planProgress'

describe('computePlanProgress', () => {
  it('returns 0 for a plan with no steps', () => {
    expect(computePlanProgress({ steps: [] })).toBe(0)
  })

  it('rounds the percent of done steps', () => {
    const steps = [
      { id: '1', title: 'a', estimatedSeconds: 1, done: true },
      { id: '2', title: 'b', estimatedSeconds: 1, done: false },
      { id: '3', title: 'c', estimatedSeconds: 1, done: false },
    ]
    expect(computePlanProgress({ steps })).toBe(33)
  })

  it('returns 100 when every step is done', () => {
    const steps = [{ id: '1', title: 'a', estimatedSeconds: 1, done: true }]
    expect(computePlanProgress({ steps })).toBe(100)
  })
})
