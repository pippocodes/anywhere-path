import type { Topic } from '../types'

/** A lecture's duration in whole seconds — falls back to the legacy `hours` decimal field for topics saved before durationSeconds existed. */
export function getTopicSeconds(topic: Pick<Topic, 'durationSeconds' | 'hours'>): number {
  if (typeof topic.durationSeconds === 'number' && Number.isFinite(topic.durationSeconds)) {
    return Math.max(0, Math.round(topic.durationSeconds))
  }
  return Math.max(0, Math.round((topic.hours ?? 0) * 3600))
}

/** Builds the fields a Topic needs to carry a given duration, keeping the legacy `hours` field consistent for anything that still reads it. */
export function secondsToTopicFields(seconds: number): { durationSeconds: number; hours: number } {
  const s = Math.max(0, Math.round(seconds))
  return { durationSeconds: s, hours: s / 3600 }
}

/**
 * Parses a duration typed as mm:ss, h:mm:ss, "5m 22s", "1h 5m 22s", "5 min
 * 22 sec", or a bare number of minutes (e.g. "5") — anything a human would
 * naturally type for a lecture length. Returns total seconds, or null if
 * the text doesn't look like a duration at all.
 */
export function parseDuration(input: string): number | null {
  const text = input.trim().toLowerCase()
  if (!text) return null

  // "5:22" or "1:05:22" — colon-separated, 2 or 3 parts, each numeric.
  if (/^\d+(:\d{1,2}){1,2}$/.test(text)) {
    const parts = text.split(':').map(Number)
    if (parts.some((p) => !Number.isFinite(p))) return null
    if (parts.length === 2) {
      const [m, s] = parts
      if (s >= 60) return null
      return m * 60 + s
    }
    const [h, m, s] = parts
    if (m >= 60 || s >= 60) return null
    return h * 3600 + m * 60 + s
  }

  // "1h 5m 22s", "5m22s", "90s", "2h", "5 min 22 sec", "2d", "1w", etc. —
  // any combination of w/week, d/day, h/hour, m/min, s/sec tokens.
  const unitPattern =
    /(\d+(?:\.\d+)?)\s*(w|wk|wks|week|weeks|d|day|days|h|hr|hrs|hour|hours|m|min|mins|minute|minutes|s|sec|secs|second|seconds)\b/g
  let match: RegExpExecArray | null
  let total = 0
  let matchedAny = false
  let consumedLength = 0
  while ((match = unitPattern.exec(text))) {
    matchedAny = true
    consumedLength += match[0].length
    const value = parseFloat(match[1])
    const unit = match[2]
    if (unit.startsWith('w')) total += value * 604800
    else if (unit.startsWith('d')) total += value * 86400
    else if (unit.startsWith('h')) total += value * 3600
    else if (unit.startsWith('m')) total += value * 60
    else total += value
  }
  // Require the matched tokens to account for (almost) the whole string,
  // so stray trailing text doesn't get silently ignored.
  if (matchedAny && consumedLength >= text.replace(/\s+/g, '').length - 1) {
    return Math.round(total)
  }

  // A bare number on its own — treat as whole minutes, the most natural
  // reading for something like a lecture list that just says "12".
  if (/^\d+(\.\d+)?$/.test(text)) {
    return Math.round(parseFloat(text) * 60)
  }

  return null
}

/** Formats seconds as mm:ss, or h:mm:ss once it reaches an hour. */
export function formatDuration(totalSeconds: number): string {
  const s = Math.max(0, Math.round(totalSeconds))
  const hours = Math.floor(s / 3600)
  const minutes = Math.floor((s % 3600) / 60)
  const seconds = s % 60

  if (hours > 0) {
    return `${hours}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
  }
  return `${minutes}:${String(seconds).padStart(2, '0')}`
}
