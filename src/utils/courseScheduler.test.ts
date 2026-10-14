import { describe, it, expect } from 'vitest'
import { scheduleCourse, buildCourseScheduleIndex } from './courseScheduler'
import type { CourseModule, Topic } from '../types'

const ALL_WEEKDAYS = [0, 1, 2, 3, 4, 5, 6]

function topic(id: string, name: string, durationSeconds: number): Topic {
  return { id, name, hours: durationSeconds / 3600, done: false, durationSeconds }
}

function module(id: string, name: string, topics: Topic[], modules?: CourseModule[]): CourseModule {
  return { id, name, topics, modules }
}

describe('scheduleCourse', () => {
  it('schedules sequential lectures one hour-budget at a time, starting on startDate', () => {
    const modules = [module('m1', 'Section', [topic('t1', 'A', 2 * 3600), topic('t2', 'B', 1 * 3600)])]
    // Start on a Thursday (2024-01-04) with 2h/day across every day of the week.
    const result = scheduleCourse(modules, { startDate: '2024-01-04', hoursPerDay: 2, weekdays: ALL_WEEKDAYS })

    expect(result.items).toHaveLength(2)
    expect(result.items[0]).toMatchObject({ name: 'A', startDate: '2024-01-04', endDate: '2024-01-04' })
    // B starts where A's day's budget left off (0h left), so it spills to the next day.
    expect(result.items[1]).toMatchObject({ name: 'B', startDate: '2024-01-05', endDate: '2024-01-05' })
    expect(result.finishDate).toBe('2024-01-05')
    expect(result.totalDays).toBe(2)
    expect(result.totalSeconds).toBe(3 * 3600)
  })

  it('spills a single long lecture across multiple days', () => {
    const modules = [module('m1', 'Section', [topic('t1', 'Big', 5 * 3600)])]
    const result = scheduleCourse(modules, { startDate: '2024-01-01', hoursPerDay: 2, weekdays: ALL_WEEKDAYS })

    // 5h at 2h/day -> spans 3 days (2h, 2h, 1h)
    expect(result.items[0].startDate).toBe('2024-01-01')
    expect(result.items[0].endDate).toBe('2024-01-03')
    expect(result.totalDays).toBe(3)
  })

  it('skips weekend days when only weekdays are selected', () => {
    const modules = [module('m1', 'Section', [topic('t1', 'A', 3600), topic('t2', 'B', 3600), topic('t3', 'C', 3600)])]
    // 2024-01-05 is a Friday. 1h/day, Mon-Fri only (1..5).
    const result = scheduleCourse(modules, { startDate: '2024-01-05', hoursPerDay: 1, weekdays: [1, 2, 3, 4, 5] })

    expect(result.items[0].startDate).toBe('2024-01-05') // Fri
    expect(result.items[1].startDate).toBe('2024-01-08') // skips Sat/Sun -> Mon
    expect(result.items[2].startDate).toBe('2024-01-09') // Tue
  })

  it('returns an empty, non-crashing result when no weekday is selected', () => {
    const modules = [module('m1', 'Section', [topic('t1', 'A', 3600)])]
    const result = scheduleCourse(modules, { startDate: '2024-01-01', hoursPerDay: 2, weekdays: [] })
    expect(result).toEqual({ items: [], finishDate: null, totalSeconds: 0, totalDays: 0 })
  })

  it('returns an empty, non-crashing result when hoursPerDay is zero or negative', () => {
    const modules = [module('m1', 'Section', [topic('t1', 'A', 3600)])]
    const result = scheduleCourse(modules, { startDate: '2024-01-01', hoursPerDay: 0, weekdays: ALL_WEEKDAYS })
    expect(result.items).toEqual([])
    expect(result.finishDate).toBeNull()
  })

  it('records the ancestor module path for each scheduled lecture, including nested sub-modules', () => {
    const subModule = module('sub', 'Sub-module', [topic('t1', 'Lecture', 3600)])
    const modules = [module('m1', 'Section', [], [subModule])]
    const result = scheduleCourse(modules, { startDate: '2024-01-01', hoursPerDay: 1, weekdays: ALL_WEEKDAYS })
    expect(result.items[0].path).toEqual(['Section', 'Sub-module'])
  })

  it('schedules a module\'s own lectures before descending into its nested sub-modules', () => {
    const subModule = module('sub', 'Sub-module', [topic('t2', 'Nested', 3600)])
    const modules = [module('m1', 'Section', [topic('t1', 'Own', 3600)], [subModule])]
    const result = scheduleCourse(modules, { startDate: '2024-01-01', hoursPerDay: 1, weekdays: ALL_WEEKDAYS })
    expect(result.items.map((i) => i.name)).toEqual(['Own', 'Nested'])
  })
})

describe('buildCourseScheduleIndex', () => {
  it('indexes scheduled items by topic id', () => {
    const modules = [module('m1', 'Section', [topic('t1', 'A', 3600)])]
    const result = scheduleCourse(modules, { startDate: '2024-01-01', hoursPerDay: 1, weekdays: ALL_WEEKDAYS })
    const index = buildCourseScheduleIndex(result.items)
    expect(index.get('t1')?.name).toBe('A')
  })
})
