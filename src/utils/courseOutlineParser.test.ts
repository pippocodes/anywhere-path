import { describe, it, expect } from 'vitest'
import {
  parseCourseOutline,
  courseOutlineNodeToCourse,
  serializeCourseToOutline,
  totalSecondsForCourse,
  totalLecturesForCourse,
} from './courseOutlineParser'

describe('parseCourseOutline', () => {
  it('parses a simple course with sections and leaf lectures', () => {
    const text = [
      'Anatomy Basics',
      '  Skeletal System',
      '    Bones of the arm (5:22)',
      '    Bones of the leg (7:10)',
      '  Muscular System',
      '    Major muscle groups (12:40)',
    ].join('\n')

    const result = parseCourseOutline(text)
    expect(result.errors).toHaveLength(0)
    expect(result.courses).toHaveLength(1)

    const root = result.courses[0]
    expect(root.name).toBe('Anatomy Basics')
    expect(root.children).toHaveLength(2)
    expect(root.children[0].name).toBe('Skeletal System')
    expect(root.children[0].children.map((c) => c.name)).toEqual(['Bones of the arm', 'Bones of the leg'])
    expect(totalSecondsForCourse(root)).toBe(5 * 60 + 22 + 7 * 60 + 10 + 12 * 60 + 40)
    expect(totalLecturesForCourse(root)).toBe(3)
  })

  it('treats each unindented line as a separate course', () => {
    const text = ['Course A', '  Section\n    Lecture (2h)', 'Course B', '  Section\n    Lecture (1h)'].join('\n')
    const result = parseCourseOutline(text)
    expect(result.courses).toHaveLength(2)
    expect(result.courses[0].name).toBe('Course A')
    expect(result.courses[1].name).toBe('Course B')
  })

  it('accepts tab indentation and ignores blank lines between items', () => {
    const text = ['Course', '\tSection', '\t\tLecture (5:22)', '', '\t\tLecture two (1h)', ''].join('\n')
    const result = parseCourseOutline(text)
    expect(result.errors).toHaveLength(0)
    expect(result.courses).toHaveLength(1)
    expect(result.courses[0].children[0].children.map((c) => c.name)).toEqual(['Lecture', 'Lecture two'])
  })

  it('accepts every duration format the spec calls out', () => {
    const forms = ['(5:22)', '(1:05:22)', '(2h)', '(45m)', '(1h 30m)', '(5m 22s)']
    for (const form of forms) {
      const result = parseCourseOutline(`Course\n  Section\n    Lecture ${form}`)
      expect(result.errors, `expected ${form} to parse cleanly`).toHaveLength(0)
      const lecture = result.courses[0].children[0].children[0]
      expect(lecture.durationSeconds).not.toBeNull()
    }
  })

  it('supports a module nested inside a module (3 levels under the course)', () => {
    const text = ['Course', '  Section', '    Module', '      Sub-module', '        Lecture (5:22)'].join('\n')
    const result = parseCourseOutline(text)
    expect(result.errors).toHaveLength(0)
    const section = result.courses[0].children[0]
    const mod = section.children[0]
    const sub = mod.children[0]
    expect(sub.children[0].name).toBe('Lecture')
  })

  it('reports a friendly, line-numbered error for a leaf with no duration', () => {
    const result = parseCourseOutline('Course\n  Section\n    Lecture with no duration')
    expect(result.errors).toEqual([{ line: 3, message: '"Lecture with no duration" needs a duration, like (5:22).' }])
  })

  it('reports a friendly, line-numbered error for an unreadable duration', () => {
    const result = parseCourseOutline('Course\n  Section\n    Lecture (not-a-duration)')
    expect(result.errors[0]).toEqual({ line: 3, message: `Can't read the duration "not-a-duration" — try something like 5:22, 1h 30m, or 2h.` })
  })

  it('reports a friendly, line-numbered error for a missing title', () => {
    const result = parseCourseOutline('Course\n  (5:22)')
    expect(result.errors).toEqual([{ line: 2, message: 'This line needs a title.' }])
  })

  it('reports an error and recovers on inconsistent indentation', () => {
    const result = parseCourseOutline('Course\n  Section\n   Lecture (5:22)') // 3 stray spaces
    expect(result.errors.some((e) => e.message.includes('Inconsistent indentation'))).toBe(true)
  })

  it('clamps lines nested deeper than a sub-module and reports it', () => {
    const text = ['Course', '  Section', '    Module', '      Sub-module', '        Too deep', '          Way too deep (5:22)'].join('\n')
    const result = parseCourseOutline(text)
    expect(result.errors.some((e) => e.message.includes('Too deeply nested'))).toBe(true)
  })
})

describe('courseOutlineNodeToCourse', () => {
  it('builds a Course whose module tree mirrors the parsed outline', () => {
    const text = ['Anatomy Basics', '  Skeletal System', '    Bones of the arm (5:22)', '  Muscular System', '    Major muscle groups (12:40)'].join('\n')
    const { courses } = parseCourseOutline(text)
    const course = courseOutlineNodeToCourse(courses[0])

    expect(course.name).toBe('Anatomy Basics')
    expect(course.modules).toHaveLength(2)
    expect(course.modules[0].name).toBe('Skeletal System')
    expect(course.modules[0].topics[0]).toMatchObject({ name: 'Bones of the arm', durationSeconds: 5 * 60 + 22 })
  })

  it('wraps lectures typed directly under the course in an implicit "Lectures" section', () => {
    const { courses } = parseCourseOutline('Course\n  Lecture one (5:22)')
    const course = courseOutlineNodeToCourse(courses[0])
    expect(course.modules).toHaveLength(1)
    expect(course.modules[0].name).toBe('Lectures')
    expect(course.modules[0].topics[0].name).toBe('Lecture one')
  })

  it('preserves nested sub-modules on the saved Course', () => {
    const text = ['Course', '  Section', '    Module', '      Sub-module', '        Lecture (5:22)'].join('\n')
    const { courses } = parseCourseOutline(text)
    const course = courseOutlineNodeToCourse(courses[0])
    const section = course.modules[0]
    const mod = section.modules![0]
    const sub = mod.modules![0]
    expect(sub.topics[0].name).toBe('Lecture')
  })
})

// Ids are freshly generated on every conversion, so round-trip comparisons
// strip them and compare only the content shape.
function stripIds(modules: ReturnType<typeof courseOutlineNodeToCourse>['modules']): unknown {
  return modules.map((m) => ({
    name: m.name,
    topics: m.topics.map((t) => ({ name: t.name, durationSeconds: t.durationSeconds })),
    modules: m.modules ? stripIds(m.modules) : undefined,
  }))
}

describe('serializeCourseToOutline', () => {
  it('round-trips a course back into parseable, equivalent outline text', () => {
    const original = ['Anatomy Basics', '  Skeletal System', '    Bones of the arm (5:22)', '    Bones of the leg (7:10)'].join('\n')
    const course = courseOutlineNodeToCourse(parseCourseOutline(original).courses[0])
    const text = serializeCourseToOutline(course)

    const reparsed = parseCourseOutline(text)
    expect(reparsed.errors).toHaveLength(0)
    const roundTripped = courseOutlineNodeToCourse(reparsed.courses[0])
    expect(roundTripped.name).toBe(course.name)
    expect(stripIds(roundTripped.modules)).toEqual(stripIds(course.modules))
  })
})
