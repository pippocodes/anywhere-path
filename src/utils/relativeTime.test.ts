import { describe, it, expect } from 'vitest'
import { relativeTime } from './relativeTime'

const now = new Date('2026-10-29T12:00:00.000Z')

describe('relativeTime', () => {
  it('says "just now" for anything under a minute', () => {
    expect(relativeTime('2026-10-29T11:59:45.000Z', now)).toBe('just now')
  })

  it('formats minutes', () => {
    expect(relativeTime('2026-10-29T11:55:00.000Z', now)).toBe('5m ago')
  })

  it('formats hours', () => {
    expect(relativeTime('2026-10-29T09:00:00.000Z', now)).toBe('3h ago')
  })

  it('formats days', () => {
    expect(relativeTime('2026-10-26T12:00:00.000Z', now)).toBe('3d ago')
  })

  it('falls back to a plain date past a week', () => {
    expect(relativeTime('2026-10-01T12:00:00.000Z', now)).toBe('Oct 1, 2026')
  })

  it('never goes negative for a clock-skewed future timestamp', () => {
    expect(relativeTime('2026-10-29T12:05:00.000Z', now)).toBe('just now')
  })
})
