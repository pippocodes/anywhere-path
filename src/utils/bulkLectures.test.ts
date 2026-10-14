import { describe, it, expect } from 'vitest'
import { parseBulkLectures } from './bulkLectures'

describe('parseBulkLectures', () => {
  it('parses the documented "Title (duration)" format, one per line', () => {
    const result = parseBulkLectures('Intro to Arrays (5:22)\nLinked Lists (12:07)\nTrees (1:03:45)')
    expect(result.hasErrors).toBe(false)
    expect(result.valid).toEqual([
      { title: 'Intro to Arrays', durationSeconds: 322 },
      { title: 'Linked Lists', durationSeconds: 727 },
      { title: 'Trees', durationSeconds: 3825 },
    ])
  })

  it('totals to 1:21:14 for the exact spec example', () => {
    const result = parseBulkLectures('Intro to Arrays (5:22)\nLinked Lists (12:07)\nTrees (1:03:45)')
    const total = result.valid.reduce((sum, v) => sum + v.durationSeconds, 0)
    expect(total).toBe(4874)
  })

  it('accepts dash, comma, and bare-trailing-token separators', () => {
    const result = parseBulkLectures('Intro to Arrays - 5:22\nLinked Lists, 12:07\nTrees 1:03:45')
    expect(result.hasErrors).toBe(false)
    expect(result.valid.map((v) => v.title)).toEqual(['Intro to Arrays', 'Linked Lists', 'Trees'])
  })

  it('accepts "5m 22s" style durations too', () => {
    const result = parseBulkLectures('Intro to Arrays (5m 22s)')
    expect(result.valid).toEqual([{ title: 'Intro to Arrays', durationSeconds: 322 }])
  })

  it('skips blank lines without treating them as errors', () => {
    const result = parseBulkLectures('Intro to Arrays (5:22)\n\n\nLinked Lists (12:07)')
    expect(result.lines).toHaveLength(2)
    expect(result.hasErrors).toBe(false)
  })

  it('reports a friendly, line-numbered error for a line with no readable duration', () => {
    const result = parseBulkLectures('Intro to Arrays (5:22)\nJust a title with no time')
    expect(result.hasErrors).toBe(true)
    const bad = result.lines.find((l) => l.error !== null)
    expect(bad?.line).toBe(2)
    expect(bad?.error).toMatch(/no duration/i)
  })

  it('keeps valid lines usable even when other lines in the same paste have errors', () => {
    const result = parseBulkLectures('Intro to Arrays (5:22)\nbroken line\nLinked Lists (12:07)')
    expect(result.hasErrors).toBe(true)
    expect(result.valid).toEqual([
      { title: 'Intro to Arrays', durationSeconds: 322 },
      { title: 'Linked Lists', durationSeconds: 727 },
    ])
  })
})
