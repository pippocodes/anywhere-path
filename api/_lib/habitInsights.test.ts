import { describe, it, expect } from 'vitest'
import { isRateLimited, validateStats, parseInsightsResponse, buildUserPrompt, RATE_LIMIT_MAX_REQUESTS } from './habitInsights.js'
import type { HabitInsightStats } from '../../src/utils/habitInsightStats.js'

const VALID_STATS = {
  referenceDate: '2026-10-23',
  daysOfData: 10,
  overallMonthPercent: 62,
  overallMonthDeltaPercent: 8,
  bestCurrentStreak: 4,
  perfectDaysThisMonth: 2,
  weekdayPattern: [
    { label: 'Su', percent: 40 },
    { label: 'Mo', percent: 70 },
    { label: 'Tu', percent: 65 },
    { label: 'We', percent: 80 },
    { label: 'Th', percent: 60 },
    { label: 'Fr', percent: 50 },
    { label: 'Sa', percent: 30 },
  ],
  habits: [
    { name: 'Morning run', category: 'Body', currentStreak: 4, bestStreak: 9, monthCompletionPercent: 70, monthDeltaPercent: 10 },
  ],
}

describe('isRateLimited', () => {
  it('allows requests under the limit', () => {
    expect(isRateLimited(0)).toBe(false)
    expect(isRateLimited(RATE_LIMIT_MAX_REQUESTS - 1)).toBe(false)
  })

  it('blocks once the count reaches the limit', () => {
    expect(isRateLimited(RATE_LIMIT_MAX_REQUESTS)).toBe(true)
    expect(isRateLimited(RATE_LIMIT_MAX_REQUESTS + 5)).toBe(true)
  })
})

describe('validateStats', () => {
  it('accepts a well-formed stats payload', () => {
    const result = validateStats(VALID_STATS)
    expect(result.valid).toBe(true)
    expect(result.stats?.habits).toHaveLength(1)
  })

  it('rejects a missing or non-object body', () => {
    expect(validateStats(undefined).valid).toBe(false)
    expect(validateStats('nope').valid).toBe(false)
  })

  it('rejects too little tracking history', () => {
    const result = validateStats({ ...VALID_STATS, daysOfData: 1 })
    expect(result.valid).toBe(false)
  })

  it('rejects a malformed referenceDate', () => {
    expect(validateStats({ ...VALID_STATS, referenceDate: '10/23/2026' }).valid).toBe(false)
  })

  it('rejects an empty or oversized habits list', () => {
    expect(validateStats({ ...VALID_STATS, habits: [] }).valid).toBe(false)
    expect(validateStats({ ...VALID_STATS, habits: Array(25).fill(VALID_STATS.habits[0]) }).valid).toBe(false)
  })

  it('rejects a habit with an out-of-range percent', () => {
    const bad = { ...VALID_STATS, habits: [{ ...VALID_STATS.habits[0], monthCompletionPercent: 250 }] }
    expect(validateStats(bad).valid).toBe(false)
  })

  it('rejects a malformed weekdayPattern', () => {
    expect(validateStats({ ...VALID_STATS, weekdayPattern: [] }).valid).toBe(false)
  })
})

describe('parseInsightsResponse', () => {
  it('parses a well-formed response', () => {
    const raw = JSON.stringify({
      focusOn: ['Focus on Morning run — only 2 days this week.'],
      keepGoing: ['Great consistency on your Wednesday habits.'],
      easeUp: [],
    })
    expect(parseInsightsResponse(raw)).toEqual({
      focusOn: ['Focus on Morning run — only 2 days this week.'],
      keepGoing: ['Great consistency on your Wednesday habits.'],
      easeUp: [],
    })
  })

  it('strips a wrapping code fence', () => {
    const raw = '```json\n' + JSON.stringify({ focusOn: ['a'], keepGoing: ['b'], easeUp: [] }) + '\n```'
    expect(parseInsightsResponse(raw).focusOn).toEqual(['a'])
  })

  it('throws on invalid JSON', () => {
    expect(() => parseInsightsResponse('not json')).toThrow()
  })

  it('throws when focusOn is empty', () => {
    const raw = JSON.stringify({ focusOn: [], keepGoing: ['b'], easeUp: [] })
    expect(() => parseInsightsResponse(raw)).toThrow()
  })

  it('throws when keepGoing is missing', () => {
    const raw = JSON.stringify({ focusOn: ['a'], easeUp: [] })
    expect(() => parseInsightsResponse(raw)).toThrow()
  })

  it('throws when an array exceeds its max length', () => {
    const raw = JSON.stringify({ focusOn: ['a', 'b', 'c', 'd'], keepGoing: ['b'], easeUp: [] })
    expect(() => parseInsightsResponse(raw)).toThrow()
  })

  it('allows easeUp to be empty', () => {
    const raw = JSON.stringify({ focusOn: ['a'], keepGoing: ['b'], easeUp: [] })
    expect(parseInsightsResponse(raw).easeUp).toEqual([])
  })
})

describe('buildUserPrompt', () => {
  it('serializes the stats as JSON containing the habit name', () => {
    expect(buildUserPrompt(VALID_STATS as HabitInsightStats)).toContain('Morning run')
  })
})
