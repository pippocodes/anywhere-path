import { describe, it, expect } from 'vitest'
import { parseDuration, formatDuration, getTopicSeconds, secondsToTopicFields } from './duration'

describe('parseDuration', () => {
  it('parses mm:ss', () => {
    expect(parseDuration('5:22')).toBe(322)
    expect(parseDuration('0:05')).toBe(5)
    expect(parseDuration('12:07')).toBe(727)
  })

  it('parses h:mm:ss', () => {
    expect(parseDuration('1:03:45')).toBe(3825)
    expect(parseDuration('1:05:22')).toBe(3922)
  })

  it('rejects mm:ss / h:mm:ss with an out-of-range seconds or minutes part', () => {
    expect(parseDuration('5:60')).toBeNull()
    expect(parseDuration('1:60:00')).toBeNull()
  })

  it('parses "5m 22s" style tokens', () => {
    expect(parseDuration('5m 22s')).toBe(322)
    expect(parseDuration('1h 5m 22s')).toBe(3922)
    expect(parseDuration('2h')).toBe(7200)
    expect(parseDuration('90s')).toBe(90)
  })

  it('parses "5 min 22 sec" style tokens', () => {
    expect(parseDuration('5 min 22 sec')).toBe(322)
    expect(parseDuration('1 hour 5 minutes 22 seconds')).toBe(3922)
  })

  it('treats a bare number as whole minutes', () => {
    expect(parseDuration('12')).toBe(720)
    expect(parseDuration('0.5')).toBe(30)
  })

  it('is forgiving of surrounding whitespace and case', () => {
    expect(parseDuration('  5:22  ')).toBe(322)
    expect(parseDuration('5M 22S')).toBe(322)
  })

  it('returns null for text that is not a duration', () => {
    expect(parseDuration('')).toBeNull()
    expect(parseDuration('abc')).toBeNull()
    expect(parseDuration('Intro to Arrays')).toBeNull()
  })
})

describe('formatDuration', () => {
  it('formats under an hour as mm:ss', () => {
    expect(formatDuration(322)).toBe('5:22')
    expect(formatDuration(5)).toBe('0:05')
    expect(formatDuration(727)).toBe('12:07')
  })

  it('formats an hour or more as h:mm:ss', () => {
    expect(formatDuration(3825)).toBe('1:03:45')
    expect(formatDuration(3600)).toBe('1:00:00')
  })

  it('round-trips the example from the Course Tracker spec: 5:22 + 12:07 + 1:03:45 = 1:21:14', () => {
    const total = (parseDuration('5:22') ?? 0) + (parseDuration('12:07') ?? 0) + (parseDuration('1:03:45') ?? 0)
    expect(total).toBe(4874)
    expect(formatDuration(total)).toBe('1:21:14')
  })
})

describe('getTopicSeconds / secondsToTopicFields', () => {
  it('prefers durationSeconds when present', () => {
    expect(getTopicSeconds({ durationSeconds: 322, hours: 99 })).toBe(322)
  })

  it('falls back to the legacy hours field for older topics', () => {
    expect(getTopicSeconds({ hours: 0.5 })).toBe(1800)
    expect(getTopicSeconds({ durationSeconds: undefined, hours: 2 })).toBe(7200)
  })

  it('secondsToTopicFields keeps hours consistent for legacy readers', () => {
    expect(secondsToTopicFields(1800)).toEqual({ durationSeconds: 1800, hours: 0.5 })
  })
})
