import { describe, it, expect } from 'vitest'
import {
  parseOutline,
  serializeOutline,
  computeNodeMinutes,
  computeTotalMinutes,
  durationToMinutes,
  formatDurationShort,
  formatHours,
} from './outlineParser'

describe('parseOutline', () => {
  it('parses a simple 3-level outline with durations', () => {
    const text = [
      'Web Development (2w)',
      '  Frontend Basics',
      '    HTML Basics (4h)',
      '    CSS Fundamentals (5h)',
    ].join('\n')

    const { nodes, errors, warnings } = parseOutline(text)

    expect(errors).toEqual([])
    expect(warnings).toEqual([])
    expect(nodes).toHaveLength(1)
    expect(nodes[0].name).toBe('Web Development')
    expect(nodes[0].level).toBe(0)
    expect(nodes[0].duration).toEqual({ value: 2, unit: 'w' })
    expect(nodes[0].children).toHaveLength(1)

    const frontend = nodes[0].children[0]
    expect(frontend.name).toBe('Frontend Basics')
    expect(frontend.level).toBe(1)
    expect(frontend.children).toHaveLength(2)
    expect(frontend.children[0]).toMatchObject({ name: 'HTML Basics', level: 2, duration: { value: 4, unit: 'h' } })
  })

  it('supports all 4 levels: topic, subtopic, module, sub-module', () => {
    const text = [
      'Topic',
      '  Subtopic',
      '    Module (3h)',
      '      Sub-module (1h)',
    ].join('\n')

    const { nodes, errors } = parseOutline(text)
    expect(errors).toEqual([])
    const sub = nodes[0].children[0].children[0].children[0]
    expect(sub).toMatchObject({ name: 'Sub-module', level: 3, duration: { value: 1, unit: 'h' } })
  })

  it('parses every duration unit (m, h, d, w)', () => {
    const text = ['Topic', '  A (30m)', '  B (2h)', '  C (3d)', '  D (2w)'].join('\n')
    const { nodes } = parseOutline(text)
    const [a, b, c, d] = nodes[0].children
    expect(a.duration).toEqual({ value: 30, unit: 'm' })
    expect(b.duration).toEqual({ value: 2, unit: 'h' })
    expect(c.duration).toEqual({ value: 3, unit: 'd' })
    expect(d.duration).toEqual({ value: 2, unit: 'w' })
  })

  it('tolerates spacing inside the duration parens', () => {
    const text = 'Topic ( 2.5 h )'
    const { nodes, errors } = parseOutline(text)
    expect(errors).toEqual([])
    expect(nodes[0].duration).toEqual({ value: 2.5, unit: 'h' })
  })

  it('treats tabs as one level each', () => {
    const text = ['Topic', '\tSubtopic', '\t\tModule (1h)'].join('\n')
    const { nodes, errors } = parseOutline(text)
    expect(errors).toEqual([])
    expect(nodes[0].children[0].level).toBe(1)
    expect(nodes[0].children[0].children[0].level).toBe(2)
  })

  it('ignores blank lines between items', () => {
    const text = ['Topic', '', '  Subtopic (1h)', '', '', '  Other (1h)'].join('\n')
    const { nodes, errors } = parseOutline(text)
    expect(errors).toEqual([])
    expect(nodes[0].children).toHaveLength(2)
  })

  it('defaults a missing duration on a leaf node and warns with the line number', () => {
    const text = ['Topic', '  Subtopic no duration'].join('\n')
    const { nodes, warnings } = parseOutline(text)
    expect(nodes[0].children[0].duration).toEqual({ value: 1, unit: 'h' })
    expect(warnings).toHaveLength(1)
    expect(warnings[0].line).toBe(2)
    expect(warnings[0].message).toMatch(/no duration/i)
  })

  it('does not require a duration on a container (non-leaf) node', () => {
    const text = ['Topic', '  Subtopic (1h)'].join('\n')
    const { nodes, warnings } = parseOutline(text)
    expect(nodes[0].duration).toBeNull()
    expect(warnings).toEqual([])
  })

  it('reports a friendly error with the line number when the first line is indented', () => {
    const text = '  Should not be indented'
    const { errors, nodes } = parseOutline(text)
    expect(errors).toHaveLength(1)
    expect(errors[0].line).toBe(1)
    expect(errors[0].message).toMatch(/first item/i)
    // Recovers by treating it as level 0 rather than dropping it.
    expect(nodes[0].level).toBe(0)
  })

  it('reports a friendly error with the line number when indentation skips a level', () => {
    const text = ['Topic', '    Jumped two levels (1h)'].join('\n')
    const { errors, nodes } = parseOutline(text)
    expect(errors).toHaveLength(1)
    expect(errors[0].line).toBe(2)
    expect(errors[0].message).toMatch(/jumped/i)
    // Recovers by clamping to one level deeper instead of losing the line.
    expect(nodes[0].children[0].level).toBe(1)
  })

  it('reports a friendly error when nesting goes past level 3', () => {
    const text = ['Topic', '  Subtopic', '    Module', '      Sub-module', '        Too deep (1h)'].join('\n')
    const { errors, nodes } = parseOutline(text)
    expect(errors).toHaveLength(1)
    expect(errors[0].line).toBe(5)
    expect(errors[0].message).toMatch(/too deeply nested/i)
    // Clamped to a level-3 sibling of "Sub-module" under the same parent module.
    const module = nodes[0].children[0].children[0]
    expect(module.children).toHaveLength(2)
    expect(module.children[1]).toMatchObject({ name: 'Too deep', level: 3 })
  })

  it('reports inconsistent indentation (odd leftover spacing)', () => {
    const text = ['Topic', '   Odd indent (1h)'].join('\n')
    const { errors } = parseOutline(text)
    expect(errors.some((e) => e.line === 2 && /inconsistent indentation/i.test(e.message))).toBe(true)
  })

  it('flags a non-positive duration value instead of crashing', () => {
    const text = 'Topic (0h)'
    const { nodes, warnings } = parseOutline(text)
    // Bad value is ignored, then the leaf-default pass fills it in and warns again.
    expect(nodes[0].duration).toEqual({ value: 1, unit: 'h' })
    expect(warnings.length).toBeGreaterThanOrEqual(1)
  })

  it('errors on a line with no name', () => {
    const text = ['Topic', '  (2h)'].join('\n')
    const { errors, nodes } = parseOutline(text)
    expect(errors.some((e) => e.line === 2 && /missing a name/i.test(e.message))).toBe(true)
    expect(nodes[0].children).toHaveLength(0)
  })
})

describe('computeNodeMinutes / computeTotalMinutes', () => {
  it('rolls leaf durations up through subtopic and topic', () => {
    const text = [
      'Topic',
      '  Subtopic A',
      '    Module 1 (2h)',
      '    Module 2 (3h)',
      '  Subtopic B',
      '    Module 3 (1h)',
    ].join('\n')
    const { nodes } = parseOutline(text)

    const subtopicA = nodes[0].children[0]
    const subtopicB = nodes[0].children[1]
    expect(computeNodeMinutes(subtopicA)).toBe(5 * 60)
    expect(computeNodeMinutes(subtopicB)).toBe(1 * 60)
    expect(computeNodeMinutes(nodes[0])).toBe(6 * 60)
    expect(computeTotalMinutes(nodes)).toBe(6 * 60)
  })

  it('converts units consistently (1d = 24h, 1w = 7d)', () => {
    expect(durationToMinutes({ value: 1, unit: 'h' })).toBe(60)
    expect(durationToMinutes({ value: 1, unit: 'd' })).toBe(24 * 60)
    expect(durationToMinutes({ value: 1, unit: 'w' })).toBe(7 * 24 * 60)
  })
})

describe('formatDurationShort / formatHours', () => {
  it('formats whole and fractional values without a trailing .0', () => {
    expect(formatDurationShort({ value: 2, unit: 'h' })).toBe('2h')
    expect(formatDurationShort({ value: 2.5, unit: 'h' })).toBe('2.5h')
    expect(formatHours(90)).toBe('1.5h')
    expect(formatHours(120)).toBe('2h')
  })
})

describe('serializeOutline', () => {
  it('round-trips parseOutline output back to equivalent outline text', () => {
    const text = [
      'Web Development (2w)',
      '  Frontend Basics',
      '    HTML Basics (4h)',
      '    CSS Fundamentals (5h)',
      '  Shipping It',
      '    Deploy (2h)',
    ].join('\n')

    const { nodes } = parseOutline(text)
    const roundTripped = serializeOutline(nodes)
    const reparsed = parseOutline(roundTripped)

    expect(reparsed.errors).toEqual([])
    expect(reparsed.nodes).toMatchObject(
      nodes.map((n) => ({ name: n.name, level: n.level })) as unknown as typeof reparsed.nodes
    )
    expect(computeTotalMinutes(reparsed.nodes)).toBe(computeTotalMinutes(nodes))
  })
})
