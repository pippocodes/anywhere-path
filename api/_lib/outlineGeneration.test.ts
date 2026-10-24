import { describe, it, expect } from 'vitest'
import {
  isRateLimited,
  validateGoal,
  cleanGeneratedOutline,
  buildUserPrompt,
  RATE_LIMIT_MAX_REQUESTS,
} from './outlineGeneration.js'
import { parseOutline } from '../../src/utils/outlineParser.js'

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

describe('validateGoal', () => {
  it('accepts a normal goal', () => {
    expect(validateGoal('learn data structures in 8 weeks, 1h/day')).toEqual({ valid: true })
  })

  it('rejects an empty or whitespace-only goal', () => {
    expect(validateGoal('').valid).toBe(false)
    expect(validateGoal('   ').valid).toBe(false)
  })

  it('rejects a non-string goal', () => {
    expect(validateGoal(undefined).valid).toBe(false)
    expect(validateGoal(42).valid).toBe(false)
  })

  it('rejects an excessively long goal', () => {
    expect(validateGoal('a'.repeat(500)).valid).toBe(false)
  })
})

describe('cleanGeneratedOutline', () => {
  it('leaves plain outline text untouched', () => {
    const text = 'Topic\n  Subtopic (1h)'
    expect(cleanGeneratedOutline(text)).toBe(text)
  })

  it('strips a wrapping code fence with a language tag', () => {
    const wrapped = '```text\nTopic\n  Subtopic (1h)\n```'
    expect(cleanGeneratedOutline(wrapped)).toBe('Topic\n  Subtopic (1h)')
  })

  it('strips a wrapping code fence with no language tag', () => {
    const wrapped = '```\nTopic\n  Subtopic (1h)\n```'
    expect(cleanGeneratedOutline(wrapped)).toBe('Topic\n  Subtopic (1h)')
  })

  it('trims surrounding whitespace', () => {
    expect(cleanGeneratedOutline('\n\n  Topic (1h)  \n\n')).toBe('Topic (1h)')
  })

  it('leaves inline backticks that are not a full wrapping fence alone', () => {
    const text = 'Topic\n  Use the `git` command (1h)'
    expect(cleanGeneratedOutline(text)).toBe(text)
  })
})

describe('buildUserPrompt', () => {
  it('includes the trimmed goal', () => {
    expect(buildUserPrompt('  learn rust  ')).toContain('learn rust')
  })
})

describe('generated-outline shape (integration with the real parser)', () => {
  it('a well-formed example outline parses with no errors', () => {
    const example = [
      'Data Structures & Algorithms',
      '  Linear Structures',
      '    Arrays (5h)',
      '    Linked Lists (6h)',
      '    Stacks & Queues (5h)',
      '  Algorithms',
      '    Sorting',
      '      Bubble & Insertion Sort (2h)',
      '      Merge & Quick Sort (3h)',
      '    Searching (4h)',
      '    Dynamic Programming (8h)',
    ].join('\n')

    const { errors, nodes } = parseOutline(cleanGeneratedOutline(example))
    expect(errors).toEqual([])
    expect(nodes.length).toBeGreaterThan(0)
  })
})
