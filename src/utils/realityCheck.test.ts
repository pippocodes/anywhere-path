import { describe, it, expect } from 'vitest'
import { computeRealityCheck } from './realityCheck'

const ALL_WEEKDAYS = [0, 1, 2, 3, 4, 5, 6]

describe('computeRealityCheck', () => {
  it('reports a fitting plan correctly', () => {
    // 10 days * 2h/day = 20h available, needs 10h.
    const result = computeRealityCheck({
      startDate: '2024-01-01',
      days: 10,
      hoursPerDay: 2,
      weekdays: ALL_WEEKDAYS,
      requiredSeconds: 10 * 3600,
    })
    expect(result.fits).toBe(true)
    expect(result.shortfallSeconds).toBe(0)
    expect(result.availableSeconds).toBe(20 * 3600)
  })

  it('reports exact shortfall numbers for a plan that does not fit', () => {
    // 2024-01-01 is a Monday. 7 days, every weekday counts -> 7 study days * 4h = 28h available.
    const result = computeRealityCheck({
      startDate: '2024-01-01',
      days: 7,
      hoursPerDay: 4,
      weekdays: ALL_WEEKDAYS,
      requiredSeconds: 42 * 3600, // needs 42h but has 28h
    })
    expect(result.fits).toBe(false)
    expect(result.availableSeconds).toBe(28 * 3600)
    expect(result.shortfallSeconds).toBe(14 * 3600)
  })

  it('suggests an hours-per-day increase that makes the plan fit', () => {
    const result = computeRealityCheck({
      startDate: '2024-01-01',
      days: 7,
      hoursPerDay: 4,
      weekdays: ALL_WEEKDAYS,
      requiredSeconds: 42 * 3600,
    })
    // 42h / 7 study days = 6h/day exactly.
    expect(result.suggestedHoursPerDay).toBe(6)
    // Verify the suggestion actually fits when applied.
    const retried = computeRealityCheck({
      startDate: '2024-01-01',
      days: 7,
      hoursPerDay: result.suggestedHoursPerDay!,
      weekdays: ALL_WEEKDAYS,
      requiredSeconds: 42 * 3600,
    })
    expect(retried.fits).toBe(true)
  })

  it('suggests an extended day count that makes the plan fit, with the right finish date', () => {
    const result = computeRealityCheck({
      startDate: '2024-01-01',
      days: 7,
      hoursPerDay: 4,
      weekdays: ALL_WEEKDAYS,
      requiredSeconds: 42 * 3600,
    })
    // Needs ceil(42/4) = 11 study days; every day counts, so 11 calendar days.
    expect(result.suggestedDays).toBe(11)
    expect(result.suggestedFinishDate).toBe('2024-01-11')
    const retried = computeRealityCheck({
      startDate: '2024-01-01',
      days: result.suggestedDays!,
      hoursPerDay: 4,
      weekdays: ALL_WEEKDAYS,
      requiredSeconds: 42 * 3600,
    })
    expect(retried.fits).toBe(true)
  })

  it('accounts for weekday filtering (skips weekends) in both the check and the fixes', () => {
    // 2024-01-01 is a Monday; Mon-Fri only.
    const weekdaysOnly = [1, 2, 3, 4, 5]
    const result = computeRealityCheck({
      startDate: '2024-01-01',
      days: 7, // Mon 1 .. Sun 7 -> 5 weekdays in this window
      hoursPerDay: 2,
      weekdays: weekdaysOnly,
      requiredSeconds: 20 * 3600,
    })
    expect(result.studyDays).toBe(5)
    expect(result.availableSeconds).toBe(10 * 3600)
    expect(result.fits).toBe(false)
    expect(result.shortfallSeconds).toBe(10 * 3600)
  })

  it('returns null fixes rather than crashing when no weekday is selected', () => {
    const result = computeRealityCheck({
      startDate: '2024-01-01',
      days: 7,
      hoursPerDay: 2,
      weekdays: [],
      requiredSeconds: 10 * 3600,
    })
    expect(result.fits).toBe(false)
    expect(result.suggestedHoursPerDay).toBeNull()
    expect(result.suggestedDays).toBeNull()
  })

  it('computes the finish date as the last day of the target window', () => {
    const result = computeRealityCheck({
      startDate: '2024-01-01',
      days: 5,
      hoursPerDay: 2,
      weekdays: ALL_WEEKDAYS,
      requiredSeconds: 3600,
    })
    expect(result.finishDate).toBe('2024-01-05')
  })
})
