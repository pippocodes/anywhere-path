import { parseDuration } from './duration'

export interface BulkLectureLine {
  line: number // 1-based, matches what the user sees in the textarea
  raw: string
  title: string
  durationSeconds: number | null
  error: string | null
}

export interface BulkLectureResult {
  lines: BulkLectureLine[]
  valid: { title: string; durationSeconds: number }[]
  hasErrors: boolean
}

// Tried in order: "Title (5:22)", "Title - 5:22" / "Title — 5:22", "Title, 5:22",
// and finally "Title 5:22" (duration as the trailing whitespace-separated token).
const PATTERNS: RegExp[] = [
  /^(.*\S)\s*\(([^)]+)\)\s*$/, // Intro to Arrays (5:22)
  /^(.*\S)\s*[-—]\s*([^-—]+)$/, // Intro to Arrays - 5:22
  /^(.*\S)\s*,\s*([^,]+)$/, // Intro to Arrays, 5:22
  /^(.*\S)\s+(\S+)$/, // Intro to Arrays 5:22
]

/**
 * Parses one lecture per line, e.g. "Intro to Arrays (5:22)" — tolerant of
 * a few separator styles (dash, comma, or just trailing whitespace) since
 * people paste lists in all sorts of shapes. Every line gets a verdict
 * (valid, or a specific error) so the caller can show a full preview
 * before committing anything.
 */
export function parseBulkLectures(text: string): BulkLectureResult {
  const rawLines = text.split('\n')
  const lines: BulkLectureLine[] = []

  rawLines.forEach((raw, i) => {
    const trimmed = raw.trim()
    if (!trimmed) return // blank lines are silently skipped, not errors

    const lineNumber = i + 1
    let title: string | null = null
    let durationSeconds: number | null = null

    for (const pattern of PATTERNS) {
      const match = trimmed.match(pattern)
      if (!match) continue
      const candidateDuration = parseDuration(match[2])
      if (candidateDuration === null) continue
      title = match[1].trim()
      durationSeconds = candidateDuration
      break
    }

    if (title && durationSeconds !== null) {
      lines.push({ line: lineNumber, raw, title, durationSeconds, error: null })
      return
    }

    // Nothing matched — figure out the most helpful error to show.
    const error = /\d/.test(trimmed)
      ? `Couldn't read a duration on this line — try "Title (5:22)" or "Title (1:05:22)".`
      : `No duration found — add one like "(5:22)" at the end.`
    lines.push({ line: lineNumber, raw, title: trimmed, durationSeconds: null, error })
  })

  const valid = lines
    .filter((l): l is BulkLectureLine & { durationSeconds: number } => l.error === null && l.durationSeconds !== null)
    .map((l) => ({ title: l.title, durationSeconds: l.durationSeconds }))

  return { lines, valid, hasErrors: lines.some((l) => l.error !== null) }
}
