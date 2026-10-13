import { describe, it, expect } from 'vitest'
import type { Habit } from '../types'
import {
  toDateStr,
  parseDateStr,
  daysInMonth,
  monthDates,
  cycleMark,
  monthCompletionPercent,
  computeCurrentStreak,
  computeBestStreak,
  yearlyCompletion,
  compareToLastMonth,
  isPerfectDay,
  isPerfectWeek,
  isPerfectMonth,
} from './habits'

function habit(marks: Record<string, 0 | 1 | 2>, overrides: Partial<Habit> = {}): Habit {
  return { id: 'h1', name: 'Test', courseId: null, categoryId: null, archived: false, order: 0, marks, ...overrides }
}

describe('toDateStr / parseDateStr', () => {
  it('round-trips a date through the YYYY-MM-DD string form', () => {
    const d = new Date(2024, 0, 5) // Jan 5, 2024
    expect(toDateStr(d)).toBe('2024-01-05')
    expect(parseDateStr('2024-01-05').getFullYear()).toBe(2024)
    expect(parseDateStr('2024-01-05').getMonth()).toBe(0)
    expect(parseDateStr('2024-01-05').getDate()).toBe(5)
  })
})

describe('daysInMonth / monthDates', () => {
  it('knows February in a leap year has 29 days', () => {
    expect(daysInMonth(1, 2024)).toBe(29)
    expect(daysInMonth(1, 2023)).toBe(28)
  })

  it('produces one date string per day of the month, in order', () => {
    const dates = monthDates(0, 2024)
    expect(dates).toHaveLength(31)
    expect(dates[0]).toBe('2024-01-01')
    expect(dates[30]).toBe('2024-01-31')
  })
})

describe('cycleMark', () => {
  it('cycles 0 -> 1 -> 2 -> 0', () => {
    expect(cycleMark(undefined)).toBe(1)
    expect(cycleMark(0)).toBe(1)
    expect(cycleMark(1)).toBe(2)
    expect(cycleMark(2)).toBe(0)
  })
})

describe('monthCompletionPercent', () => {
  it('is 0 for no habits or an empty month list', () => {
    expect(monthCompletionPercent([], 0, 2024)).toBe(0)
  })

  it('averages partial (0.5) and done (1.0) credit across all habit-days', () => {
    const h = habit({ '2024-01-01': 2, '2024-01-02': 1 }) // rest of January unmarked (0)
    const percent = monthCompletionPercent([h], 0, 2024)
    // (1 + 0.5) credit out of 31 days
    expect(percent).toBe(Math.round(((1 + 0.5) / 31) * 100))
  })
})

describe('computeCurrentStreak', () => {
  it('counts consecutive done days ending today, when today is done', () => {
    const today = new Date(2024, 0, 10)
    const h = habit({
      '2024-01-08': 2,
      '2024-01-09': 2,
      '2024-01-10': 2,
    })
    expect(computeCurrentStreak(h, today)).toBe(3)
  })

  it("doesn't treat today's not-yet-done status as breaking the streak", () => {
    const today = new Date(2024, 0, 10) // not marked yet
    const h = habit({ '2024-01-08': 2, '2024-01-09': 2 })
    expect(computeCurrentStreak(h, today)).toBe(2)
  })

  it('is 0 once a day is actually skipped (marked 0) before today', () => {
    const today = new Date(2024, 0, 10)
    const h = habit({ '2024-01-09': 0, '2024-01-08': 2, '2024-01-07': 2 })
    expect(computeCurrentStreak(h, today)).toBe(0)
  })

  it("a partial (1) day for today doesn't add to or erase yesterday's streak", () => {
    const today = new Date(2024, 0, 10)
    const h = habit({ '2024-01-10': 1, '2024-01-09': 2 })
    // Today isn't conclusively done, so it's treated like "not yet marked":
    // the streak is evaluated as of yesterday, which was done.
    expect(computeCurrentStreak(h, today)).toBe(1)
  })

  it('a partial (1) day in the middle of a streak does break it', () => {
    const today = new Date(2024, 0, 10)
    const h = habit({ '2024-01-10': 2, '2024-01-09': 1, '2024-01-08': 2 })
    expect(computeCurrentStreak(h, today)).toBe(1)
  })
})

describe('computeBestStreak', () => {
  it('finds the longest run of consecutive done days anywhere in history', () => {
    const h = habit({
      '2024-01-01': 2,
      '2024-01-02': 2,
      '2024-01-03': 2,
      // gap
      '2024-01-10': 2,
      '2024-01-11': 2,
    })
    expect(computeBestStreak(h)).toBe(3)
  })

  it('is 0 when nothing is ever marked done', () => {
    expect(computeBestStreak(habit({ '2024-01-01': 1 }))).toBe(0)
  })
})

describe('yearlyCompletion', () => {
  it('returns 12 values, one per month', () => {
    const h = habit({ '2024-01-01': 2 })
    const result = yearlyCompletion([h], 2024)
    expect(result).toHaveLength(12)
    expect(result[0]).toBeGreaterThan(0) // January has a done day
    expect(result[1]).toBe(0) // February has nothing
  })
})

describe('compareToLastMonth', () => {
  it('compares the same elapsed-day window in each month, not this (partial) month against a full last month', () => {
    // Reference date: Feb 15 — only days 1-15 of Feb exist yet.
    const marks: Record<string, 0 | 1 | 2> = {}
    for (let d = 1; d <= 15; d++) marks[`2024-02-${String(d).padStart(2, '0')}`] = 2 // perfect so far this month
    for (let d = 1; d <= 31; d++) marks[`2024-01-${String(d).padStart(2, '0')}`] = 2 // perfect all of January
    const h = habit(marks)

    const result = compareToLastMonth([h], new Date(2024, 1, 15))
    // Both windows are equally perfect (first 15 days each) -> no apparent decline,
    // even though January as a whole had more days than February has had so far.
    expect(result.thisMonthPercent).toBe(100)
    expect(result.lastMonthPercent).toBe(100)
    expect(result.deltaPercent).toBe(0)
  })

  it('rolls over the year when comparing January to the previous December', () => {
    const h = habit({ '2023-12-01': 2, '2024-01-01': 2 })
    const result = compareToLastMonth([h], new Date(2024, 0, 1)) // Jan 1, 2024 vs Dec 1, 2023
    expect(result.lastMonthPercent).toBe(100)
    expect(result.thisMonthPercent).toBe(100)
  })

  it('detects a genuine decline when this elapsed window is actually worse', () => {
    const marks: Record<string, 0 | 1 | 2> = {}
    for (let d = 1; d <= 10; d++) marks[`2024-01-${String(d).padStart(2, '0')}`] = 2 // great January
    for (let d = 1; d <= 10; d++) marks[`2024-02-${String(d).padStart(2, '0')}`] = 0 // poor February so far
    const h = habit(marks)

    const result = compareToLastMonth([h], new Date(2024, 1, 10))
    expect(result.deltaPercent).toBeLessThan(0)
  })
})

describe('isPerfectDay', () => {
  it('is true only when every given habit is done that day', () => {
    const a = habit({ '2024-01-01': 2 }, { id: 'a' })
    const b = habit({ '2024-01-01': 2 }, { id: 'b' })
    expect(isPerfectDay([a, b], '2024-01-01')).toBe(true)
  })

  it('is false if any habit is only partial or not done', () => {
    const a = habit({ '2024-01-01': 2 }, { id: 'a' })
    const b = habit({ '2024-01-01': 1 }, { id: 'b' })
    expect(isPerfectDay([a, b], '2024-01-01')).toBe(false)
  })

  it('is false for an empty habit list (vacuous truth is not a celebration)', () => {
    expect(isPerfectDay([], '2024-01-01')).toBe(false)
  })
})

describe('isPerfectWeek', () => {
  it('is true when all 7 days ending at endDate are perfect', () => {
    const marks: Record<string, 0 | 1 | 2> = {}
    for (let d = 1; d <= 7; d++) marks[`2024-01-0${d}`] = 2
    const h = habit(marks)
    expect(isPerfectWeek([h], '2024-01-07')).toBe(true)
  })

  it('is false if even one day in the window is missed', () => {
    const marks: Record<string, 0 | 1 | 2> = {}
    for (let d = 1; d <= 7; d++) marks[`2024-01-0${d}`] = 2
    marks['2024-01-04'] = 0
    const h = habit(marks)
    expect(isPerfectWeek([h], '2024-01-07')).toBe(false)
  })
})

describe('isPerfectMonth', () => {
  it('is true only when every day of the month is done', () => {
    const marks: Record<string, 0 | 1 | 2> = {}
    for (const date of monthDates(0, 2024)) marks[date] = 2
    const h = habit(marks)
    expect(isPerfectMonth([h], 0, 2024)).toBe(true)
  })

  it('is false when the month is only partially complete', () => {
    const h = habit({ '2024-01-01': 2 })
    expect(isPerfectMonth([h], 0, 2024)).toBe(false)
  })
})
