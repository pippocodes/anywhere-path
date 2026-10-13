import { describe, it, expect } from 'vitest'
import { parseOutline } from './outlineParser'
import { scheduleOutline, buildScheduleIndex, computeNodeDateRange, formatDateLabel } from './scheduler'

const ALL_WEEKDAYS = [0, 1, 2, 3, 4, 5, 6]

describe('scheduleOutline', () => {
  it('schedules sequential leaves one hour-budget at a time, starting on startDate', () => {
    const { nodes } = parseOutline(['Topic', '  A (2h)', '  B (1h)'].join('\n'))
    // Start on a Thursday (2024-01-04) with 2h/day across every day of the week.
    const result = scheduleOutline(nodes[0].children, { startDate: '2024-01-04', hoursPerDay: 2, weekdays: ALL_WEEKDAYS })

    expect(result.items).toHaveLength(2)
    expect(result.items[0]).toMatchObject({ name: 'A', startDate: '2024-01-04', endDate: '2024-01-04' })
    // B starts where A's day's budget left off (0h left), so it spills to the next day.
    expect(result.items[1]).toMatchObject({ name: 'B', startDate: '2024-01-05', endDate: '2024-01-05' })
    expect(result.finishDate).toBe('2024-01-05')
    expect(result.totalDays).toBe(2)
    expect(result.totalHours).toBe(3)
  })

  it('spills a single long leaf across multiple days', () => {
    const { nodes } = parseOutline('Topic\n  Big (5h)')
    const result = scheduleOutline(nodes[0].children, { startDate: '2024-01-01', hoursPerDay: 2, weekdays: ALL_WEEKDAYS })

    // 5h at 2h/day -> spans 3 days (2h, 2h, 1h)
    expect(result.items[0].startDate).toBe('2024-01-01')
    expect(result.items[0].endDate).toBe('2024-01-03')
    expect(result.totalDays).toBe(3)
  })

  it('skips weekend days when only weekdays are selected', () => {
    const { nodes } = parseOutline('Topic\n  A (1h)\n  B (1h)\n  C (1h)')
    // 2024-01-05 is a Friday. 1h/day, Mon-Fri only (1..5).
    const result = scheduleOutline(nodes[0].children, {
      startDate: '2024-01-05',
      hoursPerDay: 1,
      weekdays: [1, 2, 3, 4, 5],
    })

    expect(result.items[0].startDate).toBe('2024-01-05') // Fri
    expect(result.items[1].startDate).toBe('2024-01-08') // skips Sat/Sun -> Mon
    expect(result.items[2].startDate).toBe('2024-01-09') // Tue
  })

  it('returns an empty, non-crashing result when no weekday is selected', () => {
    const { nodes } = parseOutline('Topic\n  A (1h)')
    const result = scheduleOutline(nodes[0].children, { startDate: '2024-01-01', hoursPerDay: 2, weekdays: [] })
    expect(result).toEqual({ items: [], finishDate: null, totalHours: 0, totalDays: 0 })
  })

  it('returns an empty, non-crashing result when hoursPerDay is zero or negative', () => {
    const { nodes } = parseOutline('Topic\n  A (1h)')
    const result = scheduleOutline(nodes[0].children, { startDate: '2024-01-01', hoursPerDay: 0, weekdays: ALL_WEEKDAYS })
    expect(result.items).toEqual([])
    expect(result.finishDate).toBeNull()
  })

  it('records the ancestor path for each scheduled leaf', () => {
    const { nodes } = parseOutline('Topic\n  Subtopic\n    Module (1h)')
    const result = scheduleOutline(nodes, { startDate: '2024-01-01', hoursPerDay: 1, weekdays: ALL_WEEKDAYS })
    expect(result.items[0].path).toEqual(['Topic', 'Subtopic'])
  })
})

describe('computeNodeDateRange', () => {
  it('rolls a container node date range up from its scheduled leaves', () => {
    const { nodes } = parseOutline(['Topic', '  Subtopic', '    A (2h)', '    B (2h)'].join('\n'))
    const result = scheduleOutline(nodes, { startDate: '2024-01-01', hoursPerDay: 2, weekdays: [0, 1, 2, 3, 4, 5, 6] })
    const index = buildScheduleIndex(result.items)

    const subtopic = nodes[0].children[0]
    const range = computeNodeDateRange(subtopic, index)
    expect(range.startDate).toBe('2024-01-01')
    expect(range.endDate).toBe('2024-01-02')

    const topicRange = computeNodeDateRange(nodes[0], index)
    expect(topicRange).toEqual(range)
  })

  it('returns nulls for a node with nothing scheduled', () => {
    const { nodes } = parseOutline('Topic\n  A (1h)')
    const index = buildScheduleIndex([])
    expect(computeNodeDateRange(nodes[0], index)).toEqual({ startDate: null, endDate: null })
  })
})

describe('formatDateLabel', () => {
  it('formats a YYYY-MM-DD string as a short, human date', () => {
    expect(formatDateLabel('2024-01-04')).toBe('Jan 4, 2024')
  })
})
