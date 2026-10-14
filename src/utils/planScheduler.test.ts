import { describe, it, expect } from 'vitest'
import { schedulePlanSteps, countStudyDays, daysToReachStudyDays, addCalendarDays } from './planScheduler'
import type { PlanStep } from '../types'

const ALL_WEEKDAYS = [0, 1, 2, 3, 4, 5, 6]

function step(id: string, title: string, estimatedSeconds: number): PlanStep {
  return { id, title, estimatedSeconds, done: false }
}

describe('schedulePlanSteps', () => {
  it('schedules sequential steps one hour-budget at a time, starting on startDate', () => {
    const result = schedulePlanSteps([step('a', 'A', 2 * 3600), step('b', 'B', 1 * 3600)], {
      startDate: '2024-01-04',
      hoursPerDay: 2,
      weekdays: ALL_WEEKDAYS,
    })
    expect(result.items).toHaveLength(2)
    expect(result.items[0]).toMatchObject({ title: 'A', startDate: '2024-01-04', endDate: '2024-01-04' })
    expect(result.items[1]).toMatchObject({ title: 'B', startDate: '2024-01-05', endDate: '2024-01-05' })
    expect(result.finishDate).toBe('2024-01-05')
    expect(result.totalDays).toBe(2)
  })

  it('spills a single long step across multiple days', () => {
    const result = schedulePlanSteps([step('a', 'Big', 5 * 3600)], {
      startDate: '2024-01-01',
      hoursPerDay: 2,
      weekdays: ALL_WEEKDAYS,
    })
    expect(result.items[0].startDate).toBe('2024-01-01')
    expect(result.items[0].endDate).toBe('2024-01-03')
    expect(result.totalDays).toBe(3)
  })

  it('skips weekend days when only weekdays are selected', () => {
    const steps = [step('a', 'A', 3600), step('b', 'B', 3600), step('c', 'C', 3600)]
    const result = schedulePlanSteps(steps, { startDate: '2024-01-05', hoursPerDay: 1, weekdays: [1, 2, 3, 4, 5] })
    expect(result.items[0].startDate).toBe('2024-01-05') // Fri
    expect(result.items[1].startDate).toBe('2024-01-08') // skips Sat/Sun -> Mon
    expect(result.items[2].startDate).toBe('2024-01-09')
  })

  it('returns an empty, non-crashing result for zero hours/day or no weekdays', () => {
    const steps = [step('a', 'A', 3600)]
    expect(schedulePlanSteps(steps, { startDate: '2024-01-01', hoursPerDay: 0, weekdays: ALL_WEEKDAYS }).items).toEqual([])
    expect(schedulePlanSteps(steps, { startDate: '2024-01-01', hoursPerDay: 2, weekdays: [] }).items).toEqual([])
  })
})

describe('countStudyDays', () => {
  it('counts every day when all weekdays qualify', () => {
    expect(countStudyDays('2024-01-01', 7, ALL_WEEKDAYS)).toBe(7)
  })

  it('counts only qualifying weekdays within the window', () => {
    // 2024-01-01 is a Monday; a 7-day window (Mon..Sun) has 5 weekdays.
    expect(countStudyDays('2024-01-01', 7, [1, 2, 3, 4, 5])).toBe(5)
  })

  it('returns 0 for a non-positive day count or no weekdays', () => {
    expect(countStudyDays('2024-01-01', 0, ALL_WEEKDAYS)).toBe(0)
    expect(countStudyDays('2024-01-01', 7, [])).toBe(0)
  })
})

describe('daysToReachStudyDays', () => {
  it('finds the smallest day count containing N qualifying weekdays', () => {
    // Need 5 weekdays starting Monday 2024-01-01 -> exactly Mon-Fri = 5 calendar days.
    expect(daysToReachStudyDays('2024-01-01', 5, [1, 2, 3, 4, 5])).toBe(5)
    // Need 6 weekdays -> has to skip the weekend, lands on the following Monday = 8 days.
    expect(daysToReachStudyDays('2024-01-01', 6, [1, 2, 3, 4, 5])).toBe(8)
  })

  it('returns 0 for a non-positive target', () => {
    expect(daysToReachStudyDays('2024-01-01', 0, ALL_WEEKDAYS)).toBe(0)
  })
})

describe('addCalendarDays', () => {
  it('adds calendar days across a month boundary', () => {
    expect(addCalendarDays('2024-01-30', 3)).toBe('2024-02-02')
  })
})
