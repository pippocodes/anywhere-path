import { describe, it, expect } from 'vitest'
import type { Habit, HabitCategory } from '../types'
import { toDateStr } from './habits'
import { generateSuggestions } from './suggestions'

function habit(id: string, marks: Record<string, 0 | 1 | 2>, categoryId: string | null = null): Habit {
  return { id, name: id, courseId: null, categoryId, archived: false, order: 0, marks }
}

function category(id: string, name = id): HabitCategory {
  return { id, name, color: '#ff4d6d', archived: false, order: 0 }
}

/** Marks every day in [start, end] (inclusive) using `pick(date)` to choose the mark. */
function fillRange(start: Date, end: Date, pick: (d: Date) => 0 | 1 | 2): Record<string, 0 | 1 | 2> {
  const marks: Record<string, 0 | 1 | 2> = {}
  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    marks[toDateStr(d)] = pick(d)
  }
  return marks
}

describe('generateSuggestions', () => {
  it('returns nothing for a thin/empty data set rather than guessing', () => {
    const result = generateSuggestions([], [], new Date(2024, 2, 15))
    expect(result).toEqual([])
  })

  it('flags a habit that is reliably skipped on weekends', () => {
    const referenceDate = new Date(2024, 2, 15) // Friday, 8 weeks of history available before it
    const start = new Date(2024, 0, 15)
    const marks = fillRange(start, referenceDate, (d) => ((d.getDay() === 0 || d.getDay() === 6) ? 0 : 2))

    const result = generateSuggestions([habit('h1', marks)], [], referenceDate)
    const found = result.find((s) => s.type === 'weekend-skip')
    expect(found).toBeDefined()
    expect(found!.message).toMatch(/weekends/i)
  })

  it('does not flag weekend-skip when weekend and weekday performance are similar', () => {
    const referenceDate = new Date(2024, 2, 15)
    const start = new Date(2024, 0, 15)
    const marks = fillRange(start, referenceDate, () => 2) // perfect every day
    const result = generateSuggestions([habit('h1', marks)], [], referenceDate)
    expect(result.find((s) => s.type === 'weekend-skip')).toBeUndefined()
  })

  it('suggests beating the best streak once it is at least 3 days', () => {
    const marks = fillRange(new Date(2024, 0, 1), new Date(2024, 0, 5), () => 2) // 5-day streak
    const result = generateSuggestions([habit('h1', marks)], [], new Date(2024, 0, 10))
    const found = result.find((s) => s.type === 'beat-streak')
    expect(found).toBeDefined()
    expect(found!.message).toMatch(/5 days/)
  })

  it('does not suggest beating a streak shorter than 3 days', () => {
    const marks = fillRange(new Date(2024, 0, 1), new Date(2024, 0, 2), () => 2) // 2-day streak
    const result = generateSuggestions([habit('h1', marks)], [], new Date(2024, 0, 10))
    expect(result.find((s) => s.type === 'beat-streak')).toBeUndefined()
  })

  it('flags a category whose elapsed-window completion genuinely declined', () => {
    const referenceDate = new Date(2024, 1, 10) // Feb 10
    const marks: Record<string, 0 | 1 | 2> = {
      ...fillRange(new Date(2024, 0, 1), new Date(2024, 0, 10), () => 2), // great Jan 1-10
      ...fillRange(new Date(2024, 1, 1), new Date(2024, 1, 10), () => 0), // poor Feb 1-10
    }
    const result = generateSuggestions([habit('h1', marks, 'study')], [category('study', 'Study')], referenceDate)
    const found = result.find((s) => s.type === 'category-decline')
    expect(found).toBeDefined()
    expect(found!.message).toMatch(/^Study habits are \d+% below last month\.$/)
  })

  it('does not flag a category that is doing fine or improving', () => {
    const referenceDate = new Date(2024, 1, 10)
    const marks: Record<string, 0 | 1 | 2> = {
      ...fillRange(new Date(2024, 0, 1), new Date(2024, 0, 10), () => 2),
      ...fillRange(new Date(2024, 1, 1), new Date(2024, 1, 10), () => 2),
    }
    const result = generateSuggestions([habit('h1', marks, 'study')], [category('study', 'Study')], referenceDate)
    expect(result.find((s) => s.type === 'category-decline')).toBeUndefined()
  })

  it('suggests focusing on the least consistent habit this month (5+ days in)', () => {
    const referenceDate = new Date(2024, 1, 10)
    const strong = fillRange(new Date(2024, 1, 1), referenceDate, () => 2)
    const weak = fillRange(new Date(2024, 1, 1), referenceDate, () => 0)

    const result = generateSuggestions([habit('strong', strong), habit('weak', weak)], [], referenceDate)
    const found = result.find((s) => s.type === 'focus-habit')
    expect(found).toBeDefined()
    expect(found!.message).toContain('weak')
  })

  it('skips the focus-habit rule in the first few days of the month', () => {
    const referenceDate = new Date(2024, 1, 3) // only 3 days in
    const weak = fillRange(new Date(2024, 1, 1), referenceDate, () => 0)
    const result = generateSuggestions([habit('weak', weak)], [], referenceDate)
    expect(result.find((s) => s.type === 'focus-habit')).toBeUndefined()
  })

  it('ignores archived habits and categories entirely', () => {
    const marks = fillRange(new Date(2024, 0, 1), new Date(2024, 0, 10), () => 2)
    const archivedHabit: Habit = { ...habit('h1', marks), archived: true }
    const result = generateSuggestions([archivedHabit], [], new Date(2024, 0, 15))
    expect(result).toEqual([])
  })

  it('is deterministic: the same inputs always produce the same output', () => {
    const referenceDate = new Date(2024, 2, 15)
    const start = new Date(2024, 0, 15)
    const marks = fillRange(start, referenceDate, (d) => ((d.getDay() === 0 || d.getDay() === 6) ? 0 : 2))
    const habits = [habit('h1', marks)]

    const first = generateSuggestions(habits, [], referenceDate)
    const second = generateSuggestions(habits, [], referenceDate)
    expect(second).toEqual(first)
  })

  it('returns suggestions in a fixed rule order', () => {
    const referenceDate = new Date(2024, 2, 15)
    const start = new Date(2024, 0, 15)
    const weekendSkipMarks = fillRange(start, referenceDate, (d) => ((d.getDay() === 0 || d.getDay() === 6) ? 0 : 2))
    const streakMarks = fillRange(new Date(2024, 2, 1), new Date(2024, 2, 10), () => 2)

    const result = generateSuggestions(
      [habit('h1', weekendSkipMarks), habit('h2', streakMarks)],
      [],
      referenceDate
    )
    const types = result.map((s) => s.type)
    expect(types.indexOf('weekend-skip')).toBeLessThan(types.indexOf('beat-streak'))
  })
})
