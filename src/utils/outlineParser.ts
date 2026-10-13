import type { Duration, DurationUnit, OutlineError, OutlineNode, OutlineWarning, ParseResult } from '../types'
import { makeId } from './id'

const MAX_LEVEL = 3 // 0=topic, 1=subtopic, 2=module, 3=sub-module

const MINUTES_PER_UNIT: Record<DurationUnit, number> = {
  m: 1,
  h: 60,
  d: 60 * 24,
  w: 60 * 24 * 7,
}

const UNIT_LABEL: Record<DurationUnit, string> = {
  m: 'minute',
  h: 'hour',
  d: 'day',
  w: 'week',
}

// Trailing "(2h)", "(45m)", "(3d)", "(2w)" — case-insensitive, tolerant of
// inner spacing like "( 2 h )".
const DURATION_RE = /\(\s*(\d+(?:\.\d+)?)\s*(h|m|d|w)\s*\)\s*$/i

function parseDurationSuffix(raw: string): { name: string; duration: Duration | null; badValue: boolean } {
  const match = DURATION_RE.exec(raw)
  if (!match) return { name: raw.trim(), duration: null, badValue: false }

  const value = Number(match[1])
  const unit = match[2].toLowerCase() as DurationUnit
  const name = raw.slice(0, match.index).trim()

  if (!Number.isFinite(value) || value <= 0) {
    return { name, duration: null, badValue: true }
  }
  return { name, duration: { value, unit }, badValue: false }
}

/**
 * Measures indentation as a whole number of levels, where one level is
 * either a single tab or exactly two spaces — this lets mixed tabs/spaces
 * work as long as each line's own indentation is internally consistent.
 * Returns `ok: false` when a line has a stray odd space left over, which
 * means its indentation can't be cleanly divided into levels.
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

export function durationToMinutes(duration: Duration): number {
  return duration.value * MINUTES_PER_UNIT[duration.unit]
}

export function minutesToHours(minutes: number): number {
  return minutes / 60
}

/** Sums leaf durations up through the tree (module -> subtopic -> topic). */
export function computeNodeMinutes(node: OutlineNode): number {
  if (node.children.length === 0) {
    return node.duration ? durationToMinutes(node.duration) : 0
  }
  return node.children.reduce((sum, child) => sum + computeNodeMinutes(child), 0)
}

export function computeTotalMinutes(nodes: OutlineNode[]): number {
  return nodes.reduce((sum, node) => sum + computeNodeMinutes(node), 0)
}

function formatDurationValue(value: number): string {
  // Trim to at most one decimal place without leaving a trailing ".0".
  const rounded = Math.round(value * 10) / 10
  return rounded % 1 === 0 ? String(rounded) : rounded.toFixed(1)
}

/** `(2h)`-style short form, for round-tripping back to outline text. */
export function formatDurationShort(duration: Duration): string {
  return `${formatDurationValue(duration.value)}${duration.unit}`
}

/** Human label for display, e.g. "2.5 hours". */
export function formatDurationLong(duration: Duration): string {
  const label = UNIT_LABEL[duration.unit]
  return `${formatDurationValue(duration.value)} ${label}${duration.value === 1 ? '' : 's'}`
}

/** Minutes rolled up into a friendly hour string, e.g. "12.5h". */
export function formatHours(minutes: number): string {
  return `${formatDurationValue(minutesToHours(minutes))}h`
}

/**
 * Parses an indented outline into a tree.
 *
 * Rules:
 * - Indentation: 2 spaces or 1 tab per level, 4 levels deep (0-3).
 * - A trailing `(2h)` / `(45m)` / `(3d)` / `(2w)` sets that line's duration.
 * - Blank lines are ignored.
 * - A line indented more than one level past its predecessor, indented
 *   before any level-0 line exists, indented past level 3, or with
 *   inconsistent (odd) spacing produces a friendly `errors` entry with its
 *   line number — parsing recovers by clamping the level and continues, so
 *   one bad line doesn't blank the whole preview.
 * - A leaf line (no children) with no duration is defaulted to 1h and
 *   noted in `warnings`, also with a line number.
 */
export function parseOutline(text: string): ParseResult {
  const errors: OutlineError[] = []
  const warnings: OutlineWarning[] = []
  const roots: OutlineNode[] = []
  const stack: OutlineNode[] = [] // stack[level] = last node opened at that level

  let previousLevel = -1

  const lines = text.split('\n')
  for (let i = 0; i < lines.length; i++) {
    const rawLine = lines[i]
    const lineNumber = i + 1
    if (rawLine.trim() === '') continue

    const { level: measuredLevel, ok, rest } = measureIndent(rawLine)

    if (!ok) {
      errors.push({
        line: lineNumber,
        message: `Inconsistent indentation — use 2 spaces or 1 tab per level (found a stray space).`,
      })
    }

    let level = measuredLevel

    if (previousLevel === -1 && level > 0) {
      errors.push({ line: lineNumber, message: `The first item can't be indented — it should start at level 0.` })
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
        message: `Too deeply nested (level ${level}) — only 4 levels are supported: topic, subtopic, module, sub-module.`,
      })
      level = MAX_LEVEL
    }

    const { name, duration, badValue } = parseDurationSuffix(rest)

    if (badValue) {
      warnings.push({ line: lineNumber, message: `Duration must be a positive number — ignoring it for "${name}".` })
    }

    if (!name) {
      errors.push({ line: lineNumber, message: `Missing a name for this line.` })
      continue
    }

    const node: OutlineNode = { id: makeId('node'), name, level, duration, children: [], line: lineNumber }

    stack.length = level
    stack[level] = node

    if (level === 0) {
      roots.push(node)
    } else {
      const parent = stack[level - 1]
      parent.children.push(node)
    }

    previousLevel = level
  }

  applyDefaultDurations(roots, warnings)

  return { nodes: roots, errors, warnings }
}

function applyDefaultDurations(nodes: OutlineNode[], warnings: OutlineWarning[]): void {
  for (const node of nodes) {
    if (node.children.length === 0) {
      if (!node.duration) {
        node.duration = { value: 1, unit: 'h' }
        warnings.push({ line: node.line, message: `"${node.name}" has no duration — defaulted to 1h.` })
      }
    } else {
      applyDefaultDurations(node.children, warnings)
    }
  }
}

/** Inverse of `parseOutline` — rebuilds outline text from a tree, for export/import. */
export function serializeOutline(nodes: OutlineNode[], indent = '  '): string {
  const lines: string[] = []

  function visit(node: OutlineNode): void {
    const prefix = indent.repeat(node.level)
    const suffix = node.duration ? ` (${formatDurationShort(node.duration)})` : ''
    lines.push(`${prefix}${node.name}${suffix}`)
    node.children.forEach(visit)
  }

  nodes.forEach(visit)
  return lines.join('\n')
}
