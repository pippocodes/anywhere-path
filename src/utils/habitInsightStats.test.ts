import { describe, it, expect } from 'vitest'
import type { Habit, HabitCategory, HabitMark } from '../types'
import { daysOfData, hasEnoughDataForInsights, buildHabitInsightStats, MIN_DAYS_OF_DATA } from './habitInsightStats'

function habit(overrides: Partial<Habit> = {}): Habit {
  return {
    id: 'h1',
    name: 'Morning run',
    courseId: null,
    planId: null,
    categoryId: null,
    targetSeconds: null,
    marks: {},
    archived: false,
    order: 0,
    ...overrides,
  }
}

/** Builds a Record<string, HabitMark> for N consecutive days starting 2026-10-01. */
function marksForDays(count: number, value: HabitMark): Record<string, HabitMark> {
  const marks: Record<string, HabitMark> = {}
  for (let i = 0; i < count; i++) {
    marks[`2026-10-${String(i + 1).padStart(2, '0')}`] = value
  }
  return marks
}

const CATEGORIES: HabitCategory[] = [{ id: 'c1', name: 'Body', color: '#fff', archived: false, order: 0 }]

describe('daysOfData', () => {
  it('counts distinct marked dates across all habits', () => {
    const habits = [
      habit({ marks: { '2026-10-01': 2, '2026-10-02': 1 } as Record<string, HabitMark> }),
      habit({ id: 'h2', marks: { '2026-10-02': 0, '2026-10-03': 2 } as Record<string, HabitMark> }),
    ]
    expect(daysOfData(habits)).toBe(3)
  })

  it('returns 0 for no habits or no marks', () => {
    expect(daysOfData([])).toBe(0)
    expect(daysOfData([habit()])).toBe(0)
  })
})

describe('hasEnoughDataForInsights', () => {
  it('is false below the minimum and true at/above it', () => {
    const marks = marksForDays(MIN_DAYS_OF_DATA - 1, 1)
    expect(hasEnoughDataForInsights([habit({ marks })])).toBe(false)

    const enoughMarks = marksForDays(MIN_DAYS_OF_DATA, 1)
    expect(hasEnoughDataForInsights([habit({ marks: enoughMarks })])).toBe(true)
  })

  it('ignores archived habits', () => {
    const marks = marksForDays(5, 1)
    expect(hasEnoughDataForInsights([habit({ marks, archived: true })])).toBe(false)
  })
})

describe('buildHabitInsightStats', () => {
  it('aggregates habit name, category name, and numeric stats only — never marks or ids', () => {
    const referenceDate = new Date(2026, 9, 23) // Oct 23, 2026
    const habits = [
      habit({
        categoryId: 'c1',
        marks: { '2026-10-01': 2, '2026-10-02': 2, '2026-10-03': 2, '2026-10-23': 2 } as Record<string, HabitMark>,
      }),
    ]

    const stats = buildHabitInsightStats(habits, CATEGORIES, referenceDate)

    expect(stats.referenceDate).toBe('2026-10-23')
    expect(stats.daysOfData).toBe(4)
    expect(stats.habits).toHaveLength(1)
    expect(stats.habits[0].name).toBe('Morning run')
    expect(stats.habits[0].category).toBe('Body')
    expect(stats.habits[0].currentStreak).toBe(1)
    expect(stats.weekdayPattern).toHaveLength(7)

    // Never leaks raw ids/marks into the payload sent to the model.
    expect(JSON.stringify(stats)).not.toContain('h1')
    expect(JSON.stringify(stats)).not.toContain('c1')
  })

  it('excludes archived habits from the payload', () => {
    const referenceDate = new Date(2026, 9, 23)
    const habits = [habit({ archived: true, marks: { '2026-10-01': 2 } as Record<string, HabitMark> })]
    const stats = buildHabitInsightStats(habits, CATEGORIES, referenceDate)
    expect(stats.habits).toHaveLength(0)
    expect(stats.daysOfData).toBe(0)
  })
})
