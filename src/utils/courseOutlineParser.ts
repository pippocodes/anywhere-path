import type { Course, CourseModule, Topic } from '../types'
import { makeId } from './id'
import { parseDuration, formatDuration } from './duration'

// 0 = course (one per unindented line), 1 = section, 2 = module, 3 = sub-module,
// 4 = always a leaf lecture — nothing can nest under a clamped level-4 line
// (see the clamping logic in parseCourseOutline), which is what keeps
// CourseModule nesting within its 3-level cap.
const MAX_LEVEL = 4

export interface CourseOutlineNode {
  id: string
  name: string
  level: number
  durationSeconds: number | null
  children: CourseOutlineNode[]
  line: number
}

export interface CourseOutlineError {
  line: number
  message: string
}

export type CourseOutlineWarning = CourseOutlineError

export interface CourseOutlineParseResult {
  // One entry per unindented (level-0) line — each becomes its own course,
  // unlike the RoadmapDoc outline parser where level-0 siblings share one doc.
  courses: CourseOutlineNode[]
  errors: CourseOutlineError[]
  warnings: CourseOutlineWarning[]
}

// A trailing "(...)" on a line — content can be anything parseDuration
// understands: "5:22", "1:05:22", "5m 22s", "2h", "1h 30m", etc.
const TRAILING_PARENS_RE = /\(([^()]*)\)\s*$/

/**
 * Same mixed tab/2-space indentation measurement as the RoadmapDoc outline
 * parser (duplicated rather than imported — this parser is deliberately
 * kept separate so neither can break the other).
 */
function measureIndent(line: string): { level: number; ok: boolean; rest: string } {
  let i = 0
  let level = 0
  while (i < line.length) {
    if (line[i] === '\t') {
      level++
      i++
      continue
    }
    if (line[i] === ' ' && line[i + 1] === ' ') {
      level++
      i += 2
      continue
    }
    break
  }
  const rest = line.slice(i)
  const ok = !rest.startsWith(' ') && !rest.startsWith('\t')
  return { level, ok, rest }
}

function splitDurationSuffix(raw: string): { name: string; durationText: string | null } {
  const match = TRAILING_PARENS_RE.exec(raw)
  if (!match) return { name: raw.trim(), durationText: null }
  return { name: raw.slice(0, match.index).trim(), durationText: match[1].trim() }
}

/**
 * Parses pasted text into one or more course trees. Indentation is 2
 * spaces or 1 tab per level; every *unindented* line starts a brand new
 * course (not a sibling within one shared tree). A trailing `(5:22)` /
 * `(1h 30m)` / `(2h)` sets a line's duration — required on leaf lines
 * (the ones with no children under them), since those become lectures.
 */
export function parseCourseOutline(text: string): CourseOutlineParseResult {
  const errors: CourseOutlineError[] = []
  const warnings: CourseOutlineWarning[] = []
  const courses: CourseOutlineNode[] = []
  const stack: CourseOutlineNode[] = []

  let previousLevel = -1

  const lines = text.split('\n')
  for (let i = 0; i < lines.length; i++) {
    const rawLine = lines[i]
    const lineNumber = i + 1
    if (rawLine.trim() === '') continue

    const { level: measuredLevel, ok, rest } = measureIndent(rawLine)

    if (!ok) {
      errors.push({ line: lineNumber, message: 'Inconsistent indentation — use 2 spaces or 1 tab per level (found a stray space).' })
    }

    let level = measuredLevel

    if (previousLevel === -1 && level > 0) {
      errors.push({ line: lineNumber, message: "The first line can't be indented — it starts a course at level 0." })
      level = 0
    } else if (level > previousLevel + 1) {
      errors.push({
        line: lineNumber,
        message: `Jumped from level ${previousLevel} to level ${level} — indent by only one level (2 spaces or 1 tab) at a time.`,
      })
      level = previousLevel + 1
    }

    if (level > MAX_LEVEL) {
      errors.push({
        line: lineNumber,
        message: `Too deeply nested (level ${level}) — a course can only go course → subtopic → module → sub-module.`,
      })
      level = MAX_LEVEL
    }

    const { name, durationText } = splitDurationSuffix(rest)

    let durationSeconds: number | null = null
    if (durationText !== null) {
      if (durationText === '') {
        errors.push({ line: lineNumber, message: 'Empty parentheses — remove them or put a duration inside, like (5:22).' })
      } else {
        const parsed = parseDuration(durationText)
        if (parsed === null) {
          errors.push({ line: lineNumber, message: `Can't read the duration "${durationText}" — try something like 5:22, 1h 30m, or 2h.` })
        } else {
          durationSeconds = parsed
        }
      }
    }

    if (!name) {
      errors.push({ line: lineNumber, message: 'This line needs a title.' })
      previousLevel = level
      continue
    }

    const parent = level === 0 ? null : stack[level - 1]
    const siblingIndex = parent ? parent.children.length : courses.length
    const id = parent ? `${parent.id}.${siblingIndex}` : `course${siblingIndex}`

    const node: CourseOutlineNode = { id, name, level, durationSeconds, children: [], line: lineNumber }

    stack.length = level
    stack[level] = node

    if (parent) {
      parent.children.push(node)
    } else {
      courses.push(node)
    }

    previousLevel = level
  }

  // Validate from each course's children down — a course root itself is
  // just a name, never a lecture, even when it has no children of its own.
  for (const course of courses) {
    validateLeafDurations(course.children, errors)
  }

  return { courses, errors, warnings }
}

function validateLeafDurations(nodes: CourseOutlineNode[], errors: CourseOutlineError[]): void {
  for (const node of nodes) {
    if (node.children.length === 0) {
      if (node.durationSeconds === null) {
        errors.push({ line: node.line, message: `"${node.name}" needs a duration, like (5:22).` })
      }
    } else {
      validateLeafDurations(node.children, errors)
    }
  }
}

export function totalSecondsForNode(node: CourseOutlineNode): number {
  if (node.children.length === 0) return node.durationSeconds ?? 0
  return node.children.reduce((sum, c) => sum + totalSecondsForNode(c), 0)
}

export function totalLecturesForNode(node: CourseOutlineNode): number {
  if (node.children.length === 0) return 1
  return node.children.reduce((sum, c) => sum + totalLecturesForNode(c), 0)
}

/** Like the two helpers above, but for a course root (level 0) specifically — a childless course has 0 lectures, not 1, since the root itself is never a lecture. */
export function totalSecondsForCourse(node: CourseOutlineNode): number {
  return node.children.reduce((sum, c) => sum + totalSecondsForNode(c), 0)
}

export function totalLecturesForCourse(node: CourseOutlineNode): number {
  return node.children.reduce((sum, c) => sum + totalLecturesForNode(c), 0)
}

function nodeToTopic(node: CourseOutlineNode): Topic {
  const seconds = node.durationSeconds ?? 0
  return { id: makeId('topic'), name: node.name, hours: seconds / 3600, done: false, durationSeconds: seconds }
}

function childrenToModules(children: CourseOutlineNode[]): CourseModule[] {
  const leaves = children.filter((c) => c.children.length === 0)
  const containers = children.filter((c) => c.children.length > 0)
  const modules = containers.map(nodeToModule)
  // Lectures typed directly under a course or a module with no named
  // section of their own still need a CourseModule to live in (Course has
  // no top-level topics list) — give them one, kept first so they read as
  // "the course's own lectures" ahead of its named sections.
  if (leaves.length > 0) {
    modules.unshift({ id: makeId('module'), name: 'Modules', topics: leaves.map(nodeToTopic) })
  }
  return modules
}

function nodeToModule(node: CourseOutlineNode): CourseModule {
  const leaves = node.children.filter((c) => c.children.length === 0)
  const containers = node.children.filter((c) => c.children.length > 0)
  return {
    id: makeId('module'),
    name: node.name,
    topics: leaves.map(nodeToTopic),
    modules: containers.length > 0 ? containers.map(nodeToModule) : undefined,
  }
}

/** Converts one parsed course-outline root into a real `Course`, ready to save. */
export function courseOutlineNodeToCourse(node: CourseOutlineNode): Pick<Course, 'id' | 'name' | 'modules'> {
  return { id: makeId('course'), name: node.name, modules: childrenToModules(node.children) }
}

/** Inverse of parsing — rebuilds outline text from a saved course, for the "Edit as text" round trip. */
export function serializeCourseToOutline(course: Pick<Course, 'name' | 'modules'>, indent = '  '): string {
  const lines: string[] = [course.name]

  function visitModule(module: CourseModule, level: number): void {
    lines.push(`${indent.repeat(level)}${module.name}`)
    for (const topic of module.topics) {
      const seconds = topic.durationSeconds ?? Math.round((topic.hours ?? 0) * 3600)
      lines.push(`${indent.repeat(level + 1)}${topic.name} (${formatDuration(seconds)})`)
    }
    for (const child of module.modules ?? []) {
      visitModule(child, level + 1)
    }
  }

  for (const module of course.modules) {
    visitModule(module, 1)
  }

  return lines.join('\n')
}
