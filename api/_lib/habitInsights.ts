// Pure helpers for /api/habit-insights — kept framework/SDK-free so they're
// directly unit-testable without mocking the Anthropic client or Supabase.
import { MIN_DAYS_OF_DATA, type HabitInsightInput, type HabitInsightStats } from '../../src/utils/habitInsightStats.js'

export const RATE_LIMIT_MAX_REQUESTS = 5
export const RATE_LIMIT_WINDOW_MS = 24 * 60 * 60 * 1000 // 24 hours

/** True once a user has made `RATE_LIMIT_MAX_REQUESTS` or more AI calls within the current window — cache hits don't count. */
export function isRateLimited(requestCountInWindow: number): boolean {
  return requestCountInWindow >= RATE_LIMIT_MAX_REQUESTS
}

const MAX_HABITS = 20
const NAME_MAX_LENGTH = 80
const CATEGORY_MAX_LENGTH = 40

export interface StatsValidation {
  valid: boolean
  error?: string
  stats?: HabitInsightStats
}

function isFiniteNumber(v: unknown): v is number {
  return typeof v === 'number' && Number.isFinite(v)
}

function isPercent(v: unknown): v is number {
  return isFiniteNumber(v) && v >= -100 && v <= 100
}

/**
 * Defensive runtime validation of the client-submitted aggregated stats —
 * this is the only data that reaches the model, so its shape and size are
 * validated here rather than trusted blindly, independent of whatever the
 * client already checked.
 */
export function validateStats(body: unknown): StatsValidation {
  if (!body || typeof body !== 'object') return { valid: false, error: 'Missing stats.' }
  const s = body as Record<string, unknown>

  if (typeof s.referenceDate !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(s.referenceDate)) {
    return { valid: false, error: 'Invalid referenceDate.' }
  }
  if (!isFiniteNumber(s.daysOfData) || s.daysOfData < 0) {
    return { valid: false, error: 'Invalid daysOfData.' }
  }
  if (s.daysOfData < MIN_DAYS_OF_DATA) {
    return { valid: false, error: 'Not enough tracking history yet for AI insights.' }
  }
  if (!isPercent(s.overallMonthPercent) || !isFiniteNumber(s.overallMonthDeltaPercent)) {
    return { valid: false, error: 'Invalid overall stats.' }
  }
  if (!isFiniteNumber(s.bestCurrentStreak) || s.bestCurrentStreak < 0 || s.bestCurrentStreak > 3650) {
    return { valid: false, error: 'Invalid streak.' }
  }
  if (!isFiniteNumber(s.perfectDaysThisMonth) || s.perfectDaysThisMonth < 0 || s.perfectDaysThisMonth > 31) {
    return { valid: false, error: 'Invalid perfectDaysThisMonth.' }
  }
  if (!Array.isArray(s.weekdayPattern) || s.weekdayPattern.length !== 7) {
    return { valid: false, error: 'Invalid weekdayPattern.' }
  }
  for (const w of s.weekdayPattern) {
    if (!w || typeof w !== 'object') return { valid: false, error: 'Invalid weekdayPattern entry.' }
    const wd = w as Record<string, unknown>
    if (typeof wd.label !== 'string' || wd.label.length > 4 || !isPercent(wd.percent)) {
      return { valid: false, error: 'Invalid weekdayPattern entry.' }
    }
  }
  if (!Array.isArray(s.habits) || s.habits.length === 0 || s.habits.length > MAX_HABITS) {
    return { valid: false, error: 'Invalid habits list.' }
  }

  const habits: HabitInsightInput[] = []
  for (const h of s.habits) {
    if (!h || typeof h !== 'object') return { valid: false, error: 'Invalid habit entry.' }
    const hh = h as Record<string, unknown>
    if (typeof hh.name !== 'string' || hh.name.trim().length === 0 || hh.name.length > NAME_MAX_LENGTH) {
      return { valid: false, error: 'Invalid habit name.' }
    }
    if (hh.category !== null && (typeof hh.category !== 'string' || hh.category.length > CATEGORY_MAX_LENGTH)) {
      return { valid: false, error: 'Invalid habit category.' }
    }
    if (!isFiniteNumber(hh.currentStreak) || hh.currentStreak < 0 || hh.currentStreak > 3650) {
      return { valid: false, error: 'Invalid currentStreak.' }
    }
    if (!isFiniteNumber(hh.bestStreak) || hh.bestStreak < 0 || hh.bestStreak > 3650) {
      return { valid: false, error: 'Invalid bestStreak.' }
    }
    if (!isPercent(hh.monthCompletionPercent) || !isFiniteNumber(hh.monthDeltaPercent)) {
      return { valid: false, error: 'Invalid habit completion stats.' }
    }
    habits.push({
      name: hh.name,
      category: hh.category as string | null,
      currentStreak: hh.currentStreak,
      bestStreak: hh.bestStreak,
      monthCompletionPercent: hh.monthCompletionPercent,
      monthDeltaPercent: hh.monthDeltaPercent,
    })
  }

  return {
    valid: true,
    stats: {
      referenceDate: s.referenceDate,
      daysOfData: s.daysOfData,
      overallMonthPercent: s.overallMonthPercent,
      overallMonthDeltaPercent: s.overallMonthDeltaPercent,
      bestCurrentStreak: s.bestCurrentStreak,
      perfectDaysThisMonth: s.perfectDaysThisMonth,
      weekdayPattern: s.weekdayPattern as { label: string; percent: number }[],
      habits,
    },
  }
}

export interface HabitInsightsResult {
  focusOn: string[]
  keepGoing: string[]
  easeUp: string[]
}

const ITEM_MAX_LENGTH = 320

function isValidItemArray(v: unknown, min: number, max: number): v is string[] {
  if (!Array.isArray(v) || v.length < min || v.length > max) return false
  return v.every((item) => typeof item === 'string' && item.trim().length > 0 && item.length <= ITEM_MAX_LENGTH)
}

/** Strips a single wrapping ``` fence if the whole response turned out to be one — same defensive stripping as cleanGeneratedOutline in outlineGeneration.ts, duplicated here since these are two independently unit-testable endpoints. */
function stripFence(raw: string): string {
  const text = raw.trim()
  const match = text.match(/^```[a-zA-Z]*\n([\s\S]*?)\n?```$/)
  return match ? match[1].trim() : text
}

/**
 * Parses and validates the model's raw text response against the required
 * { focusOn, keepGoing, easeUp } shape — throws a descriptive Error on
 * anything that doesn't match, which the endpoint turns into a 502 (the
 * client then falls back to rule-based insights, never a page error).
 */
export function parseInsightsResponse(raw: string): HabitInsightsResult {
  let parsed: unknown
  try {
    parsed = JSON.parse(stripFence(raw))
  } catch {
    throw new Error('Response was not valid JSON.')
  }
  if (!parsed || typeof parsed !== 'object') throw new Error('Response was not a JSON object.')
  const p = parsed as Record<string, unknown>

  if (!isValidItemArray(p.focusOn, 1, 3)) throw new Error('focusOn must be 1-3 non-empty strings.')
  if (!isValidItemArray(p.keepGoing, 1, 2)) throw new Error('keepGoing must be 1-2 non-empty strings.')
  if (!isValidItemArray(p.easeUp, 0, 2)) throw new Error('easeUp must be 0-2 strings.')

  return { focusOn: p.focusOn, keepGoing: p.keepGoing, easeUp: p.easeUp }
}

export function buildSystemPrompt(): string {
  return `You are an encouraging, specific habit-tracking coach. You'll be given a JSON summary of one user's habit-tracking stats for the current month — never raw dates or personal notes, just aggregated numbers and habit names.

Respond with ONLY a JSON object, no markdown fences, no explanation, matching exactly this shape:
{
  "focusOn": string[],   // 1 to 3 items — habits or patterns most worth attention right now
  "keepGoing": string[], // 1 to 2 items — what's genuinely working, worth reinforcing
  "easeUp": string[]     // 0 to 2 items — only if something looks like overreach or burnout risk; omit (empty array) otherwise, don't invent one
}

Rules for every item:
- At most 2 short sentences, specific and concrete — reference an actual habit name or number from the stats, never generic filler like "keep up the good work."
- Encouraging tone even when pointing out a slip — this is a coach, not a scold.
- Never mention data you weren't given (no notes, friends, or anything outside the stats JSON).
- Base every claim strictly on the numbers given — don't speculate beyond them.`
}

export function buildUserPrompt(stats: HabitInsightStats): string {
  return JSON.stringify(stats)
}
