import { describe, it, expect } from 'vitest'
import { isHabitStarted, isReturningAfterGap } from './reminders'

describe('isHabitStarted', () => {
  it('is true for a habit with no course or plan link', () => {
    expect(isHabitStarted({ courseId: null, planId: null }, [], [], '2024-01-10')).toBe(true)
  })

  it('is false when the linked plan has not reached its start date yet', () => {
    const plans = [{ id: 'p1', startDate: '2024-02-01' }]
    expect(isHabitStarted({ courseId: null, planId: 'p1' }, [], plans, '2024-01-10')).toBe(false)
  })

  it('is true once the linked plan start date has arrived', () => {
    const plans = [{ id: 'p1', startDate: '2024-01-10' }]
    expect(isHabitStarted({ courseId: null, planId: 'p1' }, [], plans, '2024-01-10')).toBe(true)
  })

  it('is true once the linked plan start date is in the past', () => {
    const plans = [{ id: 'p1', startDate: '2024-01-01' }]
    expect(isHabitStarted({ courseId: null, planId: 'p1' }, [], plans, '2024-01-10')).toBe(true)
  })

  it('is false when the linked course has not reached its start date yet', () => {
    const courses = [{ id: 'c1', startDate: '2024-02-01' }]
    expect(isHabitStarted({ courseId: 'c1', planId: null }, courses, [], '2024-01-10')).toBe(false)
  })

  it('is true when the linked course has no start date set', () => {
    const courses = [{ id: 'c1', startDate: undefined }]
    expect(isHabitStarted({ courseId: 'c1', planId: null }, courses, [], '2024-01-10')).toBe(true)
  })

  it('is true when the linked plan/course id no longer resolves to anything', () => {
    expect(isHabitStarted({ courseId: 'missing', planId: null }, [], [], '2024-01-10')).toBe(true)
  })
})

describe('isReturningAfterGap', () => {
  it('is false the very first time (no prior lastShown)', () => {
    expect(isReturningAfterGap(null, '2024-01-10')).toBe(false)
  })

  it('is false for the routine day-to-day cadence (shown yesterday)', () => {
    expect(isReturningAfterGap('2024-01-09', '2024-01-10')).toBe(false)
  })

  it('is false when shown today already', () => {
    expect(isReturningAfterGap('2024-01-10', '2024-01-10')).toBe(false)
  })

  it('is true once at least one full day was skipped', () => {
    expect(isReturningAfterGap('2024-01-07', '2024-01-10')).toBe(true)
  })
})
