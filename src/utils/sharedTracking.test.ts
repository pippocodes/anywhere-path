import { describe, it, expect } from 'vitest'
import { computeSharedStreak, finishOrderFor, isTogetherComplete, stateFor, type SharedLog } from './sharedTracking'

describe('stateFor', () => {
  it('returns the matching log state, or 0 when nothing logged', () => {
    const logs: SharedLog[] = [{ userId: 'a', date: '2024-01-01', state: 2 }]
    expect(stateFor(logs, 'a', '2024-01-01')).toBe(2)
    expect(stateFor(logs, 'a', '2024-01-02')).toBe(0)
    expect(stateFor(logs, 'b', '2024-01-01')).toBe(0)
  })
})

describe('computeSharedStreak', () => {
  it('counts consecutive days every member was fully done, ending today', () => {
    const today = new Date(2024, 0, 10)
    const logs: SharedLog[] = []
    for (let d = 7; d <= 10; d++) {
      logs.push({ userId: 'a', date: `2024-01-${String(d).padStart(2, '0')}`, state: 2 })
      logs.push({ userId: 'b', date: `2024-01-${String(d).padStart(2, '0')}`, state: 2 })
    }
    expect(computeSharedStreak(logs, ['a', 'b'], today)).toBe(4)
  })

  it('does not break the streak just because today is not done yet', () => {
    const today = new Date(2024, 0, 10)
    const logs: SharedLog[] = [
      { userId: 'a', date: '2024-01-09', state: 2 },
      { userId: 'b', date: '2024-01-09', state: 2 },
    ]
    expect(computeSharedStreak(logs, ['a', 'b'], today)).toBe(1)
  })

  it('does not break the streak when everyone did at least something on a day, even if not everyone finished', () => {
    const today = new Date(2024, 0, 10)
    const logs: SharedLog[] = [
      { userId: 'a', date: '2024-01-10', state: 2 },
      { userId: 'b', date: '2024-01-10', state: 2 },
      { userId: 'a', date: '2024-01-09', state: 2 },
      { userId: 'b', date: '2024-01-09', state: 1 }, // only partial — doesn't break it, doesn't add either
      { userId: 'a', date: '2024-01-08', state: 2 },
      { userId: 'b', date: '2024-01-08', state: 2 },
    ]
    expect(computeSharedStreak(logs, ['a', 'b'], today)).toBe(2)
  })

  it('breaks the streak at the first earlier day any one member did nothing at all', () => {
    const today = new Date(2024, 0, 10)
    const logs: SharedLog[] = [
      { userId: 'a', date: '2024-01-10', state: 2 },
      { userId: 'b', date: '2024-01-10', state: 2 },
      { userId: 'a', date: '2024-01-09', state: 2 },
      { userId: 'b', date: '2024-01-09', state: 0 }, // nothing at all — breaks it here
      { userId: 'a', date: '2024-01-08', state: 2 },
      { userId: 'b', date: '2024-01-08', state: 2 },
    ]
    expect(computeSharedStreak(logs, ['a', 'b'], today)).toBe(1)
  })

  it('returns 0 for an empty member list', () => {
    expect(computeSharedStreak([], [], new Date(2024, 0, 10))).toBe(0)
  })
})

describe('finishOrderFor', () => {
  it('orders only the fully-done members for that date by their log timestamp', () => {
    const logs = [
      { userId: 'a', date: '2024-01-10', state: 2 as const, updatedAt: '2024-01-10T09:00:00.000Z' },
      { userId: 'b', date: '2024-01-10', state: 2 as const, updatedAt: '2024-01-10T08:00:00.000Z' },
      { userId: 'c', date: '2024-01-10', state: 1 as const, updatedAt: '2024-01-10T07:00:00.000Z' }, // only partial
      { userId: 'a', date: '2024-01-09', state: 2 as const, updatedAt: '2024-01-09T09:00:00.000Z' }, // different date
    ]
    expect(finishOrderFor(logs, '2024-01-10')).toEqual([
      { userId: 'b', finishedAt: '2024-01-10T08:00:00.000Z' },
      { userId: 'a', finishedAt: '2024-01-10T09:00:00.000Z' },
    ])
  })
})

describe('isTogetherComplete', () => {
  it('is true only once every member is fully done for that date', () => {
    const logs: SharedLog[] = [
      { userId: 'a', date: '2024-01-10', state: 2 },
      { userId: 'b', date: '2024-01-10', state: 2 },
    ]
    expect(isTogetherComplete(logs, ['a', 'b'], '2024-01-10')).toBe(true)
    expect(isTogetherComplete(logs, ['a', 'b', 'c'], '2024-01-10')).toBe(false)
  })

  it('is false for an empty member list', () => {
    expect(isTogetherComplete([], [], '2024-01-10')).toBe(false)
  })
})
